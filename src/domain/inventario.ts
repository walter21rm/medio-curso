import type { MovimientoStock, OrigenStock } from "./documentos.ts";
import { ReglaNegocio } from "./errores.ts";
import { Dinero } from "./dinero.ts";
import { exigirCantidad, exigirId, type Producto } from "./producto.ts";

export class Inventario {
  private readonly productos = new Map<string, Producto>();
  private readonly movimientos: MovimientoStock[] = [];

  poner(producto: Producto): void {
    if (this.productos.has(producto.id)) {
      throw new ReglaNegocio("producto-duplicado", "Ese producto ya está en el almacén.");
    }
    this.productos.set(producto.id, { ...producto });
  }

  obtener(id: string): Producto {
    const producto = this.productos.get(exigirId(id));
    if (producto === undefined) {
      throw new ReglaNegocio("producto-inexistente", "Ese producto no está en el almacén.");
    }
    return { ...producto };
  }

  actualizarCostoPromedio(productoId: string, costoPromedio: number): void {
    const producto = this.exigir(productoId);
    producto.costoPromedio = Dinero.desdeCentavos(costoPromedio).centavos;
  }

  descontar(
    productoId: string,
    cantidad: number,
    origen: OrigenStock,
    origenId: string,
    ocurridoEn: string,
  ): MovimientoStock {
    return this.mover(productoId, cantidad, "salida", origen, origenId, ocurridoEn);
  }

  reponer(
    productoId: string,
    cantidad: number,
    origen: OrigenStock,
    origenId: string,
    ocurridoEn: string,
  ): MovimientoStock {
    return this.mover(productoId, cantidad, "entrada", origen, origenId, ocurridoEn);
  }

  listarMovimientos(): MovimientoStock[] {
    return this.movimientos.map((movimiento) => ({ ...movimiento }));
  }

  private mover(
    productoId: string,
    cantidad: number,
    direccion: MovimientoStock["direccion"],
    origen: OrigenStock,
    origenId: string,
    ocurridoEn: string,
  ): MovimientoStock {
    const unidades = exigirCantidad(cantidad);
    const producto = this.exigir(productoId);
    if (direccion === "salida" && producto.existencia < unidades) {
      throw new ReglaNegocio(
        "existencia-insuficiente",
        "No se vende más de lo que hay.",
      );
    }
    producto.existencia += direccion === "salida" ? -unidades : unidades;
    const movimiento: MovimientoStock = {
      id: `mov-${origen}-${exigirId(origenId)}-${producto.id}-${direccion}`,
      productoId: producto.id,
      direccion,
      cantidad: unidades,
      origen,
      origenId,
      ocurridoEn,
    };
    this.movimientos.push(movimiento);
    return { ...movimiento };
  }

  private exigir(productoId: string): Producto {
    const producto = this.productos.get(exigirId(productoId));
    if (producto === undefined) {
      throw new ReglaNegocio("producto-inexistente", "Ese producto no está en el almacén.");
    }
    return producto;
  }
}
