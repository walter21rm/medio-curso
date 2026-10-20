import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ReglaNegocio } from "../src/domain/errores.ts";
import { AHORA, MANANA } from "./apoyo.ts";
import { mostradorCon } from "./fabrica.ts";

describe("caja", () => {
  it("el cierre compara el efectivo contado contra contado más abonos", () => {
    const mostrador = mostradorCon();
    mostrador.venderContado({
      id: "ven-1",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 1 }],
      ocurridoEn: AHORA,
    });
    mostrador.venderCredito({
      id: "ven-2",
      cliente: "Luis",
      lineas: [{ productoId: "prod-1", cantidad: 1 }],
      ocurridoEn: AHORA,
      vencimiento: "2026-11-20",
    });
    mostrador.abonar({
      id: "abo-1",
      cuentaId: "cxc-ven-2",
      monto: 300,
      ocurridoEn: AHORA,
    });
    const cierre = mostrador.cerrarCaja({
      id: "cie-1",
      fecha: "2026-10-20",
      efectivoContado: 1000,
    });
    assert.equal(cierre.esperado, 1100);
    assert.equal(cierre.diferencia, -100);
  });

  it("una venta al contado anulada ese día no cuenta en el esperado", () => {
    const mostrador = mostradorCon();
    mostrador.venderContado({
      id: "ven-1",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 2 }],
      ocurridoEn: AHORA,
    });
    mostrador.anularVenta("ven-1", AHORA);
    const cierre = mostrador.cerrarCaja({ id: "cie-1", fecha: "2026-10-20", efectivoContado: 0 });
    assert.equal(cierre.esperado, 0);
    assert.equal(cierre.diferencia, 0);
  });

  it("no cierra dos veces el mismo día ni vende después del cierre", () => {
    const mostrador = mostradorCon();
    mostrador.cerrarCaja({ id: "cie-1", fecha: "2026-10-20", efectivoContado: 0 });
    assert.throws(
      () => mostrador.cerrarCaja({ id: "cie-2", fecha: "2026-10-20", efectivoContado: 0 }),
      (error: unknown) => error instanceof ReglaNegocio && error.codigo === "cierre-duplicado",
    );
    assert.throws(
      () =>
        mostrador.venderContado({
          id: "ven-1",
          cliente: "Nora",
          lineas: [{ productoId: "prod-1", cantidad: 1 }],
          ocurridoEn: AHORA,
        }),
      (error: unknown) => error instanceof ReglaNegocio && error.codigo === "dia-cerrado",
    );
    mostrador.venderContado({
      id: "ven-1",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 1 }],
      ocurridoEn: MANANA,
    });
    assert.equal(mostrador.existencia("prod-1"), 9);
  });
});
