import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Compras } from "../src/compras/compras.ts";
import { costoPromedio } from "../src/compras/costo.ts";
import { Inventario } from "../src/domain/inventario.ts";
import { AHORA, MANANA, producto } from "./apoyo.ts";

describe("costo promedio", () => {
  it("una compra recibida recalcula el costo del producto", () => {
    const inventario = new Inventario();
    inventario.poner(producto({ existencia: 10, costoPromedio: 500 }));
    const compras = new Compras(inventario);
    compras.registrar({
      id: "com-1",
      proveedor: "Andes",
      lineas: [{ productoId: "prod-1", cantidad: 10, costoUnitario: 700 }],
    });
    assert.equal(inventario.obtener("prod-1").costoPromedio, 500);
    compras.recibir("com-1", AHORA);
    assert.equal(inventario.obtener("prod-1").costoPromedio, 600);
    assert.equal(inventario.obtener("prod-1").existencia, 20);
  });

  it("redondea half-up al centavo", () => {
    assert.equal(costoPromedio(1, 100, 1, 51), 76);
    assert.equal(costoPromedio(2, 100, 1, 101), 100);
    assert.equal(costoPromedio(3, 0, 1, 2), 1);
  });

  it("con existencia cero, el costo es el de la compra", () => {
    assert.equal(costoPromedio(0, 500, 3, 700), 700);
  });

  it("cada compra usa la existencia de antes de reponer", () => {
    const inventario = new Inventario();
    inventario.poner(producto({ existencia: 1, costoPromedio: 100 }));
    const compras = new Compras(inventario);
    compras.registrar({ id: "com-1", proveedor: "Andes", lineas: [{ productoId: "prod-1", cantidad: 1, costoUnitario: 51 }] });
    compras.registrar({ id: "com-2", proveedor: "Andes", lineas: [{ productoId: "prod-1", cantidad: 2, costoUnitario: 100 }] });
    compras.recibir("com-1", AHORA);
    assert.equal(inventario.obtener("prod-1").costoPromedio, 76);
    compras.recibir("com-2", MANANA);
    assert.equal(inventario.obtener("prod-1").costoPromedio, 88);
    assert.equal(inventario.obtener("prod-1").existencia, 4);
  });
});
