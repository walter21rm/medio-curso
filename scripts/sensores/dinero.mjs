import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { archivosBajo } from "./caminar.mjs";

export function revisarDineroTexto(relativo, texto) {
  if (!relativo.startsWith("src/") || !relativo.endsWith(".ts")) {
    return [];
  }
  const hallazgos = [];
  if (/\bparseFloat\b|\.toFixed\s*\(/.test(texto)) {
    hallazgos.push(`${relativo} convierte dinero con parseFloat o toFixed`);
  }
  if (/\d+\.\d+/.test(texto)) {
    hallazgos.push(`${relativo} contiene un literal decimal; el dinero va en centavos enteros`);
  }
  return hallazgos;
}

export function revisarDinero(raiz) {
  if (!existsSync(`${raiz}/src`)) {
    return { ok: true, hallazgos: [] };
  }
  const hallazgos = [];
  for (const archivo of archivosBajo(raiz, "src", ".ts")) {
    hallazgos.push(...revisarDineroTexto(archivo.relativo, archivo.texto));
  }
  return { ok: hallazgos.length === 0, hallazgos };
}

const esPrincipal =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esPrincipal) {
  const resultado = revisarDinero(process.cwd());
  if (!resultado.ok) {
    for (const hallazgo of resultado.hallazgos) {
      process.stderr.write(`${hallazgo}\n`);
    }
    process.exitCode = 1;
  }
}
