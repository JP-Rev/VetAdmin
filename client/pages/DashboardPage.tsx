import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../contexts/SupabaseDataContext';
import { Turno, EstadoVenta, EstadoTurno } from '../types';
import {
  CalendarDays, Users, PawPrint, ShoppingCart, ArrowUpRight, ArrowRight,
  CalendarCheck, ChevronRight, TrendingUp, TrendingDown, Calendar, BarChart3,
} from 'lucide-react';
import { SpeciesIcon } from '../lib/speciesIcon';

const todayISO = () => new Date().toISOString().split('T')[0];

/** Venta.fecha es un timestamp ISO completo (a diferencia de turnos/gastos, que son YYYY-MM-DD). */
const ventaDay = (fecha: string) => fecha.split('T')[0];

const fmtMoney = (n: number) =>
  '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Devuelve los últimos `days` días como YYYY-MM-DD, del más viejo al más nuevo. */
const lastNDays = (days: number): string[] => {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
};

/** Normaliza una serie a alturas porcentuales para el sparkline. */
const toBars = (values: number[]): string[] => {
  const max = Math.max(...values, 1);
  return values.map(v => `${Math.max(8, Math.round((v / max) * 100))}%`);
};

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  delta?: string;
  spark: string[];
  linkTo: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, unit, delta, spark, linkTo }) => (
  <Link
    to={linkTo}
    className="bg-surface border border-secondary-200 rounded-2xl px-[18px] pt-[18px] pb-4 flex flex-col gap-3.5
               shadow-[0_1px_2px_rgba(15,31,29,0.04)] hover:shadow-[0_14px_30px_-18px_rgba(15,31,29,0.35)]
               hover:border-secondary-300 transition-all duration-200"
  >
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2.5 text-[12.5px] font-semibold text-secondary-600 min-w-0">
        <span className="flex-shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      {delta && (
        <span className="font-mono text-[10.5px] font-semibold px-[7px] py-[3px] rounded-full bg-primary-50 text-primary-700 flex-shrink-0">
          {delta}
        </span>
      )}
    </div>
    <div className="flex items-baseline gap-[7px]">
      <strong className="text-[34px] font-extrabold tracking-[-1.4px] tabular-nums text-secondary-900 leading-none">
        {value}
      </strong>
      <span className="text-xs text-secondary-500">{unit}</span>
    </div>
    <div className="flex items-end gap-1 h-[34px]" aria-hidden="true">
      {spark.map((h, i) => (
        <span key={i} className="flex-1 flex flex-col justify-end h-full">
          <span className="w-full rounded-t-[3px] rounded-b-[1px] bg-primary-200 block" style={{ height: h }} />
        </span>
      ))}
    </div>
  </Link>
);

interface RankItem {
  label: string;
  value: string;
  hint?: string;
  /** 0..1 respecto del primero de la lista, para el largo de la barra. */
  ratio: number;
  warn?: boolean;
}

/** Ranking compacto con barra proporcional: reemplaza las listas con viñetas
 *  que tenía la página de Estadísticas. */
