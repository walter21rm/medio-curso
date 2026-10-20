# Arquitectura

Todavía no hay aplicación. Este documento se llena en el mismo cambio que define el producto en [product/ALCANCE.md](product/ALCANCE.md).

Hasta entonces el sistema es el arnés:

```mermaid
flowchart LR
  personaA[Persona A]
  personaB[Persona B]
  agentes[Agentes]
  repo[Repositorio main]
  check[npm run check]
  personaA --> agentes
  personaB --> agentes
  agentes --> repo
  repo --> check
```

Cada persona habla con su agente. Los agentes leen el mismo repositorio. `npm run check` es la puerta antes del pull request.
