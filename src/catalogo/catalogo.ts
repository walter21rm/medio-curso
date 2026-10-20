import type { Inventario } from "../domain/inventario.ts";
import { crearProducto, type DatosProducto, type Producto } from "../domain/producto.ts";

export function altaProducto(inventario: Inventario, datos: DatosProducto): Producto {
  const producto = crearProducto(datos);
  inventario.poner(producto);
  return inventario.obtener(producto.id);
}
