import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { cerrarCaja } from "../caja/cierre.ts";
import { abonar, cobranzaVencida } from "../cartera/cartera.ts";
import { altaProducto } from "../catalogo/catalogo.ts";
import { Compras } from "../compras/compras.ts";
import type { Cierre, MovimientoCaja } from "../domain/documentos.ts";
import type { EstadoMostrador } from "../domain/estado.ts";
import { ReglaNegocio } from "../domain/errores.ts";
import { exigirFecha, partirInstante } from "../domain/fecha.ts";
import { Inventario } from "../domain/inventario.ts";
import { kardex } from "../kardex/kardex.ts";
import { anularVenta, venderContado, venderCredito } from "../ventas/registrar.ts";
import { sembrar } from "./semilla.ts";

export interface OpcionesApp {
  reloj?: () => Date;
  semilla?: boolean;
  web?: string;
}

export interface Mostrador {
  estado: EstadoMostrador;
  compras: Compras;
  ahora: () => string;
}

type Manejador = (
  peticion: IncomingMessage,
  respuesta: ServerResponse,
) => Promise<void>;

const LIMITE_CUERPO = 1_000_000;
const STOCK_BAJO = 5;
const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export function crearMostrador(opciones: OpcionesApp = {}): Mostrador {
  const reloj = opciones.reloj ?? (() => new Date());
  const inventario = new Inventario();
  const estado: EstadoMostrador = {
    inventario,
    ventas: new Map(),
    cuentas: new Map(),
    abonos: [],
    caja: [],
    cierres: new Map(),
  };
  const mostrador: Mostrador = {
    estado,
    compras: new Compras(inventario),
    ahora: () => reloj().toISOString(),
  };
  if (opciones.semilla ?? true) {
    sembrar(mostrador, reloj());
  }
  return mostrador;
}

export function crearApp(opciones: OpcionesApp = {}): Manejador {
  const mostrador = crearMostrador(opciones);
  const web = resolve(opciones.web ?? fileURLToPath(new URL("../../web/", import.meta.url)));

  return async (peticion, respuesta) => {
    const url = new URL(peticion.url ?? "/", "http://mostrador");
    try {
      if (url.pathname.startsWith("/api/")) {
        const cuerpo = peticion.method === "POST" ? await leerJson(peticion) : {};
        const resultado = api(mostrador, peticion.method ?? "GET", url, cuerpo);
        enviarJson(respuesta, resultado.estado, resultado.datos);
        return;
      }
      await servirEstatico(web, url.pathname, respuesta);
    } catch (error) {
      if (error instanceof ReglaNegocio) {
        enviarJson(respuesta, 422, { error: { codigo: error.codigo, mensaje: error.message } });
        return;
      }
      if (error instanceof ErrorHttp) {
        enviarJson(respuesta, error.estado, { error: { codigo: error.codigo, mensaje: error.message } });
        return;
      }
      enviarJson(respuesta, 500, { error: { codigo: "interno", mensaje: "Algo falló en el servidor." } });
    }
  };
}

class ErrorHttp extends Error {
  readonly estado: number;
  readonly codigo: string;

