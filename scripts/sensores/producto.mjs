import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PENDIENTE = /^PRODUCTO:\s*pendiente\s*$/m;

export function revisarProducto(raiz) {
  const relativo = "docs/product/ALCANCE.md";
  const alcance = readFileSync(join(raiz, "docs", "product", "ALCANCE.md"), "utf8");
  const hallazgos = [];
  if (PENDIENTE.test(alcance)) {
    hallazgos.push(`${relativo} vuelve a marcar PRODUCTO: pendiente`);
  }
  if (!alcance.includes("Mostrador")) {
    hallazgos.push(`${relativo} no describe Mostrador`);
  }
  return { ok: hallazgos.length === 0, hallazgos };
}

const esPrincipal =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esPrincipal) {
  const resultado = revisarProducto(process.cwd());
  if (!resultado.ok) {
    for (const hallazgo of resultado.hallazgos) {
      process.stderr.write(`${hallazgo}\n`);
    }
    process.exitCode = 1;
  }
}
