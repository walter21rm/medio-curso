import type { LineaVenta, Venta, VentaContado, VentaCredito } from "../domain/documentos.ts";
import type { EstadoMostrador } from "../domain/estado.ts";
import { exigirDiaAbierto } from "../domain/estado.ts";
import { ReglaNegocio } from "../domain/errores.ts";
import { exigirFecha, partirInstante } from "../domain/fecha.ts";
import { exigirCantidad, exigirId, exigirTexto } from "../domain/producto.ts";

export interface LineaPedida {
  productoId: string;
  cantidad: number;
}

export interface EntradaContado {
  id: string;
  cliente: string;
  lineas: readonly LineaPedida[];
  ocurridoEn: string;
}

export interface EntradaCredito extends EntradaContado {
  vencimiento: string;
}

interface Preparada {
  cliente: string;
  instante: string;
  lineas: LineaVenta[];
  total: number;
}

export function venderContado(estado: EstadoMostrador, entrada: EntradaContado): VentaContado {
  const preparada = preparar(estado, entrada);
  const venta: VentaContado = {
    id: exigirId(entrada.id),
    cliente: preparada.cliente,
    tipo: "contado",
    estado: "confirmada",
    lineas: preparada.lineas,
    total: preparada.total,
    ocurridoEn: preparada.instante,
  };
  estado.ventas.set(venta.id, venta);
  estado.caja.push({
    id: `caja-${venta.id}`,
    tipo: "venta_contado",
    monto: venta.total,
    origenId: venta.id,
    ocurridoEn: venta.ocurridoEn,
  });
  return venta;
}

export function venderCredito(estado: EstadoMostrador, entrada: EntradaCredito): VentaCredito {
  const vencimiento = exigirFecha(entrada.vencimiento);
  const preparada = preparar(estado, entrada);
  const venta: VentaCredito = {
    id: exigirId(entrada.id),
    cliente: preparada.cliente,
    tipo: "credito",
    estado: "confirmada",
    lineas: preparada.lineas,
    total: preparada.total,
    vencimiento,
    ocurridoEn: preparada.instante,
  };
  estado.ventas.set(venta.id, venta);
  estado.cuentas.set(`cxc-${venta.id}`, {
    id: `cxc-${venta.id}`,
    ventaId: venta.id,
    cliente: venta.cliente,
    monto: venta.total,
    saldo: venta.total,
    vencimiento,
    estado: "abierta",
  });
  return venta;
}

export function anularVenta(estado: EstadoMostrador, id: string, ocurridoEn: string): Venta {
  const venta = estado.ventas.get(exigirId(id));
  if (venta === undefined) {
    throw new ReglaNegocio("venta-inexistente", "Esa venta no existe.");
  }
  if (venta.estado === "anulada") {
    throw new ReglaNegocio("venta-anulada", "Esa venta ya está anulada.");
  }
  const { fecha, instante } = partirInstante(ocurridoEn);
  exigirDiaAbierto(estado.cierres, fecha);
  for (const linea of venta.lineas) {
    estado.inventario.reponer(linea.productoId, linea.cantidad, "anulacion", venta.id, instante);
  }
  if (venta.tipo === "contado") {
    estado.caja.push({
      id: `reverso-${venta.id}`,
      tipo: "reverso_venta",
      monto: venta.total,
      origenId: venta.id,
      ocurridoEn: instante,
    });
  } else {
    const cuenta = exigirCuenta(estado, venta.id);
    cuenta.estado = "cancelada";
    cuenta.saldo = 0;
  }
  const anulada: Venta = { ...venta, estado: "anulada" };
  estado.ventas.set(venta.id, anulada);
  return anulada;
}

function preparar(estado: EstadoMostrador, entrada: EntradaContado): Preparada {
  const id = exigirId(entrada.id);
  if (estado.ventas.has(id)) {
    throw new ReglaNegocio("venta-duplicada", "Esa venta ya está registrada.");
  }
  const { fecha, instante } = partirInstante(entrada.ocurridoEn);
  exigirDiaAbierto(estado.cierres, fecha);
  const cliente = exigirTexto(entrada.cliente, "El cliente");
  if (entrada.lineas.length === 0) {
    throw new ReglaNegocio("venta-vacia", "La venta lleva al menos un producto.");
  }
  const cantidades = new Map<string, number>();
  for (const linea of entrada.lineas) {
    const cantidad = exigirCantidad(linea.cantidad);
    const previo = cantidades.get(linea.productoId) ?? 0;
    cantidades.set(linea.productoId, previo + cantidad);
  }
  const lineas: LineaVenta[] = [];
  let total = 0;
  for (const [productoId, cantidad] of cantidades) {
    const producto = estado.inventario.obtener(productoId);
    if (producto.existencia < cantidad) {
      throw new ReglaNegocio("existencia-insuficiente", "No se vende más de lo que hay.");
    }
    lineas.push({ productoId, cantidad, precioUnitario: producto.precio });
    total += cantidad * producto.precio;
  }
  for (const linea of lineas) {
    estado.inventario.descontar(linea.productoId, linea.cantidad, "venta", id, instante);
  }
  return { cliente, instante, lineas, total };
}

function exigirCuenta(estado: EstadoMostrador, ventaId: string) {
  const cuenta = estado.cuentas.get(`cxc-${ventaId}`);
  if (cuenta === undefined) {
    throw new ReglaNegocio("cuenta-inexistente", "Esa venta a crédito no tiene cuenta.");
  }
  return cuenta;
}
