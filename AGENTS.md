# AGENTS.md

> Las reglas que no se negocian están en [INVARIANTS.md](INVARIANTS.md). Léelo antes de editar.

## Resumen

Mostrador es el mini ERP de una comercializadora con un solo almacén. Dos personas comparten este repositorio. La parte A (compañera) cierra inventario. La parte B cierra ventas, cartera y caja. El ciclo, los estados y los formatos están en [docs/sdd](docs/sdd/README.md).

El dinero son centavos enteros. La existencia no baja de cero. `npm run check` es la puerta antes de cada pull request.

## Reparto

- Parte A: `feature/catalogo`, `feature/compras`, `feature/kardex`. Spec en [docs/sdd/parte-a-inventario.md](docs/sdd/parte-a-inventario.md).
- Parte B: `feature/ventas`, `feature/cartera`, `feature/caja`. Spec en [docs/sdd/parte-b-ventas.md](docs/sdd/parte-b-ventas.md).
- El esqueleto compartido se revisa entre las dos. Inventario se mergea antes de apoyar ventas en ese `main`.

## Autorización del agente

- Puede editar código, pruebas y documentación, y puede ejecutar `npm run help`.
- Puede dar por bueno un cambio solo cuando `npm run check` termina en cero.
- No hace commit, push ni merge salvo que la persona lo pida en el mensaje.
- No modifica [INVARIANTS.md](INVARIANTS.md) ni la parte de la otra persona para adelantar la propia.
- No crea recursos en AWS ni escribe claves en el repositorio.
- Si una regla de este archivo choca con un invariante, manda el invariante.

## Mapa

| Ruta | Para qué |
| --- | --- |
| `src/domain` | Producto, inventario, formatos y la existencia que no queda negativa |
| `src/catalogo` | Alta de producto (parte A) |
| `src/compras` | Compra en borrador, recepción y costo promedio (parte A) |
| `src/kardex` | Movimientos de stock por producto (parte A) |
| `src/ventas` | Contado, crédito y anulación |
| `src/cartera` | Abono y cobranza vencida |
| `src/caja` | Cierre del día |
| `src/mostrador.ts` | Fachada que usan las pruebas |

## Comandos

```text
npm run check
```

`check` corre lint, tipos, secretos, invariantes, la marca de producto, dinero y pruebas. Si un paso falla, la salida de esa herramienta es el diagnóstico.
