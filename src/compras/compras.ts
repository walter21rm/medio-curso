import type { Compra, LineaCompra } from "../domain/documentos.ts";
import { Dinero } from "../domain/dinero.ts";
import { ReglaNegocio } from "../domain/errores.ts";
import { partirInstante } from "../domain/fecha.ts";
import type { Inventario } from "../domain/inventario.ts";
import { exigirCantidad, exigirId, exigirTexto } from "../domain/producto.ts";
import { costoPromedio } from "./costo.ts";

export interface EntradaCompra {
  id: string;
  proveedor: string;
  lineas: readonly LineaCompra[];
}

export class Compras {
  private readonly compras = new Map<string, Compra>();
  private readonly inventario: Inventario;

  constructor(inventario: Inventario) {
    this.inventario = inventario;
  }

  registrar(entrada: EntradaCompra): Compra {
    const id = exigirId(entrada.id);
    if (this.compras.has(id)) {
      throw new ReglaNegocio("compra-duplicada", "Esa compra ya está registrada.");
    }
    const proveedor = exigirTexto(entrada.proveedor, "El proveedor");
    if (entrada.lineas.length === 0) {
      throw new ReglaNegocio("compra-vacia", "La compra lleva al menos un producto.");
    }
    const vistos = new Set<string>();
    const lineas: LineaCompra[] = [];
    for (const linea of entrada.lineas) {
      const productoId = this.inventario.obtener(linea.productoId).id;
      if (vistos.has(productoId)) {
        throw new ReglaNegocio("linea-duplicada", "Un producto va en una sola línea de la compra.");
      }
      vistos.add(productoId);
      lineas.push({
        productoId,
        cantidad: exigirCantidad(linea.cantidad),
        costoUnitario: Dinero.desdeCentavos(linea.costoUnitario).centavos,
      });
    }
    const compra: Compra = { id, proveedor, estado: "borrador", lineas, recibidaEn: null };
    this.compras.set(id, compra);
    return copiar(compra);
  }

  recibir(id: string, ocurridoEn: string): Compra {
    const compra = this.exigir(id);
    if (compra.estado === "recibida") {
      throw new ReglaNegocio("compra-recibida", "Esa compra ya está recibida.");
    }
    const { instante } = partirInstante(ocurridoEn);
    for (const linea of compra.lineas) {
      const producto = this.inventario.obtener(linea.productoId);
      const nuevo = costoPromedio(
        producto.existencia,
        producto.costoPromedio,
        linea.cantidad,
        linea.costoUnitario,
      );
      this.inventario.actualizarCostoPromedio(producto.id, nuevo);
      this.inventario.reponer(producto.id, linea.cantidad, "compra", compra.id, instante);
    }
    const recibida: Compra = { ...compra, estado: "recibida", recibidaEn: instante };
    this.compras.set(compra.id, recibida);
    return copiar(recibida);
  }

  obtener(id: string): Compra {
    return copiar(this.exigir(id));
  }

  listar(): Compra[] {
    return [...this.compras.values()].map(copiar);
  }

  private exigir(id: string): Compra {
    const compra = this.compras.get(exigirId(id));
    if (compra === undefined) {
      throw new ReglaNegocio("compra-inexistente", "Esa compra no existe.");
    }
    return compra;
  }
}

function copiar(compra: Compra): Compra {
  return { ...compra, lineas: compra.lineas.map((linea) => ({ ...linea })) };
}
