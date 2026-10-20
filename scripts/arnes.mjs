import { spawnSync } from "node:child_process";
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const node = process.execPath;
const raiz = process.cwd();

function ejecutar(args) {
  const resultado = spawnSync(node, args, { cwd: raiz, stdio: "inherit" });
  return resultado.status ?? 1;
}

function archivosMjs(directorio, acumulado = []) {
  let entradas;
  try {
    entradas = readdirSync(directorio);
  } catch {
    return acumulado;
  }
  for (const nombre of entradas) {
    if (nombre === "node_modules" || nombre === "coverage" || nombre === ".git") {
      continue;
    }
    const ruta = join(directorio, nombre);
    if (statSync(ruta).isDirectory()) {
      archivosMjs(ruta, acumulado);
    } else if (nombre.endsWith(".mjs")) {
      acumulado.push(ruta);
    }
  }
  return acumulado;
}

export const objetivos = {
  help() {
    process.stdout.write(
      [
        "Uso: npm run <objetivo>",
        "",
        "  help                  Muestra estos objetivos",
        "  lint                  Revisa la sintaxis de los .mjs",
        "  test                  Pruebas del arnés",
        "  sensor:secretos       No hay credenciales en el árbol",
        "  sensor:invariantes    Cada invariante declara un aplicador real",
        "  sensor:producto       Sin código de aplicación mientras el producto esté pendiente",
        "  check                 Corre lint, sensores y pruebas",
        "  clean                 Borra salidas de cobertura",
        "",
      ].join("\n"),
    );
    return 0;
  },

  lint() {
    const archivos = [
      ...archivosMjs(join(raiz, "scripts")),
      ...archivosMjs(join(raiz, "tests")),
    ];
    for (const archivo of archivos) {
      const estado = ejecutar(["--check", archivo]);
      if (estado !== 0) {
        return estado;
      }
    }
    return 0;
  },

  test() {
    return ejecutar(["--test", "tests/**/*.test.mjs"]);
  },

  "sensor:secretos"() {
    return ejecutar(["scripts/sensores/secretos.mjs"]);
  },

  "sensor:invariantes"() {
    return ejecutar(["scripts/sensores/invariantes.mjs"]);
  },

  "sensor:producto"() {
    return ejecutar(["scripts/sensores/producto.mjs"]);
  },

  check() {
    const pasos = ["lint", "sensor:secretos", "sensor:invariantes", "sensor:producto", "test"];
    for (const paso of pasos) {
      process.stdout.write(`→ ${paso}\n`);
      const codigo = objetivos[paso]();
      if (codigo !== 0) {
        process.stderr.write(`falló ${paso}\n`);
        return codigo;
      }
    }
    process.stdout.write("check ok\n");
    return 0;
  },

  clean() {
    rmSync(join(raiz, "coverage"), { recursive: true, force: true });
    return 0;
  },
};

const esPrincipal =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (esPrincipal) {
  const nombre = process.argv[2] ?? "help";
  const objetivo = objetivos[nombre];
  if (typeof objetivo !== "function") {
    process.stderr.write(`Objetivo desconocido: ${nombre}\n`);
    objetivos.help();
    process.exitCode = 1;
  } else {
    process.exitCode = objetivo(process.argv.slice(3));
  }
}
