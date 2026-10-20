# Decisiones

## ADR-001 Un repositorio para las dos personas

El trabajo compartido vive en este repositorio público. Cada persona clona `main`, trabaja en su rama y entra por pull request. Una nota que solo está en el chat no cuenta como decisión.

## ADR-002 El producto se escribe cuando exista

No se copia el libro de caja ni ningún otro proyecto anterior. `docs/product/ALCANCE.md` marca `PRODUCTO: pendiente` y el sensor `sensor:producto` impide agregar `src/` antes de tiempo.

## ADR-003 AWS con EC2, todavía sin recursos

La aplicación correrá en una instancia EC2. No se crea la cuenta, la instancia ni un grupo de seguridad en este cambio: faltan el producto y el artefacto que habría que desplegar. Las claves de acceso no entran al repositorio.

## ADR-004 La puerta es npm run check

El arnés comprueba sintaxis, secretos, invariantes, la marca de producto y las pruebas de esos sensores. GitHub corre el mismo comando en cada push y en cada pull request.
