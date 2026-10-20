import type { MovimientoStock } from "../domain/documentos.ts";
import type { Inventario } from "../domain/inventario.ts";

export function kardex(inventario: Inventario, productoId: string): MovimientoStock[] {
  const id = inventario.obtener(productoId).id;
  return inventario.listarMovimientos().filter((movimiento) => movimiento.productoId === id);
}
