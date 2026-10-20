import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MARCA = /^PRODUCTO:\s*pendiente\s*$/m;

export function revisarProducto(raiz) {
  const alcance = readFileSync(join(raiz, "docs", "product", "ALCANCE.md"), "utf8");
  if (!MARCA.test(alcance)) {
    return { ok: true, hallazgos: [] };
  }
  const src = join(raiz, "src");
  if (!existsSync(src)) {
    return { ok: true, hallazgos: [] };
  }
  const hallazgos = [];
  function recorrer(actual) {
    for (const nombre of readdirSync(actual)) {
      const ruta = join(actual, nombre);
      if (statSync(ruta).isDirectory()) {
        recorrer(ruta);
        continue;
      }
      hallazgos.push(`${ruta} existe mientras PRODUCTO: pendiente`);
    }
  }
  recorrer(src);
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
