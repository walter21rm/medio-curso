import { crearProducto, type Producto } from "../src/domain/producto.ts";

export const AHORA = "2026-10-20T15:00:00.000Z";
export const MANANA = "2026-10-21T15:00:00.000Z";

export function producto(parcial: Partial<Producto> = {}): Producto {
  return crearProducto({
    id: parcial.id ?? "prod-1",
    nombre: parcial.nombre ?? "Arroz",
    existencia: parcial.existencia ?? 10,
    costoPromedio: parcial.costoPromedio ?? 500,
    precio: parcial.precio ?? 800,
  });
}
