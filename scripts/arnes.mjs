import { spawnSync } from "node:child_process";
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const node = process.execPath;
const raiz = process.cwd();
const [major, minor] = process.versions.node.split(".").map(Number);
const banderaTipos = major < 22 || (major === 22 && minor < 18) ? ["--experimental-strip-types"] : [];

function ejecutar(args) {
  const resultado = spawnSync(node, args, { cwd: raiz, stdio: "inherit" });
  return resultado.status ?? 1;
}

function exigirInstalado() {
  try {
    statSync(join(raiz, "node_modules", "typescript", "bin", "tsc"));
  } catch {
    process.stderr.write("Faltan dependencias. Ejecuta npm install en la raíz del proyecto.\n");
    return false;
  }
  return true;
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
        "  typecheck             tsc --noEmit",
        "  test                  Pruebas del arnés y de Mostrador",
        "  sensor:secretos       No hay credenciales en el árbol",
        "  sensor:invariantes    Cada invariante declara un aplicador real",
        "  sensor:producto       Sin src/ mientras el producto siga pendiente",
        "  sensor:dinero         En src/ no hay decimales, parseFloat ni toFixed",
        "  check                 Corre lint, tipos, sensores y pruebas",
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

  typecheck() {
    if (!exigirInstalado()) {
      return 1;
    }
    return ejecutar(["node_modules/typescript/bin/tsc", "-p", "tsconfig.json", "--noEmit"]);
  },

  test() {
    return ejecutar([
      ...banderaTipos,
      "--test",
      "--disable-warning=ExperimentalWarning",
      "tests/**/*.test.ts",
      "tests/**/*.test.mjs",
    ]);
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

  "sensor:dinero"() {
    return ejecutar(["scripts/sensores/dinero.mjs"]);
  },

  check() {
    const pasos = [
      "lint",
      "typecheck",
      "sensor:secretos",
      "sensor:invariantes",
      "sensor:producto",
      "sensor:dinero",
      "test",
    ];
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
