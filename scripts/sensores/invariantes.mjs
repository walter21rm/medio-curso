import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { objetivos } from "../arnes.mjs";

const APLICADO = /Aplicado por:\s*`([^`]+)`/;
const PERMITIDOS = new Set(["revisión humana", "aún no aplicado"]);
const CICLO_NPM = ["install", "preinstall", "postinstall"];

export function revisarTextoInvariantes(markdown, scripts) {
  const hallazgos = [];
  const lineas = markdown.split(/\r?\n/);
  for (let indice = 0; indice < lineas.length; indice += 1) {
    const linea = lineas[indice];
    if (!linea.startsWith("- ")) {
      continue;
    }
    const coincidencia = linea.match(APLICADO);
    if (coincidencia === null) {
      hallazgos.push(`INVARIANTS.md:${indice + 1} no declara cómo se aplica`);
      continue;
    }
    const aplicado = coincidencia[1];
    if (PERMITIDOS.has(aplicado)) {
      continue;
    }
    if (!aplicado.startsWith("npm run ")) {
      hallazgos.push(`INVARIANTS.md:${indice + 1} usa un aplicador desconocido: ${aplicado}`);
      continue;
    }
    const nombre = aplicado.slice("npm run ".length);
    const script = scripts[nombre];
    if (script !== `node scripts/arnes.mjs ${nombre}`) {
      hallazgos.push(
        `INVARIANTS.md:${indice + 1} exige \`npm run ${nombre}\`, y package.json no lo enlaza con scripts/arnes.mjs`,
      );
      continue;
    }
    if (typeof objetivos[nombre] !== "function") {
      hallazgos.push(`INVARIANTS.md:${indice + 1} exige \`npm run ${nombre}\`, y ese objetivo no existe`);
    }
  }
  for (const nombre of CICLO_NPM) {
    if (scripts[nombre] !== undefined) {
      hallazgos.push(`package.json define "${nombre}", y npm lo lanzaría durante npm install`);
    }
  }
  return { ok: hallazgos.length === 0, hallazgos };
}

export function revisarInvariantes(raiz) {
  const markdown = readFileSync(new URL("../../INVARIANTS.md", import.meta.url), "utf8");
  const paquete = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  void raiz;
  return revisarTextoInvariantes(markdown, paquete.scripts ?? {});
}

const esPrincipal =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esPrincipal) {
  const resultado = revisarInvariantes(process.cwd());
  if (!resultado.ok) {
    for (const hallazgo of resultado.hallazgos) {
      process.stderr.write(`${hallazgo}\n`);
    }
    process.exitCode = 1;
  }
}
