import { cerrarCaja, type EntradaCierre } from "./caja/cierre.ts";
import { abonar, cobranzaVencida, type EntradaAbono } from "./cartera/cartera.ts";
import type { Cierre, CuentaPorCobrar, MovimientoCaja, Venta } from "./domain/documentos.ts";
import type { EstadoMostrador } from "./domain/estado.ts";
import { ReglaNegocio } from "./domain/errores.ts";
import { Inventario } from "./domain/inventario.ts";
import type { Producto } from "./domain/producto.ts";
import { anularVenta, venderContado, venderCredito, type EntradaContado, type EntradaCredito } from "./ventas/registrar.ts";

export class Mostrador {
  private readonly estado: EstadoMostrador;

  constructor() {
    this.estado = {
      inventario: new Inventario(),
      ventas: new Map(),
      cuentas: new Map(),
      abonos: [],
      caja: [],
      cierres: new Map(),
    };
  }

  ponerProducto(producto: Producto): void {
    this.estado.inventario.poner(producto);
  }

  existencia(productoId: string): number {
    return this.estado.inventario.obtener(productoId).existencia;
  }

  venderContado(entrada: EntradaContado): Venta {
    return venderContado(this.estado, entrada);
  }

  venderCredito(entrada: EntradaCredito): Venta {
    return venderCredito(this.estado, entrada);
  }

  anularVenta(id: string, ocurridoEn: string): Venta {
    return anularVenta(this.estado, id, ocurridoEn);
  }

  abonar(entrada: EntradaAbono): ReturnType<typeof abonar> {
    return abonar(this.estado, entrada);
  }

  cobranzaVencida(hoy: string): CuentaPorCobrar[] {
    return cobranzaVencida(this.estado, hoy);
  }

  cerrarCaja(entrada: EntradaCierre): Cierre {
    return cerrarCaja(this.estado, entrada);
  }

  cuentaDe(ventaId: string): CuentaPorCobrar {
    const cuenta = this.estado.cuentas.get(`cxc-${ventaId}`);
    if (cuenta === undefined) {
      throw new ReglaNegocio("cuenta-inexistente", "Esa venta a crédito no tiene cuenta.");
    }
    return { ...cuenta };
  }

  movimientosCaja(): MovimientoCaja[] {
    return this.estado.caja.map((movimiento) => ({ ...movimiento }));
  }
}
