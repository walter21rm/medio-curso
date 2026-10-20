export class ErrorApi extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

async function pedir(metodo, ruta, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: cuerpo === undefined ? {} : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi("sin-conexion", "No hay conexión con el servidor. Revisa que Mostrador siga corriendo.");
  }
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(datos?.error?.codigo ?? "desconocido", datos?.error?.mensaje ?? "No se pudo completar la operación.");
  }
  return datos;
}

export const api = {
  resumen: (fecha) => pedir("GET", fecha ? `/resumen?fecha=${fecha}` : "/resumen"),
  productos: () => pedir("GET", "/productos"),
  crearProducto: (datos) => pedir("POST", "/productos", datos),
  kardex: (id) => pedir("GET", `/productos/${encodeURIComponent(id)}/kardex`),
  compras: () => pedir("GET", "/compras"),
  crearCompra: (datos) => pedir("POST", "/compras", datos),
  recibirCompra: (id) => pedir("POST", `/compras/${encodeURIComponent(id)}/recibir`),
  ventas: () => pedir("GET", "/ventas"),
  crearVenta: (datos) => pedir("POST", "/ventas", datos),
  anularVenta: (id) => pedir("POST", `/ventas/${encodeURIComponent(id)}/anular`),
  cuentas: () => pedir("GET", "/cuentas"),
  abonos: () => pedir("GET", "/abonos"),
  abonar: (datos) => pedir("POST", "/abonos", datos),
  caja: (fecha) => pedir("GET", fecha ? `/caja?fecha=${fecha}` : "/caja"),
  cerrarCaja: (datos) => pedir("POST", "/cierres", datos),
};
