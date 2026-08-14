import React from 'react';
import { Venta, Cliente, Mascota, VentaProducto } from '../types'; // Assuming types are in ../types
import { APP_TITLE } from '../constants'; // Assuming constants are in ../constants

// Augment VentaProducto for the receipt to include the product name
interface ReceiptVentaProducto extends VentaProducto {
  nombre: string;
}

interface PrintableReceiptProps {
  venta: Venta;
  client: Cliente | undefined;
  pet: Mascota | undefined;
  ventaProductos: ReceiptVentaProducto[]; // Use the augmented type
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ venta, client, pet, ventaProductos }) => {
  return (
    <div className="p-2 font-sans text-xs" style={{ width: '280px', margin: '0 auto' }}> {/* Typical receipt width */}
      <div className="text-center mb-3">
        <h1 className="text-base font-bold">{APP_TITLE}</h1>
        {/* Optional: Add address, phone number here */}
        <p className="text-xs">Fecha: {new Date(venta.fecha).toLocaleString()}</p>
        <p className="text-xs">Ticket ID: {venta.id_venta.substring(0, 8)}</p>
      </div>

      {client && (
        <div className="mb-2">
          <p className="font-semibold">Cliente: {client.nombre}</p>
          {pet && <p>Mascota: {pet.nombre} ({pet.especie})</p>}
        </div>
      )}

      <table className="w-full mb-2 text-xs">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left pb-1">Producto</th>
            <th className="text-center pb-1">Cant.</th>
            <th className="text-right pb-1">P.Unit.</th>
            <th className="text-right pb-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {ventaProductos.map(item => (
            <tr key={item.producto_id} className="border-b border-dotted border-gray-400">
              <td className="py-0.5">{item.nombre}</td>
              <td className="text-center py-0.5">{item.cantidad}</td>
              <td className="text-right py-0.5">${item.precio_unitario.toFixed(2)}</td>
              <td className="text-right py-0.5">${(item.precio_unitario * item.cantidad).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 pt-1 border-t border-dashed border-black">
        <div className="flex justify-between font-semibold">
          <span>TOTAL:</span>
          <span>${venta.total.toFixed(2)}</span>
        </div>
      </div>

      {venta.estado === 'Pagada' && (
         <p className="text-center font-semibold mt-1">PAGADO</p>
      )}
      
      <p className="text-center text-xs mt-3">¡Gracias por su compra!</p>
      {/* Optional: Add website or other info */}
    </div>
  );
};