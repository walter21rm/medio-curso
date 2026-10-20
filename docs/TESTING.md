# Pruebas

`npm test` ejecuta las pruebas de Node en `tests/**/*.test.ts` y `tests/**/*.test.mjs`.

Las de Mostrador cubren la existencia que no queda negativa, la venta al contado, la venta a crédito, la anulación, el abono, la cobranza vencida y el cierre. Las del arnés cubren secretos e invariantes.

`npm run check` llama a las pruebas después de los sensores. El mismo comando corre en GitHub Actions.
