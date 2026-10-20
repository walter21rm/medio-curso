import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const PATRONES = [
  { nombre: "clave AWS", re: /AKIA[0-9A-Z]{16}/ },
  { nombre: "token GitHub", re: /ghp_[A-Za-z0-9]{20,}/ },
  { nombre: "clave de API con prefijo sk-", re: /sk-[A-Za-z0-9]{20,}/ },
  {
    nombre: "secreto asignado en código",
    re: /(?:password|passwd|api[_-]?key|secret)\s*[:=]\s*["'][^"']+["']/i,
  },
  {
    nombre: "clave privada",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

const OMITIDOS = new Set(["node_modules", ".git", "dist", "coverage"]);

export function buscarSecretos(relativo, texto) {
  const hallazgos = [];
  const lineas = texto.split(/\r?\n/);
  for (let indice = 0; indice < lineas.length; indice += 1) {
    const linea = lineas[indice];
    for (const patron of PATRONES) {
      if (patron.re.test(linea)) {
        hallazgos.push(`${relativo}:${indice + 1} coincide con ${patron.nombre}`);
      }
    }
  }
  return hallazgos;
}

export function revisarSecretos(raiz) {
  const hallazgos = [];
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
      if (nombre === "package-lock.json") {
        continue;
      }
      if (!/\.(ts|mjs|js|md|json|yml|yaml)$/.test(nombre)) {
        continue;
      }
      const relativo = relative(raiz, ruta).replaceAll("\\", "/");
      hallazgos.push(...buscarSecretos(relativo, readFileSync(ruta, "utf8")));
    }
  }
  recorrer(raiz);
  return { ok: hallazgos.length === 0, hallazgos };
}

const esPrincipal =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esPrincipal) {
  const resultado = revisarSecretos(process.cwd());
  if (!resultado.ok) {
    for (const hallazgo of resultado.hallazgos) {
      process.stderr.write(`${hallazgo}\n`);
    }
    process.exitCode = 1;
  }
}
