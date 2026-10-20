# Pruebas

`npm test` ejecuta `tests/**/*.test.mjs` con el corredor de Node.

Cubren los tres sensores del arnés: que una credencial armada en memoria se detecta, que cada viñeta de `INVARIANTS.md` cita un aplicador real, y que `src/` no aparece mientras el producto siga pendiente.

`npm run check` llama a las pruebas después de los sensores. El mismo comando corre en GitHub Actions.
