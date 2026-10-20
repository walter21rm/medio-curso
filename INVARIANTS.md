# INVARIANTS.md

Estas reglas no se negocian dentro de un cambio normal. Modificar este archivo exige revisión humana de las dos personas.

## Repositorio

- Hay un solo remoto y una sola rama troncal, `main`. Cada persona trabaja en su propia rama. *Aplicado por: `revisión humana`*
- Un cambio de producto entra por pull request. La persona define la tarea y el criterio de aceptación; el agente implementa, corre `npm run check`, hace push y abre el PR. *Aplicado por: `revisión humana`*
- Una decisión que no está en el repositorio no existe para el agente de la otra persona. *Aplicado por: `revisión humana`*
- El producto sigue pendiente hasta que `docs/product/ALCANCE.md` deje de decir `PRODUCTO: pendiente`. Mientras tanto no hay código en `src/`. *Aplicado por: `npm run sensor:producto`*

## Seguridad

- El árbol no contiene credenciales, claves AWS ni tokens. *Aplicado por: `npm run sensor:secretos`*
- `.env` y los secretos de EC2 quedan fuera del repositorio. *Aplicado por: `revisión humana`*
- Un agente no hace commit, push ni merge salvo que la persona lo pida en el mensaje. *Aplicado por: `revisión humana`*

## Calidad

- `npm run check` termina en cero antes de abrir o actualizar un pull request. *Aplicado por: `revisión humana`*
- Cada viñeta de este archivo declara un aplicador, y cada `npm run` citado existe en el arnés. *Aplicado por: `npm run sensor:invariantes`*
- `package.json` no define `install`, `preinstall` ni `postinstall`. Esos nombres los dispara npm al instalar y reentrarían en el arnés. *Aplicado por: `npm run sensor:invariantes`*
- La aplicación en EC2 y la cuenta AWS se crean cuando el producto deje de estar pendiente. *Aplicado por: `aún no aplicado`*
