import { Dinero } from "./dinero.ts";
import { ReglaNegocio } from "./errores.ts";

const ID = /^[A-Za-z0-9-]{1,64}$/;

export interface DatosProducto {
  id: string;
  nombre: string;
  existencia: number;
  costoPromedio: number;
  precio: number;
}

export interface Producto {
  id: string;
  nombre: string;
  existencia: number;
  costoPromedio: number;
  precio: number;
}

export function exigirId(id: string): string {
  if (!ID.test(id)) {
    throw new ReglaNegocio("id-invalido", "El id usa letras, dígitos y guiones, hasta 64 caracteres.");
  }
  return id;
}

export function exigirTexto(valor: string, campo: string): string {
  const texto = valor.trim();
  if (texto.length < 1 || texto.length > 120) {
    throw new ReglaNegocio("texto-invalido", `${campo} tiene entre 1 y 120 caracteres.`);
  }
  return texto;
}

export function exigirCantidad(cantidad: number): number {
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    throw new ReglaNegocio("cantidad-invalida", "La cantidad es un entero mayor que cero.");
  }
  return cantidad;
}

export function crearProducto(datos: DatosProducto): Producto {
  const id = exigirId(datos.id);
  const nombre = exigirTexto(datos.nombre, "El nombre");
  if (!Number.isInteger(datos.existencia) || datos.existencia < 0) {
    throw new ReglaNegocio("existencia-invalida", "La existencia es un entero, cero o mayor.");
  }
  const costoPromedio = Dinero.desdeCentavos(datos.costoPromedio).centavos;
  const precio = Dinero.positivo(datos.precio).centavos;
  return { id, nombre, existencia: datos.existencia, costoPromedio, precio };
}
