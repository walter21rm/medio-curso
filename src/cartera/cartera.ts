import type { Abono, CuentaPorCobrar } from "../domain/documentos.ts";
import type { EstadoMostrador } from "../domain/estado.ts";
import { exigirDiaAbierto } from "../domain/estado.ts";
import { ReglaNegocio } from "../domain/errores.ts";
import { exigirFecha, partirInstante } from "../domain/fecha.ts";
import { exigirId } from "../domain/producto.ts";
import { Dinero } from "../domain/dinero.ts";

export interface EntradaAbono {
  id: string;
  cuentaId: string;
  monto: number;
  ocurridoEn: string;
}

export function abonar(estado: EstadoMostrador, entrada: EntradaAbono): Abono {
  const id = exigirId(entrada.id);
  if (estado.abonos.some((abono) => abono.id === id)) {
    throw new ReglaNegocio("abono-duplicado", "Ese abono ya está registrado.");
  }
  const { fecha, instante } = partirInstante(entrada.ocurridoEn);
  exigirDiaAbierto(estado.cierres, fecha);
  const cuenta = estado.cuentas.get(exigirId(entrada.cuentaId));
  if (cuenta === undefined) {
    throw new ReglaNegocio("cuenta-inexistente", "Esa cuenta no existe.");
  }
  if (cuenta.estado !== "abierta") {
    throw new ReglaNegocio("cuenta-cerrada", "Solo se abona una cuenta abierta.");
  }
  const monto = Dinero.positivo(entrada.monto).centavos;
  if (monto > cuenta.saldo) {
    throw new ReglaNegocio("saldo-insuficiente", "El abono no puede pasar el saldo.");
  }
  cuenta.saldo -= monto;
  if (cuenta.saldo === 0) {
    cuenta.estado = "pagada";
  }
  const abono: Abono = { id, cuentaId: cuenta.id, monto, ocurridoEn: instante };
  estado.abonos.push(abono);
  estado.caja.push({
    id: `caja-${abono.id}`,
    tipo: "abono",
    monto: abono.monto,
    origenId: abono.id,
    ocurridoEn: instante,
  });
  return abono;
}

export function cobranzaVencida(estado: EstadoMostrador, hoy: string): CuentaPorCobrar[] {
  const fecha = exigirFecha(hoy);
  return [...estado.cuentas.values()]
    .filter((cuenta) => cuenta.estado === "abierta" && cuenta.saldo > 0 && cuenta.vencimiento < fecha)
    .map((cuenta) => ({ ...cuenta }))
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento) || a.id.localeCompare(b.id));
}
