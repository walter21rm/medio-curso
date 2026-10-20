# AGENTS.md

> Las reglas que no se negocian están en [INVARIANTS.md](INVARIANTS.md). Léelo antes de editar.

## Resumen del repositorio

Este repositorio es el lugar compartido de dos personas. El producto todavía no está definido: el alcance vive en [docs/product/ALCANCE.md](docs/product/ALCANCE.md) y, mientras diga `PRODUCTO: pendiente`, no se agrega código en `src/`.

El arnés son las guías de este archivo, los sensores de `scripts/sensores/` y la puerta `npm run check`. GitHub es el remoto. La rama troncal es `main`.

## Cómo colaboran las dos personas

Cada persona dirige una tarea. Su agente crea la rama, implementa, corre el check, hace push y abre el pull request. Nadie comparte la rama del otro.

1. Actualizar `main`.
2. Escribir la tarea: qué hay que lograr y cómo se sabe que está hecho. Si es grande, el plan va en `docs/exec-plans/active/`.
3. Rama `tipo/asunto-corto`, por ejemplo `docs/alcance-producto`.
4. `npm run check` en cero.
5. Push y pull request hacia `main`.
6. Merge cuando el check de GitHub pasa y la otra persona, si el cambio lo pide, dejó su revisión.

Un acuerdo que solo está en el chat se copia al repositorio en un commit. Si no, el agente de la otra persona no lo ve.

## Autorización del agente

- Puede editar código, pruebas y documentación, y puede ejecutar los objetivos de `npm run help`.
- Puede dar por bueno un cambio solo cuando `npm run check` termina en cero.
- No hace commit, push ni merge salvo que la persona lo pida en el mensaje.
- No modifica [INVARIANTS.md](INVARIANTS.md) ni da por definido el producto sin que las dos personas lo acuerden en `docs/product/ALCANCE.md`.
- No crea recursos en AWS ni escribe claves de acceso en el repositorio.
- Si una regla de este archivo choca con un invariante, manda el invariante.

## Mapa

| Ruta | Para qué |
| --- | --- |
| [INVARIANTS.md](INVARIANTS.md) | Reglas con la forma en que se aplican |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Ramas, commits y pull requests |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Capas, cuando el producto exista |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisiones ya tomadas |
| [docs/product/ALCANCE.md](docs/product/ALCANCE.md) | Qué se va a construir |
| [docs/infra/EC2.md](docs/infra/EC2.md) | Dónde correrá, cuando toque |
| `.agents/skills/revisar-cambio/SKILL.md` | Cómo revisar un diff |

## Comandos

La superficie permitida es `npm run help`. La puerta que debe quedar en verde es:

```text
npm run check
```

`check` corre, en este orden: lint, secretos, invariantes, producto y pruebas. Si un paso falla, la salida de esa herramienta es el diagnóstico.