  constructor(estado: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}

interface Resultado {
  estado: number;
  datos: unknown;
}

function api(m: Mostrador, metodo: string, url: URL, cuerpo: Record<string, unknown>): Resultado {
  const ruta = url.pathname.replace(/\/+$/, "");
  const { estado, compras } = m;
  const ok = (datos: unknown): Resultado => ({ estado: 200, datos });
  const creado = (datos: unknown): Resultado => ({ estado: 201, datos });

  if (metodo === "GET" && ruta === "/api/resumen") {
    return ok(resumen(m, url.searchParams.get("fecha")));
  }

  if (ruta === "/api/productos") {
    if (metodo === "GET") {
      return ok(estado.inventario.listar());
    }
    if (metodo === "POST") {
      return creado(
        altaProducto(estado.inventario, {
          id: textoOpcional(cuerpo.id) ?? siguienteId("prod", (id) => existeProducto(estado.inventario, id)),
          nombre: texto(cuerpo.nombre, "nombre"),
          existencia: entero(cuerpo.existencia, "existencia"),
          costoPromedio: entero(cuerpo.costoPromedio, "costoPromedio"),
          precio: entero(cuerpo.precio, "precio"),
        }),
      );
    }
  }

  const kardexRuta = /^\/api\/productos\/([^/]+)\/kardex$/.exec(ruta);
  if (metodo === "GET" && kardexRuta?.[1] !== undefined) {
    const id = decodeURIComponent(kardexRuta[1]);
    return ok({ producto: estado.inventario.obtener(id), movimientos: kardex(estado.inventario, id) });
  }

  if (ruta === "/api/compras") {
    if (metodo === "GET") {
      return ok(compras.listar().reverse());
    }
    if (metodo === "POST") {
      return creado(
        compras.registrar({
          id: siguienteId("com", (id) => compras.listar().some((compra) => compra.id === id)),
          proveedor: texto(cuerpo.proveedor, "proveedor"),
          lineas: lista(cuerpo.lineas, "lineas").map((linea) => ({
            productoId: texto(campo(linea, "productoId"), "productoId"),
            cantidad: entero(campo(linea, "cantidad"), "cantidad"),
            costoUnitario: entero(campo(linea, "costoUnitario"), "costoUnitario"),
          })),
        }),
      );
    }
  }

  const recibirRuta = /^\/api\/compras\/([^/]+)\/recibir$/.exec(ruta);
  if (metodo === "POST" && recibirRuta?.[1] !== undefined) {
    return ok(compras.recibir(decodeURIComponent(recibirRuta[1]), m.ahora()));
  }

  if (ruta === "/api/ventas") {
    if (metodo === "GET") {
      return ok([...estado.ventas.values()].reverse());
    }
    if (metodo === "POST") {
      const entrada = {
        id: siguienteId("ven", (id) => estado.ventas.has(id)),
        cliente: texto(cuerpo.cliente, "cliente"),
        lineas: lista(cuerpo.lineas, "lineas").map((linea) => ({
          productoId: texto(campo(linea, "productoId"), "productoId"),
          cantidad: entero(campo(linea, "cantidad"), "cantidad"),
        })),
        ocurridoEn: m.ahora(),
      };
      if (cuerpo.tipo === "credito") {
        return creado(venderCredito(estado, { ...entrada, vencimiento: texto(cuerpo.vencimiento, "vencimiento") }));
      }
      if (cuerpo.tipo === "contado") {
        return creado(venderContado(estado, entrada));
      }
      throw new ReglaNegocio("tipo-invalido", "La venta es al contado o a crédito.");
    }
  }

  const anularRuta = /^\/api\/ventas\/([^/]+)\/anular$/.exec(ruta);
  if (metodo === "POST" && anularRuta?.[1] !== undefined) {
    return ok(anularVenta(estado, decodeURIComponent(anularRuta[1]), m.ahora()));
  }

  if (metodo === "GET" && ruta === "/api/cuentas") {
    return ok(
      [...estado.cuentas.values()]
        .map((cuenta) => ({ ...cuenta }))
        .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento) || a.id.localeCompare(b.id)),
    );
  }

  if (metodo === "GET" && ruta === "/api/cobranza") {
    return ok(cobranzaVencida(estado, url.searchParams.get("fecha") ?? hoy(m)));
  }

  if (ruta === "/api/abonos") {
    if (metodo === "GET") {
      return ok([...estado.abonos].reverse());
    }
    if (metodo === "POST") {
      return creado(
        abonar(estado, {
          id: siguienteId("abo", (id) => estado.abonos.some((abono) => abono.id === id)),
          cuentaId: texto(cuerpo.cuentaId, "cuentaId"),
          monto: entero(cuerpo.monto, "monto"),
          ocurridoEn: m.ahora(),
        }),
      );
    }
  }

  if (metodo === "GET" && ruta === "/api/caja") {
    return ok(caja(m, url.searchParams.get("fecha")));
  }

  if (metodo === "POST" && ruta === "/api/cierres") {
    const fecha = exigirFecha(texto(cuerpo.fecha, "fecha"));
    return creado(
      cerrarCaja(estado, {
        id: `cie-${fecha}`,
        fecha,
        efectivoContado: entero(cuerpo.efectivoContado, "efectivoContado"),
      }),
    );
  }

  throw new ErrorHttp(404, "ruta-inexistente", "Esa ruta no existe.");
}

function hoy(m: Mostrador): string {
  return partirInstante(m.ahora()).fecha;
}

