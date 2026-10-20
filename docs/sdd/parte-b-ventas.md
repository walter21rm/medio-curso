# Parte B · Ventas, cartera y caja

La cierra esta parte. Ramas: `feature/ventas`, `feature/cartera`, `feature/caja`.

Parte de los productos que ya están en el inventario. No recibe compras ni recalcula el costo.

## Venta al contado

Baja el stock de cada línea y entra el total a caja con tipo `venta_contado`. No abre cuenta por cobrar. El total es la suma de cantidad por precio vigente del producto.

Rechaza una venta vacía, un id repetido, un producto que no existe, una cantidad que no sea un entero mayor que cero, y un día que ya tiene cierre.

## Venta a crédito

Baja el stock igual que la de contado. Abre una cuenta `abierta` con saldo igual al total y el vencimiento indicado. No entra dinero a caja. Sin vencimiento, no hay venta.

## Anulación

Solo una venta `confirmada` se anula. Devuelve el stock con origen `anulacion`. Si era a crédito, la cuenta pasa a `cancelada` y el saldo queda en cero. Si era al contado, entra un movimiento `reverso_venta` por el total, en la fecha de la anulación, para que el cierre no siga contando ese dinero. Una segunda anulación se rechaza.

## Abono

El monto es un entero de centavos mayor que cero y menor o igual que el saldo. Baja el saldo y entra a caja con tipo `abono`. Si el saldo llega a cero, la cuenta pasa a `pagada`. No se abona una cuenta pagada ni una cancelada.

## Cobranza vencida

La lista incluye solo cuentas `abierta` con saldo mayor que cero y vencimiento estrictamente anterior al día consultado. Una cuenta que vence hoy no entra. Una pagada o cancelada tampoco.

## Cierre de caja

`esperado` suma, en esa fecha UTC, las ventas de contado y los abonos, y resta los reversos. `diferencia` es el efectivo contado menos ese esperado. El cierre queda guardado. Un segundo cierre de la misma fecha se rechaza. Con el día cerrado no entran ventas, anulaciones ni abonos de esa fecha.

## Cómo se prueba

`npm test` cubre cada una de estas reglas. El test «la existencia no queda negativa» vive en el esqueleto y la venta al contado lo vuelve a demostrar desde el mostrador.
