# Revisar un cambio

1. Lee la tarea del pull request y compárala con [docs/sdd](../../docs/sdd/README.md). La parte A toca catálogo, compras y kardex. La parte B toca ventas, cartera y caja.
2. Un cambio de inventario no reescribe `src/ventas`, `src/cartera` ni `src/caja`. Un cambio de ventas no reescribe `src/catalogo`, `src/compras` ni `src/kardex`.
3. Una compra con el mismo producto en dos líneas se rechaza. Una venta suma esas líneas.
4. Mira si el cambio toca `INVARIANTS.md` o `docs/DECISIONS.md`. Eso pide acuerdo de las dos personas.
5. Confirma que GitHub muestra `check` en verde. Si no corrió, pídelo con `npm run check` en la rama.
6. Busca secretos, `.env` y claves AWS. No deben estar en el diff.
7. Si el comentario de revisión cambia una regla, esa regla entra al repositorio en un commit. El chat no le basta al agente de la otra persona.
