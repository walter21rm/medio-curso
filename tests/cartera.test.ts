import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ReglaNegocio } from "../src/domain/errores.ts";
import { AHORA, MANANA } from "./apoyo.ts";
import { mostradorCon } from "./fabrica.ts";

function venderCredito() {
  const mostrador = mostradorCon();
  mostrador.venderCredito({
    id: "ven-2",
    cliente: "Nora",
    lineas: [{ productoId: "prod-1", cantidad: 2 }],
    ocurridoEn: AHORA,
    vencimiento: "2026-11-20",
  });
  return mostrador;
}

describe("cartera", () => {
  it("el abono baja la cartera y entra a caja", () => {
    const mostrador = venderCredito();
    const abono = mostrador.abonar({
      id: "abo-1",
      cuentaId: "cxc-ven-2",
      monto: 600,
      ocurridoEn: MANANA,
    });
    assert.equal(abono.monto, 600);
    assert.equal(mostrador.cuentaDe("ven-2").saldo, 1000);
    assert.equal(mostrador.cuentaDe("ven-2").estado, "abierta");
    assert.equal(mostrador.movimientosCaja()[0]?.tipo, "abono");
    assert.equal(mostrador.movimientosCaja()[0]?.monto, 600);
  });

  it("un abono que cubre el saldo deja la cuenta pagada", () => {
    const mostrador = venderCredito();
    mostrador.abonar({ id: "abo-1", cuentaId: "cxc-ven-2", monto: 1600, ocurridoEn: MANANA });
    assert.equal(mostrador.cuentaDe("ven-2").estado, "pagada");
    assert.equal(mostrador.cuentaDe("ven-2").saldo, 0);
  });

  it("rechaza un abono mayor que el saldo", () => {
    const mostrador = venderCredito();
    assert.throws(
      () => mostrador.abonar({ id: "abo-1", cuentaId: "cxc-ven-2", monto: 1601, ocurridoEn: MANANA }),
      (error: unknown) => error instanceof ReglaNegocio && error.codigo === "saldo-insuficiente",
    );
    assert.equal(mostrador.cuentaDe("ven-2").saldo, 1600);
    assert.equal(mostrador.movimientosCaja().length, 0);
  });

  it("la cobranza muestra solo los saldos ya vencidos", () => {
    const mostrador = mostradorCon();
    mostrador.venderCredito({
      id: "ven-vieja",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 1 }],
      ocurridoEn: AHORA,
      vencimiento: "2026-10-19",
    });
    mostrador.venderCredito({
      id: "ven-hoy",
      cliente: "Luis",
      lineas: [{ productoId: "prod-1", cantidad: 1 }],
      ocurridoEn: AHORA,
      vencimiento: "2026-10-20",
    });
    const vencidas = mostrador.cobranzaVencida("2026-10-20");
    assert.deepEqual(vencidas.map((cuenta) => cuenta.id), ["cxc-ven-vieja"]);
  });
});
