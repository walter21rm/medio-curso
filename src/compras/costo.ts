import { Dinero } from "../domain/dinero.ts";
import { exigirCantidad } from "../domain/producto.ts";

// Promedio ponderado redondeado half-up al centavo, solo con enteros:
// floor((2 * suma + unidades) / (2 * unidades)) equivale a redondear suma / unidades.
export function costoPromedio(
  existencia: number,
  costoActual: number,
  cantidad: number,
  costoUnitario: number,
): number {
  const unidades = existencia + exigirCantidad(cantidad);
  const suma =
    existencia * Dinero.desdeCentavos(costoActual).centavos +
    cantidad * Dinero.desdeCentavos(costoUnitario).centavos;
  return Math.floor((2 * suma + unidades) / (2 * unidades));
}