function caja(m: Mostrador, fechaPedida: string | null) {
  const fecha = exigirFecha(fechaPedida ?? hoy(m));
  const movimientos = m.estado.caja.filter((mov) => partirInstante(mov.ocurridoEn).fecha === fecha);
  const suma = (tipo: MovimientoCaja["tipo"]) =>
    movimientos.filter((mov) => mov.tipo === tipo).reduce((total, mov) => total + mov.monto, 0);
  const ventasContado = suma("venta_contado");
  const abonos = suma("abono");
  const reversos = suma("reverso_venta");
  const cierre: Cierre | null = m.estado.cierres.get(fecha) ?? null;
  return {
    fecha,
    hoy: hoy(m),
    movimientos: [...movimientos].reverse(),
    ventasContado,
    abonos,
    reversos,
    esperado: ventasContado + abonos - reversos,
    cierre: cierre === null ? null : { ...cierre },
  };
}

function resumen(m: Mostrador, fechaPedida: string | null) {
  const datosCaja = caja(m, fechaPedida);
  const cuentas = [...m.estado.cuentas.values()].filter((cuenta) => cuenta.estado === "abierta");
  const vencidas = cobranzaVencida(m.estado, datosCaja.fecha);
  return {
    fecha: datosCaja.fecha,
    caja: datosCaja,
    porCobrar: cuentas.reduce((total, cuenta) => total + cuenta.saldo, 0),
    cuentasAbiertas: cuentas.length,
    vencidas,
    stockBajo: m.estado.inventario
      .listar()
      .filter((producto) => producto.existencia <= STOCK_BAJO)
      .sort((a, b) => a.existencia - b.existencia),
    comprasPorRecibir: m.compras.listar().filter((compra) => compra.estado === "borrador").length,
    ventasDelDia: [...m.estado.ventas.values()].filter(
      (venta) => partirInstante(venta.ocurridoEn).fecha === datosCaja.fecha,
    ).length,
  };
}

function existeProducto(inventario: Inventario, id: string): boolean {
  return inventario.listar().some((producto) => producto.id === id);
}

function siguienteId(prefijo: string, existe: (id: string) => boolean): string {
  let numero = 1;
  while (existe(`${prefijo}-${numero}`)) {
    numero += 1;
  }
  return `${prefijo}-${numero}`;
}

function texto(valor: unknown, nombre: string): string {
  if (typeof valor !== "string") {
    throw new ReglaNegocio("entrada-invalida", `Falta ${nombre}.`);
  }
  return valor;
}

function textoOpcional(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : undefined;
}

function entero(valor: unknown, nombre: string): number {
  if (typeof valor !== "number" || !Number.isInteger(valor)) {
    throw new ReglaNegocio("entrada-invalida", `${nombre} tiene que ser un número entero.`);
  }
  return valor;
}

function lista(valor: unknown, nombre: string): unknown[] {
  if (!Array.isArray(valor)) {
    throw new ReglaNegocio("entrada-invalida", `Falta ${nombre}.`);
  }
  return valor;
}

function campo(objeto: unknown, nombre: string): unknown {
  if (typeof objeto !== "object" || objeto === null) {
    return undefined;
  }
  return (objeto as Record<string, unknown>)[nombre];
}

async function leerJson(peticion: IncomingMessage): Promise<Record<string, unknown>> {
  let largo = 0;
  const partes: Buffer[] = [];
  for await (const parte of peticion) {
    const trozo = parte as Buffer;
    largo += trozo.length;
    if (largo > LIMITE_CUERPO) {
      throw new ErrorHttp(413, "cuerpo-grande", "La petición es demasiado grande.");
    }
    partes.push(trozo);
  }
  if (largo === 0) {
    return {};
  }
  try {
    const datos: unknown = JSON.parse(Buffer.concat(partes).toString("utf8"));
    if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
      throw new Error("no es un objeto");
    }
    return datos as Record<string, unknown>;
  } catch {
    throw new ErrorHttp(400, "json-invalido", "El cuerpo no es un JSON válido.");
  }
}

function enviarJson(respuesta: ServerResponse, estado: number, datos: unknown): void {
  respuesta.writeHead(estado, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  respuesta.end(JSON.stringify(datos));
}

async function servirEstatico(web: string, ruta: string, respuesta: ServerResponse): Promise<void> {
  const relativa = decodeURIComponent(ruta === "/" ? "/index.html" : ruta);
  const archivo = resolve(web, `.${relativa}`);
  if (!archivo.startsWith(web + sep)) {
    throw new ErrorHttp(404, "archivo-inexistente", "Ese archivo no existe.");
  }
  let contenido: Buffer;
  try {
    contenido = await readFile(archivo);
  } catch {
    throw new ErrorHttp(404, "archivo-inexistente", "Ese archivo no existe.");
  }
  respuesta.writeHead(200, {
    "Content-Type": TIPOS[extname(archivo)] ?? "application/octet-stream",
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'",
  });
  respuesta.end(contenido);
}
