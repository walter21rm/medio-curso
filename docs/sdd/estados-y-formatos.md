# Estados y formatos

Los montos son centavos enteros. Diez soles son `1000`. La existencia es un entero de unidades, cero o mayor. Los identificadores coinciden con `^[A-Za-z0-9-]{1,64}$`. El instante se guarda como ISO-8601 UTC con milisegundos, el formato de `Date.toISOString`. El día de caja es el prefijo `YYYY-MM-DD` de ese instante, en UTC.

## Compra

Estados: `borrador`, `recibida`.

```json
{
  "id": "com-1",
  "proveedor": "Andes",
  "estado": "borrador",
  "lineas": [{ "productoId": "prod-1", "cantidad": 4, "costoUnitario": 700 }],
  "recibidaEn": null
}
```

`recibidaEn` solo tiene instante cuando el estado es `recibida`.

## Producto

```json
{
  "id": "prod-1",
  "nombre": "Arroz",
  "existencia": 10,
  "costoPromedio": 500,
  "precio": 800
}
```

## Venta

Estados: `confirmada`, `anulada`. Tipos: `contado`, `credito`.

```json
{
  "id": "ven-1",
  "cliente": "Nora",
  "tipo": "credito",
  "estado": "confirmada",
  "lineas": [{ "productoId": "prod-1", "cantidad": 2, "precioUnitario": 800 }],
  "total": 1600,
  "vencimiento": "2026-11-20",
  "ocurridoEn": "2026-10-20T15:00:00.000Z"
}
```

`vencimiento` existe solo en una venta a crédito. El precio de la línea es el precio del producto en el momento de la venta. Dos líneas del mismo producto se suman en una sola.

## Movimiento de stock

```json
{
  "id": "mov-venta-ven-1-prod-1-salida",
  "productoId": "prod-1",
  "direccion": "salida",
  "cantidad": 2,
  "origen": "venta",
  "origenId": "ven-1",
  "ocurridoEn": "2026-10-20T15:00:00.000Z"
}
```

`direccion` es `entrada` o `salida`. `origen` es `compra`, `venta` o `anulacion`.

## Cuenta por cobrar

Estados: `abierta`, `pagada`, `cancelada`.

```json
{
  "id": "cxc-ven-1",
  "ventaId": "ven-1",
  "cliente": "Nora",
  "monto": 1600,
  "saldo": 1600,
  "vencimiento": "2026-11-20",
  "estado": "abierta"
}
```

El id es `cxc-` más el id de la venta.

## Abono

```json
{
  "id": "abo-1",
  "cuentaId": "cxc-ven-1",
  "monto": 600,
  "ocurridoEn": "2026-10-21T15:00:00.000Z"
}
```

## Movimiento de caja

```json
{
  "id": "caja-ven-1",
  "tipo": "venta_contado",
  "monto": 1600,
  "origenId": "ven-1",
  "ocurridoEn": "2026-10-20T15:00:00.000Z"
}
```

`tipo` es `venta_contado`, `abono` o `reverso_venta`.

## Cierre

```json
{
  "id": "cie-2026-10-20",
  "fecha": "2026-10-20",
  "efectivoContado": 1500,
  "esperado": 1600,
  "diferencia": -100
}
```

`diferencia` es efectivo contado menos esperado. Puede ser negativa. Hay un cierre por fecha.
