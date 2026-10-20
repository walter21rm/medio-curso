# Parte A · Inventario

La cierra la compañera. Ramas: `feature/catalogo`, `feature/compras`, `feature/kardex`.

Esta parte no implementa alta de catálogo, recepción ni la fórmula del costo. El esqueleto ya deja el producto, el movimiento de stock y dos operaciones que compras y ventas comparten:

- `poner` registra un producto válido.
- `descontar` baja existencia y deja una salida. Rechaza la operación si la existencia quedaría negativa.
- `reponer` sube existencia y deja una entrada.
- `actualizarCostoPromedio` guarda el costo nuevo, ya calculado.
- `listarMovimientos` devuelve el kardex crudo.

## Catálogo

`altaProducto` en `src/catalogo/catalogo.ts`. Alta de producto con existencia, costo promedio y precio. El nombre, ya recortado, tiene entre 1 y 120 caracteres. Existencia y costo son enteros cero o mayores. El precio es un entero mayor que cero. Un id repetido se rechaza.

## Recibir compra

`Compras` en `src/compras/compras.ts`, sobre el mismo `Inventario` que usan las ventas. La compra nace en `borrador` y no toca el stock. `recibir` llama a `reponer` por cada línea, con origen `compra`, guarda `recibidaEn` y no vuelve a recibirse.

Al registrar se rechaza una compra vacía, un id repetido, un producto que no existe, una cantidad que no sea un entero mayor que cero y un costo unitario que no sea un entero de centavos cero o mayor. Un producto va en una sola línea de la compra: dos líneas del mismo producto se rechazan, porque el id del movimiento de stock es único por compra y producto.

## Costo promedio

Al recibir, el costo del producto pasa a ser el promedio ponderado, redondeado half-up al centavo:

`nuevo = redondear((existencia * costoPromedio + cantidad * costoUnitario) / (existencia + cantidad))`

Ejemplo: existencia 10, costo 500, compra de 10 a 700. El nuevo costo es 600.

Ejemplo de borde: existencia 1, costo 100, compra de 1 a 51. El cociente es 75.5 y el costo guardado es 76.

El costo de una compra se calcula con la existencia de antes de reponer.

`costoPromedio` en `src/compras/costo.ts` redondea solo con enteros, `floor((2 * suma + unidades) / (2 * unidades))`, porque `sensor:dinero` no deja literales decimales en `src/`.

## Kardex

Cada `reponer` y cada `descontar` ya appenda un movimiento. `kardex` en `src/kardex/kardex.ts` devuelve los movimientos de un producto, en orden. El pull request de kardex demuestra que una compra recibida y una salida quedan listadas, en orden, con producto, dirección, cantidad y origen.

## Despliegue

Mostrador se va a desplegar en AWS, en EC2 (ver `docs/infra/EC2.md`). Por eso catálogo, compras y kardex no hacen I/O: no leen archivos, red ni variables de entorno. La capa HTTP y la persistencia que corran en EC2 envuelven estas funciones sin cambiarlas, y las credenciales se quedan fuera del repositorio.
