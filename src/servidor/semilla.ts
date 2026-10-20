import { abonar } from "../cartera/cartera.ts";
import { altaProducto } from "../catalogo/catalogo.ts";
import { venderContado, venderCredito } from "../ventas/registrar.ts";
import type { Mostrador } from "./app.ts";

const DIA = 24 * 60 * 60 * 1000;

const PRODUCTOS = [
  { id: "prod-1", nombre: "Arroz extra 5 kg", existencia: 12, costoPromedio: 1950, precio: 2490 },
  { id: "prod-2", nombre: "Aceite vegetal 1 L", existencia: 24, costoPromedio: 720, precio: 990 },
  { id: "prod-3", nombre: "Azúcar rubia 1 kg", existencia: 30, costoPromedio: 380, precio: 490 },
  { id: "prod-4", nombre: "Leche evaporada 400 g", existencia: 6, costoPromedio: 310, precio: 420 },
  { id: "prod-5", nombre: "Fideos spaghetti 500 g", existencia: 40, costoPromedio: 290, precio: 390 },
  { id: "prod-6", nombre: "Atún en trozos 170 g", existencia: 3, costoPromedio: 520, precio: 690 },
  { id: "prod-7", nombre: "Detergente 1 kg", existencia: 15, costoPromedio: 890, precio: 1190 },
  { id: "prod-8", nombre: "Jabón de tocador x3", existencia: 18, costoPromedio: 450, precio: 620 },
];

// Datos de ejemplo para probar y presentar. Pasan por las mismas reglas que los datos reales.
export function sembrar(m: Mostrador, ahora: Date): void {
  const hace = (dias: number) => new Date(ahora.getTime() - dias * DIA).toISOString();
  const dia = (dias: number) => hace(dias).slice(0, 10);

  for (const producto of PRODUCTOS) {
    altaProducto(m.estado.inventario, producto);
  }

  // En orden cronológico, para que el kardex y la caja se lean como pasaron.
  venderCredito(m.estado, {
    id: "ven-1",
    cliente: "Bodega Rosita",
    lineas: [
      { productoId: "prod-1", cantidad: 4 },
      { productoId: "prod-3", cantidad: 6 },
    ],
    vencimiento: dia(3),
    ocurridoEn: hace(18),
  });
  abonar(m.estado, { id: "abo-1", cuentaId: "cxc-ven-1", monto: 5000, ocurridoEn: hace(9) });
  m.compras.registrar({
    id: "com-1",
    proveedor: "Distribuidora Andes",
    lineas: [
      { productoId: "prod-1", cantidad: 10, costoUnitario: 2030 },
      { productoId: "prod-2", cantidad: 12, costoUnitario: 740 },
    ],
  });
  m.compras.recibir("com-1", hace(6));
  venderCredito(m.estado, {
    id: "ven-2",
    cliente: "Minimarket San Juan",
    lineas: [
      { productoId: "prod-2", cantidad: 6 },
      { productoId: "prod-7", cantidad: 3 },
    ],
    vencimiento: dia(-14),
    ocurridoEn: hace(2),
  });
  venderContado(m.estado, {
    id: "ven-3",
    cliente: "Nora Quispe",
    lineas: [
      { productoId: "prod-5", cantidad: 4 },
      { productoId: "prod-4", cantidad: 2 },
    ],
    ocurridoEn: hace(1),
  });
  m.compras.registrar({
    id: "com-2",
    proveedor: "Comercial del Norte",
    lineas: [
      { productoId: "prod-6", cantidad: 24, costoUnitario: 510 },
      { productoId: "prod-4", cantidad: 24, costoUnitario: 305 },
    ],
  });
  venderContado(m.estado, {
    id: "ven-4",
    cliente: "Cliente de mostrador",
    lineas: [
      { productoId: "prod-2", cantidad: 2 },
      { productoId: "prod-8", cantidad: 1 },
    ],
    ocurridoEn: hace(0),
  });
  abonar(m.estado, { id: "abo-2", cuentaId: "cxc-ven-1", monto: 2000, ocurridoEn: hace(0) });
}
