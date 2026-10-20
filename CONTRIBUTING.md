# Contribuir

Dos personas, un repositorio, una rama `main`. El detalle del arnés está en [AGENTS.md](AGENTS.md).

## Reparto

- Cada persona toma una tarea, abre una rama y un pull request.
- La otra persona puede revisar. El merge espera a que `npm run check` pase en GitHub.
- Si las dos necesitan el mismo archivo, entra primero el pull request que ya está verde. La otra rama se actualiza con `main`.

## Ramas y commits

- Rama de la parte A: `feature/catalogo`, `feature/compras`, `feature/kardex`.
- Rama de la parte B: `feature/ventas`, `feature/cartera`, `feature/caja`.
- Commits en imperativo. El mensaje cabe en una frase.
- No se versiona `.env` ni claves de AWS.

## Puerta

Antes de push:

```text
npm run check
```

## Tareas habituales

| Tarea | Dónde mirar |
| --- | --- |
| Revisar un diff | `.agents/skills/revisar-cambio/SKILL.md` |
| Saber si ya hay producto | `docs/product/ALCANCE.md` |
| Ver por qué todavía no hay EC2 | `docs/DECISIONS.md` |
