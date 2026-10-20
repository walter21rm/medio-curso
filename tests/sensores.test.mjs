import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buscarSecretos } from "../scripts/sensores/secretos.mjs";
import { revisarTextoInvariantes } from "../scripts/sensores/invariantes.mjs";
import { revisarProducto } from "../scripts/sensores/producto.mjs";
import { revisarInvariantes } from "../scripts/sensores/invariantes.mjs";
import { revisarSecretos } from "../scripts/sensores/secretos.mjs";

describe("secretos", () => {
  it("detecta una clave AWS armada en memoria", () => {
    const clave = "AKIA" + "0".repeat(16);
    const hallazgos = buscarSecretos("ejemplo.ts", `const valor = "${clave}"`);
    assert.equal(hallazgos.length, 1);
  });

  it("el árbol del repositorio no contiene credenciales", () => {
    const resultado = revisarSecretos(process.cwd());
    assert.deepEqual(resultado.hallazgos, []);
  });
});

describe("invariantes", () => {
  it("exige un aplicador en cada viñeta", () => {
    const resultado = revisarTextoInvariantes("- una regla sin aplicador\n", {});
    assert.equal(resultado.ok, false);
  });

  it("acepta revisión humana", () => {
    const resultado = revisarTextoInvariantes("- una regla. *Aplicado por: `revisión humana`*\n", {});
    assert.equal(resultado.ok, true);
  });

  it("el INVARIANTS.md del repositorio está enlazado", () => {
    const resultado = revisarInvariantes(process.cwd());
    assert.deepEqual(resultado.hallazgos, []);
  });
});

describe("producto", () => {
  it("mientras el alcance siga pendiente, src/ no entra", () => {
    const resultado = revisarProducto(process.cwd());
    assert.equal(resultado.ok, true);
  });
});
