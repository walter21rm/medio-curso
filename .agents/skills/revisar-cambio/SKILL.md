# Revisar un cambio

1. Lee la tarea del pull request y compárala con `docs/product/ALCANCE.md`. Si el producto sigue pendiente, el diff no debe crear `src/`.
2. Mira si el cambio toca `INVARIANTS.md` o `docs/DECISIONS.md`. Eso pide acuerdo de las dos personas.
3. Confirma que GitHub muestra `check` en verde. Si no corrió, pídelo con `npm run check` en la rama.
4. Busca secretos, `.env` y claves AWS. No deben estar en el diff.
5. Si el comentario de revisión cambia una regla, esa regla entra al repositorio en un commit. El chat no le basta al agente de la otra persona.
