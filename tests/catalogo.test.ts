import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { altaProducto } from "../src/catalogo/catalogo.ts";
import { ReglaNegocio } from "../src/domain/errores.ts";
import { Inventario } from "../src/domain/inventario.ts";

const ARROZ = { id: "prod-1", nombre: "  Arroz ", existencia: 10, costoPromedio: 500, precio: 800 };

function regla(codigo: string) {
  return (error: unknown) => error instanceof ReglaNegocio && error.codigo === codigo;
}

describe("catálogo", () => {
  it("da de alta un producto con existencia, costo promedio y precio", () => {
    const inventario = new Inventario();
    const producto = altaProducto(inventario, ARROZ);
    assert.deepEqual(producto, {
      id: "prod-1",
      nombre: "Arroz",
      existencia: 10,
      costoPromedio: 500,
      precio: 800,
    });
    assert.deepEqual(inventario.obtener("prod-1"), producto);
  });

  it("rechaza un id repetido", () => {
    const inventario = new Inventario();
    altaProducto(inventario, ARROZ);
    assert.throws(() => altaProducto(inventario, ARROZ), regla("producto-duplicado"));
  });

  it("rechaza nombre vacío, existencia o costo negativos y precio cero", () => {
    const inventario = new Inventario();
    assert.throws(() => altaProducto(inventario, { ...ARROZ, nombre: "   " }), regla("texto-invalido"));
    assert.throws(() => altaProducto(inventario, { ...ARROZ, existencia: -1 }), regla("existencia-invalida"));
    assert.throws(() => altaProducto(inventario, { ...ARROZ, costoPromedio: -1 }), regla("dinero-invalido"));
    assert.throws(() => altaProducto(inventario, { ...ARROZ, precio: 0 }), regla("dinero-invalido"));
    assert.throws(() => inventario.obtener("prod-1"), regla("producto-inexistente"));
  });
});
