import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Compras } from "../src/compras/compras.ts";
import { ReglaNegocio } from "../src/domain/errores.ts";
import { Inventario } from "../src/domain/inventario.ts";
import { kardex } from "../src/kardex/kardex.ts";
import { AHORA, MANANA, producto } from "./apoyo.ts";

describe("kardex", () => {
  it("una compra recibida y una salida quedan listadas en orden", () => {
    const inventario = new Inventario();
    inventario.poner(producto({ id: "prod-1", existencia: 10 }));
    inventario.poner(producto({ id: "prod-2", existencia: 5 }));
    const compras = new Compras(inventario);
    compras.registrar({
      id: "com-1",
      proveedor: "Andes",
      lineas: [
        { productoId: "prod-1", cantidad: 4, costoUnitario: 700 },
        { productoId: "prod-2", cantidad: 1, costoUnitario: 300 },
      ],
    });
    compras.recibir("com-1", AHORA);
    inventario.descontar("prod-1", 3, "venta", "ven-1", MANANA);

    const resumen = kardex(inventario, "prod-1").map(({ productoId, direccion, cantidad, origen, origenId, ocurridoEn }) => ({
      productoId,
      direccion,
      cantidad,
      origen,
      origenId,
      ocurridoEn,
    }));
    assert.deepEqual(resumen, [
      { productoId: "prod-1", direccion: "entrada", cantidad: 4, origen: "compra", origenId: "com-1", ocurridoEn: AHORA },
      { productoId: "prod-1", direccion: "salida", cantidad: 3, origen: "venta", origenId: "ven-1", ocurridoEn: MANANA },
    ]);
    assert.equal(kardex(inventario, "prod-2").length, 1);
    assert.equal(inventario.obtener("prod-1").existencia, 11);
  });

  it("rechaza un producto que no está en el almacén", () => {
    const inventario = new Inventario();
    assert.throws(
      () => kardex(inventario, "prod-9"),
      (error: unknown) => error instanceof ReglaNegocio && error.codigo === "producto-inexistente",
    );
  });
});
