import { ReglaNegocio } from "./errores.ts";

const INSTANTE = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function partirInstante(valor: string): { fecha: string; instante: string } {
  const coincidencia = INSTANTE.exec(valor);
  const fecha = coincidencia?.[1];
  if (fecha === undefined || Number.isNaN(Date.parse(valor))) {
    throw new ReglaNegocio("instante-invalido", "El instante se guarda en ISO-8601 UTC.");
  }
  return { fecha, instante: valor };
}

export function exigirFecha(valor: string): string {
  const coincidencia = DIA.exec(valor);
  if (coincidencia === null) {
    throw new ReglaNegocio("fecha-invalida", "La fecha tiene la forma YYYY-MM-DD.");
  }
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    throw new ReglaNegocio("fecha-invalida", "La fecha tiene la forma YYYY-MM-DD.");
  }
  return valor;
}
