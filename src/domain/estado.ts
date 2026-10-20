import type { Abono, Cierre, CuentaPorCobrar, MovimientoCaja, Venta } from "./documentos.ts";
import { ReglaNegocio } from "./errores.ts";
import { Inventario } from "./inventario.ts";

export interface EstadoMostrador {
  inventario: Inventario;
  ventas: Map<string, Venta>;
  cuentas: Map<string, CuentaPorCobrar>;
  abonos: Abono[];
  caja: MovimientoCaja[];
  cierres: Map<string, Cierre>;
}

export function exigirDiaAbierto(cierres: ReadonlyMap<string, Cierre>, fecha: string): void {
  if (cierres.has(fecha)) {
    throw new ReglaNegocio("dia-cerrado", "Ese día ya está cerrado.");
  }
}
