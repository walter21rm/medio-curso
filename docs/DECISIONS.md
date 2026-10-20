# Decisiones

## ADR-001 Un repositorio para las dos personas

El trabajo compartido vive en este repositorio público. Cada persona trabaja en su rama y entra por pull request. Una nota que solo está en el chat no cuenta como decisión.

## ADR-002 Centavos enteros

Los montos se guardan en centavos. Diez soles son `1000`. En `src/` no hay literales decimales. El costo promedio de la parte A se redondea half-up al centavo, como dice `docs/sdd/parte-a-inventario.md`.

## ADR-003 Anular al contado revierte la caja

El brief pide devolver el stock y, si la venta era a crédito, cancelar la deuda. Para que el cierre no siga contando un cobro anulado, la anulación al contado también deja un movimiento `reverso_venta` en la fecha de la anulación.

## ADR-004 El día de caja es UTC

El día es el prefijo `YYYY-MM-DD` del instante ISO-8601 UTC. Hay un cierre por fecha. Con el día cerrado no entran ventas, anulaciones ni abonos de esa fecha.

## ADR-005 Una sola instancia EC2

Mostrador corre en la instancia `i-0afdec2735297025e` de `sa-east-1`. Una sola persona la creó y la actualiza. La otra usa la dirección de `docs/infra/EC2.md` y no crea una segunda instancia. Las claves de acceso no entran al repositorio.
