# Parte A · Inventario

La cierra la compañera. Ramas: `feature/catalogo`, `feature/compras`, `feature/kardex`.

Esta parte no implementa alta de catálogo, recepción ni la fórmula del costo. El esqueleto ya deja el producto, el movimiento de stock y dos operaciones que compras y ventas comparten:

- `poner` registra un producto válido.
- `descontar` baja existencia y deja una salida. Rechaza la operación si la existencia quedaría negativa.
- `reponer` sube existencia y deja una entrada.
- `actualizarCostoPromedio` guarda el costo nuevo, ya calculado.
- `listarMovimientos` devuelve el kardex crudo.

## Catálogo

Alta de producto con existencia, costo promedio y precio. El nombre, ya recortado, tiene entre 1 y 120 caracteres. Existencia y costo son enteros cero o mayores. El precio es un entero mayor que cero.

## Recibir compra

La compra nace en `borrador` y no toca el stock. `recibida` llama a `reponer` por cada línea, con origen `compra`, y no vuelve a recibirse.

## Costo promedio

Al recibir, el costo del producto pasa a ser el promedio ponderado, redondeado half-up al centavo:

`nuevo = redondear((existencia * costoPromedio + cantidad * costoUnitario) / (existencia + cantidad))`

Ejemplo: existencia 10, costo 500, compra de 10 a 700. El nuevo costo es 600.

Ejemplo de borde: existencia 1, costo 100, compra de 1 a 51. El cociente es 75.5 y el costo guardado es 76.

El costo de una compra se calcula con la existencia de antes de reponer.

## Kardex

Cada `reponer` y cada `descontar` ya appenda un movimiento. El pull request de kardex demuestra que una compra recibida y una salida quedan listadas, en orden, con producto, dirección, cantidad y origen.
