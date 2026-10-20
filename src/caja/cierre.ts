import type { Cierre, MovimientoCaja } from "../domain/documentos.ts";
import type { EstadoMostrador } from "../domain/estado.ts";
import { ReglaNegocio } from "../domain/errores.ts";
import { Dinero } from "../domain/dinero.ts";
import { exigirFecha, partirInstante } from "../domain/fecha.ts";
import { exigirId } from "../domain/producto.ts";

export interface EntradaCierre {
  id: string;
  fecha: string;
  efectivoContado: number;
}

export function cerrarCaja(estado: EstadoMostrador, entrada: EntradaCierre): Cierre {
  const id = exigirId(entrada.id);
  const fecha = exigirFecha(entrada.fecha);
  if ([...estado.cierres.values()].some((cierre) => cierre.id === id)) {
    throw new ReglaNegocio("cierre-duplicado", "Ese cierre ya está registrado.");
  }
  if (estado.cierres.has(fecha)) {
    throw new ReglaNegocio("cierre-duplicado", "Ese día ya tiene cierre.");
  }
  const efectivoContado = Dinero.desdeCentavos(entrada.efectivoContado).centavos;
  const esperado = esperadoDelDia(estado.caja, fecha);
  const cierre: Cierre = {
    id,
    fecha,
    efectivoContado,
    esperado,
    diferencia: efectivoContado - esperado,
  };
  estado.cierres.set(fecha, cierre);
  return { ...cierre };
}

function esperadoDelDia(caja: readonly MovimientoCaja[], fecha: string): number {
  let total = 0;
  for (const movimiento of caja) {
    if (partirInstante(movimiento.ocurridoEn).fecha !== fecha) {
      continue;
    }
    if (movimiento.tipo === "reverso_venta") {
      total -= movimiento.monto;
      continue;
    }
    total += movimiento.monto;
  }
  return total;
}
