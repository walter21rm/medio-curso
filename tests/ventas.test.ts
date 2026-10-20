import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ReglaNegocio } from "../src/domain/errores.ts";
import { AHORA, MANANA, producto } from "./apoyo.ts";
import { mostradorCon } from "./fabrica.ts";

describe("ventas", () => {
  it("la venta al contado baja el stock y entra el dinero a caja", () => {
    const mostrador = mostradorCon();
    const venta = mostrador.venderContado({
      id: "ven-1",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 2 }],
      ocurridoEn: AHORA,
    });
    assert.equal(venta.tipo, "contado");
    assert.equal(venta.total, 1600);
    assert.equal(mostrador.existencia("prod-1"), 8);
    assert.deepEqual(mostrador.movimientosCaja(), [
      {
        id: "caja-ven-1",
        tipo: "venta_contado",
        monto: 1600,
        origenId: "ven-1",
        ocurridoEn: AHORA,
      },
    ]);
  });

  it("no vende más de lo que hay y deja el stock igual", () => {
    const mostrador = mostradorCon(producto({ existencia: 1 }));
    assert.throws(
      () =>
        mostrador.venderContado({
          id: "ven-1",
          cliente: "Nora",
          lineas: [{ productoId: "prod-1", cantidad: 2 }],
          ocurridoEn: AHORA,
        }),
      (error: unknown) => error instanceof ReglaNegocio && error.codigo === "existencia-insuficiente",
    );
    assert.equal(mostrador.existencia("prod-1"), 1);
    assert.equal(mostrador.movimientosCaja().length, 0);
  });

  it("la venta a crédito baja el stock y abre la cuenta con vencimiento", () => {
    const mostrador = mostradorCon();
    const venta = mostrador.venderCredito({
      id: "ven-2",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 2 }],
      ocurridoEn: AHORA,
      vencimiento: "2026-11-20",
    });
    assert.equal(venta.tipo, "credito");
    if (venta.tipo === "credito") {
      assert.equal(venta.vencimiento, "2026-11-20");
    }
    assert.equal(mostrador.existencia("prod-1"), 8);
    assert.equal(mostrador.movimientosCaja().length, 0);
    assert.deepEqual(mostrador.cuentaDe("ven-2"), {
      id: "cxc-ven-2",
      ventaId: "ven-2",
      cliente: "Nora",
      monto: 1600,
      saldo: 1600,
      vencimiento: "2026-11-20",
      estado: "abierta",
    });
  });

  it("anular una venta a crédito devuelve el stock y cancela la deuda", () => {
    const mostrador = mostradorCon();
    mostrador.venderCredito({
      id: "ven-2",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 2 }],
      ocurridoEn: AHORA,
      vencimiento: "2026-11-20",
    });
    const anulada = mostrador.anularVenta("ven-2", MANANA);
    assert.equal(anulada.estado, "anulada");
    assert.equal(mostrador.existencia("prod-1"), 10);
    assert.equal(mostrador.cuentaDe("ven-2").estado, "cancelada");
    assert.equal(mostrador.cuentaDe("ven-2").saldo, 0);
  });

  it("anular una venta al contado devuelve el stock y revierte la caja", () => {
    const mostrador = mostradorCon();
    mostrador.venderContado({
      id: "ven-1",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 2 }],
      ocurridoEn: AHORA,
    });
    mostrador.anularVenta("ven-1", MANANA);
    assert.equal(mostrador.existencia("prod-1"), 10);
    assert.equal(mostrador.movimientosCaja().at(-1)?.tipo, "reverso_venta");
    assert.equal(mostrador.movimientosCaja().at(-1)?.monto, 1600);
  });
});
