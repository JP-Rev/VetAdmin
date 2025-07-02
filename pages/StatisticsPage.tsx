import React, { useMemo } from 'react';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { TipoEventoHistorial, CategoriaGasto } from '../types';
import { BarChart3, Activity, Stethoscope, ShoppingCart, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

const StatDisplayCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <div className="flex items-start mb-3">
      <span className="p-2 bg-primary-100 text-primary-600 rounded-full mr-3">{icon}</span>
      <h2 className="text-xl font-semibold text-secondary-700">{title}</h2>
    </div>
    <div className="space-y-2 text-sm text-secondary-600">
      {children}
    </div>
  </div>
);

export const StatisticsPage: React.FC = () => {
  const { medicalHistory, petSurgeries, surgeries, ventas, products, expenses } = useSupabaseData(); // Changed from useData to useSupabaseData

  const surgeryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalRevenue: number; name: string }> = {};
    petSurgeries.forEach(ps => {
      const surgeryInfo = surgeries.find(s => s.id_cirugia === ps.cirugia_id);
      if (surgeryInfo) {
        if (!stats[ps.cirugia_id]) {
          stats[ps.cirugia_id] = { count: 0, totalRevenue: 0, name: surgeryInfo.tipo };
        }
        stats[ps.cirugia_id].count++;
        stats[ps.cirugia_id].totalRevenue += ps.costo_final || surgeryInfo.costo_estimado || 0;
      }
    });
    return {
      totalSurgeries: petSurgeries.length,
      byType: Object.values(stats).sort((a,b) => b.count - a.count),
    };
  }, [petSurgeries, surgeries]);

  const medicalEventStats = useMemo(() => {
    const stats: Record<TipoEventoHistorial, number> = {} as Record<TipoEventoHistorial, number>;
    Object.values(TipoEventoHistorial).forEach(type => stats[type] = 0);
    medicalHistory.forEach(event => {
      stats[event.tipo_evento]++;
    });
    return Object.entries(stats).map(([type, count]) => ({ type: type as TipoEventoHistorial, count })).sort((a,b) => b.count - a.count);
  }, [medicalHistory]);

  const productSalesStats = useMemo(() => {
    const productAggregates: Record<string, { quantity: number; revenue: number; name: string }> = {};
    let totalRevenue = 0;
    let totalProductsSoldCount = 0;

    ventas.filter(v => v.estado !== 'Cancelada').forEach(venta => { // Renamed order to venta
      venta.productos.forEach(item => {
        const productInfo = products.find(p => p.id_producto === item.producto_id);
        if (productInfo) {
          if (!productAggregates[item.producto_id]) {
            productAggregates[item.producto_id] = { quantity: 0, revenue: 0, name: productInfo.nombre };
          }
          productAggregates[item.producto_id].quantity += item.cantidad;
          productAggregates[item.producto_id].revenue += item.cantidad * item.precio_unitario;
          totalRevenue += item.cantidad * item.precio_unitario;
          totalProductsSoldCount += item.cantidad;
        }
      });
    });
    const allProductSales = Object.values(productAggregates);
    return {
      totalRevenue,
      totalProductsSoldCount,
      topByQuantity: [...allProductSales].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
      topByRevenue: [...allProductSales].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }, [ventas, products]); // Renamed orders to ventas

  const expenseStats = useMemo(() => {
    const stats: Record<CategoriaGasto, number> = {} as Record<CategoriaGasto, number>;
    Object.values(CategoriaGasto).forEach(cat => stats[cat] = 0);
    let totalExpenses = 0;
    expenses.forEach(expense => {
      stats[expense.categoria] = (stats[expense.categoria] || 0) + expense.monto;
      totalExpenses += expense.monto;
    });
     return {
      totalExpenses,
      byCategory: Object.entries(stats).map(([category, amount]) => ({ category: category as CategoriaGasto, amount })).filter(item => item.amount > 0).sort((a,b) => b.amount - a.amount),
    };
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-secondary-800">Estadísticas Generales</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatDisplayCard title="Cirugías" icon={<Activity size={20} />}>
          {surgeryStats.totalSurgeries > 0 ? (
            <>
              <p><strong>Total Realizadas:</strong> {surgeryStats.totalSurgeries}</p>
              <p><strong>Ingreso Total Estimado por Cirugías:</strong> ${surgeryStats.byType.reduce((sum, s) => sum + s.totalRevenue, 0).toFixed(2)}</p>
              <h4 className="font-semibold mt-2 mb-1 text-secondary-700">Desglose por Tipo:</h4>
              {surgeryStats.byType.length > 0 ? (
                <ul className="list-disc list-inside pl-1 max-h-48 overflow-y-auto">
                  {surgeryStats.byType.map(s => (
                    <li key={s.name}>{s.name}: {s.count} (Ingresos: ${s.totalRevenue.toFixed(2)})</li>
                  ))}
                </ul>
              ) : <p>No hay cirugías registradas.</p>}
            </>
          ) : <p>No hay datos de cirugías para mostrar.</p>}
        </StatDisplayCard>

        <StatDisplayCard title="Eventos Médicos (Historial)" icon={<Stethoscope size={20} />}>
          {medicalEventStats.some(stat => stat.count > 0) ? (
            <ul className="list-disc list-inside pl-1 max-h-60 overflow-y-auto">
              {medicalEventStats.filter(stat => stat.count > 0).map(stat => (
                <li key={stat.type}>{stat.type}: {stat.count}</li>
              ))}
            </ul>
          ) : <p>No hay eventos médicos registrados.</p>}
        </StatDisplayCard>

        <StatDisplayCard title="Ventas de Productos e Insumos" icon={<ShoppingCart size={20} />}>
          {productSalesStats.totalProductsSoldCount > 0 ? (
            <>
              <p><strong>Ingresos Totales por Productos:</strong> ${productSalesStats.totalRevenue.toFixed(2)}</p>
              <p><strong>Cantidad Total de Productos Vendidos:</strong> {productSalesStats.totalProductsSoldCount}</p>
              
              <h4 className="font-semibold mt-3 mb-1 text-secondary-700">Top 5 Productos por Cantidad Vendida:</h4>
              {productSalesStats.topByQuantity.length > 0 ? (
                <ul className="list-disc list-inside pl-1">
                  {productSalesStats.topByQuantity.map(p => <li key={`qty-${p.name}`}>{p.name}: {p.quantity} unidades</li>)}
                </ul>
              ) : <p>No hay suficientes datos.</p>}

              <h4 className="font-semibold mt-3 mb-1 text-secondary-700">Top 5 Productos por Ingresos Generados:</h4>
              {productSalesStats.topByRevenue.length > 0 ? (
                <ul className="list-disc list-inside pl-1">
                  {productSalesStats.topByRevenue.map(p => <li key={`rev-${p.name}`}>{p.name}: ${p.revenue.toFixed(2)}</li>)}
                </ul>
              ) : <p>No hay suficientes datos.</p>}
            </>
          ) : <p>No hay datos de ventas de productos para mostrar.</p>}
        </StatDisplayCard>

        <StatDisplayCard title="Gastos" icon={<DollarSign size={20} />}>
            {expenseStats.totalExpenses > 0 ? (
                <>
                    <p><strong>Gasto Total Registrado:</strong> ${expenseStats.totalExpenses.toFixed(2)}</p>
                    <h4 className="font-semibold mt-2 mb-1 text-secondary-700">Desglose por Categoría:</h4>
                    {expenseStats.byCategory.length > 0 ? (
                        <ul className="list-disc list-inside pl-1 max-h-48 overflow-y-auto">
                            {expenseStats.byCategory.map(e => (
                                <li key={e.category}>{e.category}: ${e.amount.toFixed(2)}</li>
                            ))}
                        </ul>
                    ) : <p>No hay gastos registrados por categoría.</p>}
                </>
            ) : <p>No hay datos de gastos para mostrar.</p>}
        </StatDisplayCard>
      </div>
       {(surgeryStats.totalSurgeries === 0 && medicalEventStats.every(s => s.count === 0) && productSalesStats.totalProductsSoldCount === 0 && expenseStats.totalExpenses === 0) &&
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700 flex items-center rounded-md shadow">
            <AlertTriangle className="h-6 w-6 mr-3"/>
            <div>
                <p className="font-semibold">No hay datos suficientes para generar estadísticas.</p>
                <p>A medida que utilice la aplicación y registre información, las estadísticas aparecerán aquí.</p>
            </div>
        </div>
        }
    </div>
  );
};