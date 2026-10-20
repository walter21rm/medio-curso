import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const OMITIDOS = new Set(["node_modules", ".git", "dist", "coverage"]);

export function archivosBajo(raiz, directorio, extension) {
  const base = join(raiz, directorio);
  const encontrados = [];

  function recorrer(actual) {
    for (const nombre of readdirSync(actual)) {
      if (OMITIDOS.has(nombre)) {
        continue;
      }
      const ruta = join(actual, nombre);
      if (statSync(ruta).isDirectory()) {
        recorrer(ruta);
        continue;
      }
      if (nombre.endsWith(extension)) {
        const relativo = relative(raiz, ruta).replaceAll("\\", "/");
        encontrados.push({
          ruta,
          relativo,
          texto: readFileSync(ruta, "utf8"),
        });
      }
    }
  }

  recorrer(base);
  return encontrados;
}
