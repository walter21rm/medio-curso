# Mostrador

Mini ERP para una comercializadora con un solo almacén. Compras, inventario, ventas, cartera y caja viven en este repositorio. El mismo producto pasa por el costo, el stock y la deuda, y los tres tienen que cuadrar.

El negocio compra mercancía a proveedores, la guarda y la vende a clientes, de contado o a crédito. El alcance es el mostrador y el almacén.

## Ciclo

Compra recibida → stock y costo actualizados → venta a crédito → abono → cierre de caja.

Está listo cuando una compra recibida actualiza stock y costo promedio, una venta a crédito baja el stock y abre una cuenta por cobrar, un abono baja esa deuda y entra a caja, y el cierre del día deja registrada la diferencia entre el efectivo contado y las ventas de contado más los abonos.

## Reparto

Dos personas, un solo remoto y la rama `main`. Cada una abre su propia rama.

| Parte | Ramas | Qué cierra |
| --- | --- | --- |
| A · Inventario | `feature/catalogo`, `feature/compras`, `feature/kardex` | Productos, recepción de compra, costo promedio y movimientos de stock |
| B · Ventas | `feature/ventas`, `feature/cartera`, `feature/caja` | Venta de contado y a crédito, deuda, abonos y cierre del día |

Las reglas, los estados y los formatos están en [docs/sdd](docs/sdd/README.md).

## Comandos

Hace falta Node 22 o superior.

```text
npm install
npm run check
```

La aplicación correrá en AWS, en una instancia EC2, cuando el ciclo esté en `main`. El detalle está en [docs/infra/EC2.md](docs/infra/EC2.md).
