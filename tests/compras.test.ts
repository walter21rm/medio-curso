import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Compras } from "../src/compras/compras.ts";
import { ReglaNegocio } from "../src/domain/errores.ts";
import { Inventario } from "../src/domain/inventario.ts";
import { AHORA, MANANA, producto } from "./apoyo.ts";

function regla(codigo: string) {
  return (error: unknown) => error instanceof ReglaNegocio && error.codigo === codigo;
}

function comprasCon(existencia = 10): { inventario: Inventario; compras: Compras } {
  const inventario = new Inventario();
  inventario.poner(producto({ existencia }));
  return { inventario, compras: new Compras(inventario) };
}

const COMPRA = {
  id: "com-1",
  proveedor: "Andes",
  lineas: [{ productoId: "prod-1", cantidad: 4, costoUnitario: 500 }],
};

describe("recibir compra", () => {
  it("una compra en borrador no sube el stock", () => {
    const { inventario, compras } = comprasCon();
    const compra = compras.registrar(COMPRA);
    assert.equal(compra.estado, "borrador");
    assert.equal(compra.recibidaEn, null);
    assert.equal(inventario.obtener("prod-1").existencia, 10);
    assert.equal(inventario.listarMovimientos().length, 0);
  });

  it("la recepción pasa la compra a recibida y sube el stock", () => {
    const { inventario, compras } = comprasCon();
    compras.registrar(COMPRA);
    const recibida = compras.recibir("com-1", AHORA);
    assert.equal(recibida.estado, "recibida");
    assert.equal(recibida.recibidaEn, AHORA);
    assert.equal(inventario.obtener("prod-1").existencia, 14);
    assert.deepEqual(inventario.listarMovimientos(), [
      {
        id: "mov-compra-com-1-prod-1-entrada",
        productoId: "prod-1",
        direccion: "entrada",
        cantidad: 4,
        origen: "compra",
        origenId: "com-1",
        ocurridoEn: AHORA,
      },
    ]);
  });

  it("una compra recibida no vuelve a recibirse", () => {
    const { inventario, compras } = comprasCon();
    compras.registrar(COMPRA);
    compras.recibir("com-1", AHORA);
    assert.throws(() => compras.recibir("com-1", MANANA), regla("compra-recibida"));
    assert.equal(inventario.obtener("prod-1").existencia, 14);
  });

  it("rechaza compra vacía, id repetido, producto inexistente y línea repetida", () => {
    const { compras } = comprasCon();
    assert.throws(() => compras.registrar({ ...COMPRA, lineas: [] }), regla("compra-vacia"));
    assert.throws(
      () => compras.registrar({ ...COMPRA, lineas: [{ productoId: "prod-9", cantidad: 1, costoUnitario: 500 }] }),
      regla("producto-inexistente"),
    );
    assert.throws(
      () => compras.registrar({ ...COMPRA, lineas: [...COMPRA.lineas, ...COMPRA.lineas] }),
      regla("linea-duplicada"),
    );
    assert.throws(
      () => compras.registrar({ ...COMPRA, lineas: [{ productoId: "prod-1", cantidad: 0, costoUnitario: 500 }] }),
      regla("cantidad-invalida"),
    );
    compras.registrar(COMPRA);
    assert.throws(() => compras.registrar(COMPRA), regla("compra-duplicada"));
  });

  it("rechaza recibir una compra que no existe o con un instante inválido", () => {
    const { inventario, compras } = comprasCon();
    assert.throws(() => compras.recibir("com-9", AHORA), regla("compra-inexistente"));
    compras.registrar(COMPRA);
    assert.throws(() => compras.recibir("com-1", "2026-10-20"), regla("instante-invalido"));
    assert.equal(compras.obtener("com-1").estado, "borrador");
    assert.equal(inventario.obtener("prod-1").existencia, 10);
  });
});
