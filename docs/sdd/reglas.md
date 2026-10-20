# Reglas

Mostrador es el mini ERP de una comercializadora con un solo almacén. Compra mercancía a proveedores, la guarda y la vende a clientes, de contado o a crédito. No incluye nómina, varias sucursales ni contabilidad de partida doble.

## Ciclo

Compra recibida → stock y costo actualizados → venta a crédito → abono → cierre de caja.

## Está listo cuando

Una compra recibida actualiza stock y costo promedio. Una venta a crédito baja el stock y abre una cuenta por cobrar. Un abono baja esa deuda y entra a caja. El cierre del día compara el efectivo contado contra las ventas de contado más los abonos, y deja la diferencia registrada.

## Las seis reglas

1. Cada producto tiene existencia, costo promedio y precio. El costo promedio se recalcula al recibir una compra.
2. Una compra pasa por borrador y luego recibida. Solo la recepción sube el stock.
3. Una venta al contado entra a caja y baja el stock. Una venta a crédito baja el stock y abre una cuenta por cobrar, con fecha de vencimiento.
4. No se vende más de lo que hay. Anular una venta devuelve el stock y, si era a crédito, cancela la deuda.
5. Un abono baja la cartera y entra a caja. Un saldo vencido aparece solo en la lista de cobranza.
6. El cierre del día compara el efectivo contado contra las ventas de contado más los abonos. La diferencia queda registrada.

Cada pull request hace una sola regla y trae el test que la demuestra. Un pull request que rompe una regla no entra a `main`.

## Orden

1. Esqueleto. Compartido. Cualquiera de las dos lo abre y las dos lo revisan.
2. Catálogo. Parte A.
3. Recibir compra. Parte A.
4. Costo promedio. Parte A.
5. Kardex. Parte A.
6. Venta al contado. Parte B.
7. Venta a crédito. Parte B.
8. Anulación. Parte B.
9. Abono. Parte B.
10. Cobranza vencida. Parte B.
11. Cierre de caja. Parte B.

Quien toma inventario mergea catálogo, compras y kardex primero. Quien toma ventas parte de ese `main`. Si las dos tocan el stock en la misma semana, entra primero el pull request que ya tiene el test «la existencia no queda negativa».

Ese orden ya está en `main`: inventario y ventas. Lo que sigue es el frontend de la parte A y, después, una sola instancia EC2.
