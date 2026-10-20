import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ESTADOS_COMPRA, ESTADOS_VENTA } from "../src/domain/documentos.ts";
import { ReglaNegocio } from "../src/domain/errores.ts";
import { Inventario } from "../src/domain/inventario.ts";
import { crearProducto } from "../src/domain/producto.ts";
import { AHORA, producto } from "./apoyo.ts";

describe("esqueleto", () => {
  it("publica los estados de compra y de venta", () => {
    assert.deepEqual(ESTADOS_COMPRA, ["borrador", "recibida"]);
    assert.deepEqual(ESTADOS_VENTA, ["confirmada", "anulada"]);
  });

  it("rechaza un producto con existencia negativa", () => {
    assert.throws(
      () => crearProducto({ id: "prod-1", nombre: "Arroz", existencia: -1, costoPromedio: 500, precio: 800 }),
      (error: unknown) => error instanceof ReglaNegocio && error.codigo === "existencia-invalida",
    );
  });

  it("la existencia no queda negativa", () => {
    const inventario = new Inventario();
    inventario.poner(producto({ existencia: 1 }));
    assert.throws(
      () => inventario.descontar("prod-1", 2, "venta", "ven-1", AHORA),
      (error: unknown) => error instanceof ReglaNegocio && error.codigo === "existencia-insuficiente",
    );
    assert.equal(inventario.obtener("prod-1").existencia, 1);
    assert.equal(inventario.listarMovimientos().length, 0);
  });

  it("una salida y una entrada quedan como movimiento", () => {
    const inventario = new Inventario();
    inventario.poner(producto({ existencia: 4 }));
    inventario.descontar("prod-1", 1, "venta", "ven-1", AHORA);
    inventario.reponer("prod-1", 3, "compra", "com-1", AHORA);
    const movimientos = inventario.listarMovimientos();
    assert.equal(movimientos[0]?.direccion, "salida");
    assert.equal(movimientos[0]?.origen, "venta");
    assert.equal(movimientos[1]?.direccion, "entrada");
    assert.equal(movimientos[1]?.origen, "compra");
    assert.equal(inventario.obtener("prod-1").existencia, 6);
  });
});
