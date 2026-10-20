import type { Producto } from "../src/domain/producto.ts";
import { Mostrador } from "../src/mostrador.ts";
import { producto } from "./apoyo.ts";

export function mostradorCon(unProducto: Producto = producto()): Mostrador {
  const mostrador = new Mostrador();
  mostrador.ponerProducto(unProducto);
  return mostrador;
}
