# Alcance

Mostrador es el mini ERP de una comercializadora con un solo almacén. El mismo producto pasa por el costo, el stock y la deuda, y los tres tienen que cuadrar.

Está listo cuando una compra recibida actualiza stock y costo promedio, una venta a crédito baja el stock y abre una cuenta por cobrar, un abono baja esa deuda y entra a caja, y el cierre del día deja registrada la diferencia entre el efectivo contado y las ventas de contado más los abonos.

## Reparto

| Parte | Quién | Ramas | Cierra |
| --- | --- | --- | --- |
| A Inventario | La compañera | `feature/catalogo`, `feature/compras`, `feature/kardex` | Productos, recepción, costo promedio y kardex |
| B Ventas | Esta parte | `feature/ventas`, `feature/cartera`, `feature/caja` | Contado, crédito, anulación, abonos, cobranza y cierre |

Las specs están en [docs/sdd](../sdd/README.md). Inventario, ventas y el frontend ya están en `main`. La instancia EC2 es una sola: [docs/infra/EC2.md](../infra/EC2.md).
