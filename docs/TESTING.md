# Pruebas

`npm test` ejecuta las pruebas de Node en `tests/**/*.test.ts` y `tests/**/*.test.mjs`.

Las de Mostrador cubren la existencia que no queda negativa, la venta al contado, la venta a crédito, la anulación, el abono, la cobranza vencida y el cierre. `tests/servidor.test.ts` levanta el servidor en un puerto libre y recorre el ciclo completo por la API, comprueba que una regla rota sale como 422 y que el servidor no sirve archivos fuera de `web/`. Las del arnés cubren secretos e invariantes.

`npm run check` llama a las pruebas después de los sensores. El mismo comando corre en GitHub Actions.