const RankCard: React.FC<{
  title: string;
  subtitle: string;
  items: RankItem[];
  emptyText: string;
}> = ({ title, subtitle, items, emptyText }) => (
  <section className="bg-surface border border-secondary-200 rounded-[18px] px-5 py-[18px]
                      shadow-[0_1px_2px_rgba(15,31,29,0.04)] flex flex-col gap-3.5">
    <div>
      <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.3px] text-secondary-900">{title}</h2>
      <p className="mt-0.5 mb-0 text-[12.5px] text-secondary-500">{subtitle}</p>
    </div>

    {items.length > 0 ? (
      <ul className="flex flex-col gap-3 m-0 p-0 list-none">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium text-secondary-800 truncate">{it.label}</span>
              <span className="flex items-baseline gap-1.5 flex-shrink-0">
                {it.hint && <span className="text-[11px] text-secondary-500">{it.hint}</span>}
                <span className="font-mono text-[12px] font-semibold text-secondary-900">{it.value}</span>
              </span>
            </div>
            <span className="h-1.5 rounded-full bg-secondary-100 block overflow-hidden">
              <span
                className={`block h-full rounded-full ${it.warn ? 'bg-[#fb923c]' : 'bg-primary-600'}`}
                style={{ width: `${Math.max(4, Math.round(it.ratio * 100))}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="m-0 py-6 text-center text-[13px] text-secondary-500">{emptyText}</p>
    )}
  </section>
);

const AgendaRow: React.FC<{ appointment: Turno }> = ({ appointment }) => {
  const { getClientById, getPetById } = useSupabaseData();
  const client = getClientById(appointment.cliente_id);
  const pet = getPetById(appointment.mascota_id);

  const badge: Record<string, string> = {
    [EstadoTurno.PENDIENTE]: 'bg-secondary-100 text-secondary-600',
    [EstadoTurno.ATENDIDO]: 'bg-primary-50 text-primary-700',
    [EstadoTurno.AUSENTE]: 'bg-warning-50 text-warning-700',
    [EstadoTurno.CANCELADO]: 'bg-error-50 text-error-700',
  };

  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50 transition-colors">
      <span className="font-mono text-[13px] font-semibold text-primary-700 w-12 flex-shrink-0">
        {appointment.hora}
      </span>
      <span className="w-9 h-9 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
        <SpeciesIcon especie={pet?.especie} size={17} />
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <strong className="text-[13.5px] font-bold text-secondary-900 truncate">{appointment.motivo}</strong>
        <span className="text-[12.5px] text-secondary-500 truncate">
          {client?.nombre ?? 'Cliente desconocido'} · {pet?.nombre ?? 'Mascota desconocida'}
          {pet?.especie ? ` (${pet.especie})` : ''}
        </span>
      </span>
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${badge[appointment.estado] ?? badge[EstadoTurno.PENDIENTE]}`}>
        {appointment.estado}
      </span>
      <Link
        to="/appointments"
        aria-label={`Ver turno de ${appointment.hora}`}
        className="w-[30px] h-[30px] border border-secondary-200 bg-surface rounded-[9px] text-secondary-500
                   hover:border-secondary-300 hover:text-secondary-900 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <ChevronRight size={15} />
      </Link>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const {
    clients, pets, appointments, ventas, products, clinica, expenses,
    petSurgeries, surgeries, getDailyCashFlowReport,
  } = useSupabaseData();
  const navigate = useNavigate();

  const today = todayISO();
  const days8 = React.useMemo(() => lastNDays(8), []);

  const todayAppointments = React.useMemo(
    () => appointments.filter(a => a.fecha === today).sort((a, b) => a.hora.localeCompare(b.hora)),
    [appointments, today]
  );

  const pendingVentas = ventas.filter(v => v.estado === EstadoVenta.PENDIENTE);
  const pendingTotal = pendingVentas.reduce((sum, v) => sum + v.total, 0);

  // Sparklines desde datos reales: altas por día en los últimos 8 días.
  const clientSpark = toBars(days8.map(d => clients.filter(c => c.createdAt === d).length));
  const petSpark = toBars(days8.map(d => pets.filter(p => p.createdAt === d).length));
  const turnoSpark = toBars(days8.map(d => appointments.filter(a => a.fecha === d).length));
  const ventaSpark = toBars(days8.map(d => ventas.filter(v => ventaDay(v.fecha) === d).length));

  // Altas del mes en curso
  const monthPrefix = today.slice(0, 7);
  const newClientsThisMonth = clients.filter(c => c.createdAt?.startsWith(monthPrefix)).length;
  const newPetsThisMonth = pets.filter(p => p.createdAt?.startsWith(monthPrefix)).length;
  const confirmedToday = todayAppointments.filter(a => a.estado === EstadoTurno.ATENDIDO).length;

  const cash = getDailyCashFlowReport(today);
  const incomeEntries = Object.entries(cash.incomeByMethod).filter(([, v]) => (v ?? 0) > 0);
  const expenseEntries = Object.entries(cash.expensesByCategory).filter(([, v]) => (v ?? 0) > 0);
  const cashTotal = cash.totalIncome + cash.totalExpenses;
  const incomePct = cashTotal > 0 ? (cash.totalIncome / cashTotal) * 100 : 50;

  // Ventas de los últimos 7 días
  const week = React.useMemo(() => {
    const dias = lastNDays(7);
    const totals = dias.map(d => ventas.filter(v => ventaDay(v.fecha) === d).reduce((s, v) => s + v.total, 0));
    const max = Math.max(...totals, 1);
    return dias.map((d, i) => ({
      dia: new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' }),
      height: `${Math.max(4, Math.round((totals[i] / max) * 100))}%`,
      total: totals[i],
    }));
  }, [ventas]);

  // Rankings acumulados: reemplazan a la pagina de Estadisticas, que mostraba
  // lo mismo en listas largas y en una pantalla aparte.
  const topProductos = React.useMemo(() => {
    const acc: Record<string, { nombre: string; unidades: number; ingresos: number }> = {};
    ventas.filter(v => v.estado !== EstadoVenta.CANCELADA).forEach(v => {
      v.productos.forEach(item => {
        const p = products.find(x => x.id_producto === item.producto_id);
        if (!p) return;
        acc[item.producto_id] ??= { nombre: p.nombre, unidades: 0, ingresos: 0 };
        acc[item.producto_id].unidades += item.cantidad;
        acc[item.producto_id].ingresos += item.cantidad * item.precio_unitario;
      });
    });
    return Object.values(acc).sort((a, b) => b.ingresos - a.ingresos).slice(0, 5);
  }, [ventas, products]);

  const topCirugias = React.useMemo(() => {
    const acc: Record<string, { nombre: string; cantidad: number }> = {};
    petSurgeries.forEach(ps => {
      const s = surgeries.find(x => x.id_cirugia === ps.cirugia_id);
      if (!s) return;
      acc[ps.cirugia_id] ??= { nombre: s.tipo, cantidad: 0 };
      acc[ps.cirugia_id].cantidad++;
    });
    return Object.values(acc).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  }, [petSurgeries, surgeries]);

  const gastosPorCategoria = React.useMemo(() => {
    const acc: Record<string, number> = {};
    expenses.forEach(g => { acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto; });
    return Object.entries(acc)
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);
  }, [expenses]);

  const lowStock = React.useMemo(
    () => [...products].filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 5),
    [products]
  );

  const hoyLabel = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Encabezado */}
      <div className="flex items-end justify-between gap-5 flex-wrap">
        <div>
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-secondary-500">
            {hoyLabel}
          </span>
          <h1 className="mt-1.5 mb-1 text-[30px] font-extrabold tracking-[-0.8px] text-secondary-900 leading-tight">
            {clinica.nombre}
          </h1>
          <p className="m-0 text-sm text-secondary-600">
            Resumen operativo de la clínica y flujo de caja del día.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
        <KpiCard
          icon={<Users size={15} />} label="Clientes activos" value={clients.length} unit="registrados"
          delta={newClientsThisMonth > 0 ? `+${newClientsThisMonth} este mes` : undefined}
          spark={clientSpark} linkTo="/clients"
        />
        <KpiCard
          icon={<PawPrint size={15} />} label="Mascotas" value={pets.length} unit="fichas"
          delta={newPetsThisMonth > 0 ? `+${newPetsThisMonth} este mes` : undefined}
          spark={petSpark} linkTo="/pets"
        />
        <KpiCard
          icon={<CalendarDays size={15} />} label="Turnos de hoy" value={todayAppointments.length} unit="agendados"
          delta={confirmedToday > 0 ? `${confirmedToday} atendidos` : undefined}
          spark={turnoSpark} linkTo="/appointments"
        />
        <KpiCard
          icon={<ShoppingCart size={15} />} label="Ventas pendientes" value={pendingVentas.length} unit="por cobrar"
          delta={pendingTotal > 0 ? fmtMoney(pendingTotal) : undefined}
          spark={ventaSpark} linkTo="/ventas"
        />
      </div>

      {/* Agenda + Flujo de caja */}
      <div className="grid gap-[18px] grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <section className="bg-surface border border-secondary-200 rounded-[18px] shadow-[0_1px_2px_rgba(15,31,29,0.04)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 pt-[18px] pb-3.5 border-b border-secondary-100">
            <div>
              <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.3px] text-secondary-900">Agenda de hoy</h2>
              <p className="mt-0.5 mb-0 text-[12.5px] text-secondary-500">
                {todayAppointments.length === 0
                  ? 'Agenda libre'
                  : `${todayAppointments.length} ${todayAppointments.length === 1 ? 'turno' : 'turnos'}`}
              </p>
            </div>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-[9px]
                         bg-secondary-100 hover:bg-primary-50 text-secondary-700 hover:text-primary-700 transition-colors"
            >
              Ver calendario <ArrowUpRight size={14} />
            </Link>
          </div>

          {todayAppointments.length > 0 ? (
            <div className="flex flex-col max-h-[420px] overflow-y-auto">
              {todayAppointments.map(a => <AgendaRow key={a.id_turno} appointment={a} />)}
            </div>
          ) : (
            <div className="px-5 py-[54px] flex flex-col items-center gap-3 text-center">
              <span className="w-14 h-14 rounded-[18px] bg-secondary-100 text-primary-700 flex items-center justify-center">
                <CalendarCheck size={24} />
              </span>
              <strong className="text-[15px] text-secondary-900">Sin turnos agendados</strong>
              <p className="m-0 max-w-[300px] text-[13px] text-secondary-500">
                La agenda de hoy está libre. Cargá un turno para empezar.
              </p>
              <button
                onClick={() => navigate('/appointments?action=new')}
                className="mt-1 bg-primary-700 hover:bg-primary-800 text-white border-0 rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition-colors"
              >
                Agendar turno
              </button>
            </div>
          )}
        </section>

        <section className="rounded-[18px] p-5 flex flex-col gap-[18px] text-[#dcece9] bg-gradient-to-b from-[#0a2a27] to-[#0d3b36]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-[16.5px] font-bold text-white tracking-[-0.3px]">Flujo de caja</h2>
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] bg-white/[0.08] rounded-lg px-2.5 py-[5px] text-[#a8c6c2]">
              <Calendar size={12} />
              {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>

          <div>
            <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-[#6fa19b]">Saldo neto</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-[36px] font-extrabold text-white tracking-[-1.6px] tabular-nums leading-none">
                {fmtMoney(cash.netBalance)}
              </strong>
            </div>
          </div>

          <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
            <span className="bg-[#2dd4bf]" style={{ width: `${incomePct}%` }} />
            <span className="bg-[#fb923c]" style={{ width: `${100 - incomePct}%` }} />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-2 text-[#a8c6c2]">
                <TrendingUp size={14} className="text-[#2dd4bf]" />Ingresos
              </span>
              <strong className="font-mono text-[13px] text-white">{fmtMoney(cash.totalIncome)}</strong>
            </div>
            {incomeEntries.map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between text-xs pl-[22px] text-[#93b6b1]">
                <span>{method}</span>
                <span className="font-mono">{fmtMoney(amount ?? 0)}</span>
              </div>
            ))}

            <div className="h-px bg-white/[0.09]" />

            <div className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-2 text-[#a8c6c2]">
                <TrendingDown size={14} className="text-[#fb923c]" />Egresos
              </span>
              <strong className="font-mono text-[13px] text-white">{fmtMoney(cash.totalExpenses)}</strong>
            </div>
            {expenseEntries.map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between text-xs pl-[22px] text-[#93b6b1]">
                <span className="truncate pr-2">{cat}</span>
                <span className="font-mono flex-shrink-0">{fmtMoney(amount ?? 0)}</span>
              </div>
            ))}
          </div>

          <Link
            to="/ventas"
            className="mt-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/[0.16]
                       text-white border border-white/[0.12] rounded-[10px] py-2.5 text-[12.5px] font-bold transition-colors"
          >
            <BarChart3 size={15} />Ver detalle del día
          </Link>
        </section>
      </div>

      {/* Ventas de la semana + Stock bajo */}
      <div className="grid gap-[18px] grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <section className="bg-surface border border-secondary-200 rounded-[18px] px-5 pt-[18px] pb-5 shadow-[0_1px_2px_rgba(15,31,29,0.04)]">
          <div className="flex items-center justify-between gap-4 mb-[18px]">
            <div>
              <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.3px] text-secondary-900">Ventas de la semana</h2>
              <p className="mt-0.5 mb-0 text-[12.5px] text-secondary-500">Últimos 7 días facturados</p>
            </div>
          </div>
          <div className="flex items-end gap-3.5 h-[168px]">
            {week.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2.5 h-full">
                {/* Contenedor de altura definida: el % de la barra resuelve contra este. */}
                <div className="w-full max-w-[46px] flex-1 flex flex-col justify-end mx-auto">
                  <div
                    className="w-full rounded-t-[5px] bg-primary-700"
                    style={{ height: d.height }}
                    title={`${d.dia}: ${fmtMoney(d.total)}`}
                  />
                </div>
                <span className="font-mono text-[10.5px] text-secondary-500 capitalize flex-shrink-0">{d.dia}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface border border-secondary-200 rounded-[18px] px-5 py-[18px] shadow-[0_1px_2px_rgba(15,31,29,0.04)] flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.3px] text-secondary-900">Stock bajo</h2>
            {lowStock.length > 0 && (
              <span className="text-[11px] font-bold text-warning-700 bg-warning-50 px-2.5 py-1 rounded-full">
                {lowStock.length} {lowStock.length === 1 ? 'ítem' : 'ítems'}
              </span>
            )}
          </div>

          {lowStock.length > 0 ? (
            lowStock.map(p => (
              <div key={p.id_producto} className="flex flex-col gap-[7px]">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="text-[13px] font-semibold text-secondary-900 truncate">{p.nombre}</span>
                  <span className="font-mono text-[11.5px] text-secondary-500 flex-shrink-0">{p.stock} u.</span>
                </div>
                <span className="h-1.5 rounded-full bg-secondary-100 block overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-[#fb923c]"
                    style={{ width: `${Math.min(100, (p.stock / 10) * 100)}%` }}
                  />
                </span>
              </div>
            ))
          ) : (
            <p className="m-0 py-6 text-center text-[13px] text-secondary-500">
              Sin productos con stock bajo.
            </p>
          )}

          <Link to="/products" className="mt-auto inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary-700 hover:text-primary-800 transition-colors">
            Reponer inventario <ArrowRight size={14} />
          </Link>
        </section>
      </div>

      {/* Acumulados historicos (antes vivian en la pagina Estadisticas) */}
      <div className="grid gap-[18px] grid-cols-1 lg:grid-cols-3">
        <RankCard
          title="Productos más vendidos"
          subtitle="Por ingresos acumulados"
          items={topProductos.map(p => ({
            label: p.nombre,
            value: fmtMoney(p.ingresos),
            hint: `${p.unidades} u.`,
            ratio: topProductos[0].ingresos ? p.ingresos / topProductos[0].ingresos : 0,
          }))}
          emptyText="Todavía no hay ventas registradas."
        />
        <RankCard
          title="Cirugías más frecuentes"
          subtitle="Total histórico"
          items={topCirugias.map(c => ({
            label: c.nombre,
            value: String(c.cantidad),
            ratio: topCirugias[0].cantidad ? c.cantidad / topCirugias[0].cantidad : 0,
          }))}
          emptyText="Todavía no hay cirugías registradas."
        />
        <RankCard
          title="Gastos por categoría"
          subtitle="Total acumulado"
          items={gastosPorCategoria.map(g => ({
            label: g.categoria,
            value: fmtMoney(g.monto),
            ratio: gastosPorCategoria[0].monto ? g.monto / gastosPorCategoria[0].monto : 0,
            warn: true,
          }))}
          emptyText="Todavía no hay gastos registrados."
        />
      </div>
    </div>
  );
};
