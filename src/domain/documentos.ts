export const ESTADOS_COMPRA = ["borrador", "recibida"] as const;
export const ESTADOS_VENTA = ["confirmada", "anulada"] as const;
export const TIPOS_VENTA = ["contado", "credito"] as const;
export const ESTADOS_CUENTA = ["abierta", "pagada", "cancelada"] as const;
export const ORIGENES_STOCK = ["compra", "venta", "anulacion"] as const;
export const DIRECCIONES_STOCK = ["entrada", "salida"] as const;
export const TIPOS_CAJA = ["venta_contado", "abono", "reverso_venta"] as const;

export type EstadoCompra = (typeof ESTADOS_COMPRA)[number];
export type EstadoVenta = (typeof ESTADOS_VENTA)[number];
export type TipoVenta = (typeof TIPOS_VENTA)[number];
export type EstadoCuenta = (typeof ESTADOS_CUENTA)[number];
export type OrigenStock = (typeof ORIGENES_STOCK)[number];
export type DireccionStock = (typeof DIRECCIONES_STOCK)[number];
export type TipoCaja = (typeof TIPOS_CAJA)[number];

export interface LineaCompra {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
}

export interface Compra {
  id: string;
  proveedor: string;
  estado: EstadoCompra;
  lineas: LineaCompra[];
  recibidaEn: string | null;
}

export interface LineaVenta {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

interface VentaBase {
  id: string;
  cliente: string;
  estado: EstadoVenta;
  lineas: LineaVenta[];
  total: number;
  ocurridoEn: string;
}

export interface VentaContado extends VentaBase {
  tipo: "contado";
}

export interface VentaCredito extends VentaBase {
  tipo: "credito";
  vencimiento: string;
}

export type Venta = VentaContado | VentaCredito;

export interface MovimientoStock {
  id: string;
  productoId: string;
  direccion: DireccionStock;
  cantidad: number;
  origen: OrigenStock;
  origenId: string;
  ocurridoEn: string;
}

export interface CuentaPorCobrar {
  id: string;
  ventaId: string;
  cliente: string;
  monto: number;
  saldo: number;
  vencimiento: string;
  estado: EstadoCuenta;
}

export interface Abono {
  id: string;
  cuentaId: string;
  monto: number;
  ocurridoEn: string;
}

export interface MovimientoCaja {
  id: string;
  tipo: TipoCaja;
  monto: number;
  origenId: string;
  ocurridoEn: string;
}

export interface Cierre {
  id: string;
  fecha: string;
  efectivoContado: number;
  esperado: number;
  diferencia: number;
}
