import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, it } from "node:test";
import { crearApp, crearMostrador } from "../src/servidor/app.ts";
import { AHORA } from "./apoyo.ts";

let servidor: Server | undefined;
let base = "";

async function pedir(metodo: string, ruta: string, cuerpo?: unknown) {
  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: cuerpo === undefined ? {} : { "Content-Type": "application/json" },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  });
  const tipo = respuesta.headers.get("content-type") ?? "";
  const datos: unknown = tipo.startsWith("application/json") ? await respuesta.json() : await respuesta.text();
  return { estado: respuesta.status, datos: datos as Record<string, unknown> & unknown[] };
}

async function levantar(): Promise<void> {
  const nuevo = createServer(crearApp({ semilla: false, reloj: () => new Date(AHORA) }));
  await new Promise<void>((resolver) => nuevo.listen(0, resolver));
  servidor = nuevo;
  base = `http://localhost:${(nuevo.address() as AddressInfo).port}`;
}

afterEach(() => {
  servidor?.close();
  servidor = undefined;
});

describe("servidor", () => {
  it("recorre el ciclo: compra recibida, venta a crédito, abono y cierre de caja", async () => {
    await levantar();
    const alta = await pedir("POST", "/api/productos", {
      nombre: "Arroz",
      existencia: 10,
      costoPromedio: 500,
      precio: 800,
    });
    assert.equal(alta.estado, 201);
    assert.equal(alta.datos.id, "prod-1");

    const compra = await pedir("POST", "/api/compras", {
      proveedor: "Andes",
      lineas: [{ productoId: "prod-1", cantidad: 10, costoUnitario: 700 }],
    });
    assert.equal(compra.datos.estado, "borrador");
    const recibida = await pedir("POST", `/api/compras/${String(compra.datos.id)}/recibir`);
    assert.equal(recibida.datos.estado, "recibida");

    const venta = await pedir("POST", "/api/ventas", {
      tipo: "credito",
      cliente: "Nora",
      vencimiento: "2026-11-20",
      lineas: [{ productoId: "prod-1", cantidad: 2 }],
    });
    assert.equal(venta.estado, 201);
    assert.equal(venta.datos.total, 1600);

    const productos = await pedir("GET", "/api/productos");
    assert.deepEqual(productos.datos[0], {
      id: "prod-1",
      nombre: "Arroz",
      existencia: 18,
      costoPromedio: 600,
      precio: 800,
    });

    const abono = await pedir("POST", "/api/abonos", { cuentaId: `cxc-${String(venta.datos.id)}`, monto: 600 });
    assert.equal(abono.estado, 201);
    const cuentas = await pedir("GET", "/api/cuentas");
    assert.equal((cuentas.datos[0] as { saldo: number }).saldo, 1000);

    const cierre = await pedir("POST", "/api/cierres", { fecha: "2026-10-20", efectivoContado: 500 });
    assert.equal(cierre.estado, 201);
    assert.deepEqual(cierre.datos, {
      id: "cie-2026-10-20",
      fecha: "2026-10-20",
      efectivoContado: 500,
      esperado: 600,
      diferencia: -100,
    });

    const kardex = await pedir("GET", "/api/productos/prod-1/kardex");
    const movimientos = kardex.datos.movimientos as { direccion: string; origen: string }[];
    assert.deepEqual(
      movimientos.map((m) => `${m.direccion}:${m.origen}`),
      ["entrada:compra", "salida:venta"],
    );
  });

  it("devuelve la regla de negocio rota como 422 con su código", async () => {
    await levantar();
    await pedir("POST", "/api/productos", { nombre: "Arroz", existencia: 1, costoPromedio: 500, precio: 800 });
    const respuesta = await pedir("POST", "/api/ventas", {
      tipo: "contado",
      cliente: "Nora",
      lineas: [{ productoId: "prod-1", cantidad: 999 }],
    });
    assert.equal(respuesta.estado, 422);
    assert.equal((respuesta.datos.error as { codigo: string }).codigo, "existencia-insuficiente");
  });

  it("rechaza una entrada con el tipo equivocado sin caerse", async () => {
    await levantar();
    const respuesta = await pedir("POST", "/api/productos", { nombre: "Azúcar", existencia: "diez", costoPromedio: 1, precio: 1 });
    assert.equal(respuesta.estado, 422);
    assert.equal((respuesta.datos.error as { codigo: string }).codigo, "entrada-invalida");
  });

  it("sirve el front y no sale de la carpeta web", async () => {
    await levantar();
    const inicio = await pedir("GET", "/");
    assert.equal(inicio.estado, 200);
    assert.match(String(inicio.datos), /<title>Mostrador<\/title>/);
    const fuera = await pedir("GET", "/..%2fpackage.json");
    assert.equal(fuera.estado, 404);
  });

  it("los datos de ejemplo pasan por las reglas del dominio", () => {
    const mostrador = crearMostrador({ reloj: () => new Date(AHORA) });
    assert.equal(mostrador.estado.inventario.listar().length, 8);
    assert.equal(mostrador.compras.listar().filter((c) => c.estado === "borrador").length, 1);
    assert.equal(mostrador.estado.cuentas.get("cxc-ven-1")?.saldo, 5900);
  });
});
