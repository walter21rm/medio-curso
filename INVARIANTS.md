# INVARIANTS.md

Estas reglas no se negocian dentro de un cambio normal. Modificar este archivo exige revisión humana de las dos personas.

## Reparto

- Hay un solo remoto y una sola rama troncal, `main`. La parte A cierra inventario y la parte B cierra ventas, cartera y caja. *Aplicado por: `revisión humana`*
- Un cambio entra por pull request y cubre una sola regla del brief, con el test que la demuestra. *Aplicado por: `revisión humana`*
- Una decisión que no está en el repositorio no existe para el agente de la otra persona. *Aplicado por: `revisión humana`*

## Stock y dinero

- La existencia no queda negativa. *Aplicado por: `npm run test`*
- En `src/` no hay literales decimales, `parseFloat` ni `toFixed`. El dinero va en centavos enteros. *Aplicado por: `npm run sensor:dinero`*
- No se vende más de lo que hay. *Aplicado por: `npm run test`*
- Una venta al contado baja el stock y entra el total a caja. *Aplicado por: `aún no aplicado`*
- Una venta a crédito baja el stock y abre una cuenta por cobrar con vencimiento. *Aplicado por: `aún no aplicado`*
- Anular una venta devuelve el stock. Si era a crédito, cancela la deuda. Si era al contado, revierte el ingreso de caja. *Aplicado por: `aún no aplicado`*
- Un abono baja el saldo y entra a caja. No supera el saldo. *Aplicado por: `aún no aplicado`*
- La lista de cobranza muestra solo cuentas abiertas con vencimiento anterior al día consultado. *Aplicado por: `aún no aplicado`*
- El cierre guarda la diferencia entre el efectivo contado y las ventas de contado más los abonos, menos los reversos de ese día. *Aplicado por: `aún no aplicado`*

## Parte A · Inventario

Lo cierra la parte A en `src/catalogo`, `src/compras` y `src/kardex`. La parte B no reescribe estos módulos: si necesita otra cosa del inventario, la pide en un pull request de la parte A.

- Cada producto tiene existencia, costo promedio y precio válidos al darse de alta. Un id repetido se rechaza. *Aplicado por: `npm run test`*
- Una compra en borrador no sube el stock. Solo la recepción lo sube, y una compra recibida no vuelve a recibirse. *Aplicado por: `npm run test`*
- Un producto va en una sola línea de la compra. *Aplicado por: `npm run test`*
- El costo promedio se recalcula al recibir una compra, con la existencia de antes de reponer y el redondeo half-up descrito en `docs/sdd/parte-a-inventario.md`. *Aplicado por: `npm run test`*
- Cada entrada y cada salida de stock queda en el kardex, en orden. *Aplicado por: `npm run test`*
- `src/catalogo`, `src/compras` y `src/kardex` no hacen I/O. La capa que corra en EC2 los envuelve sin cambiarlos. *Aplicado por: `revisión humana`*

## Seguridad

- El árbol no contiene credenciales, claves AWS ni tokens. *Aplicado por: `npm run sensor:secretos`*
- `.env` y los secretos de EC2 quedan fuera del repositorio. *Aplicado por: `revisión humana`*
- Un agente no hace commit, push ni merge salvo que la persona lo pida en el mensaje. *Aplicado por: `revisión humana`*

## Calidad

- `npm run check` termina en cero antes de abrir o actualizar un pull request. *Aplicado por: `revisión humana`*
- El TypeScript estricto pasa. *Aplicado por: `npm run typecheck`*
- Cada viñeta de este archivo declara un aplicador, y cada `npm run` citado existe en el arnés. *Aplicado por: `npm run sensor:invariantes`*
- `package.json` no define `install`, `preinstall` ni `postinstall`. *Aplicado por: `npm run sensor:invariantes`*
- La aplicación en EC2 se crea cuando el mostrador tenga el ciclo completo en `main`. *Aplicado por: `aún no aplicado`*
