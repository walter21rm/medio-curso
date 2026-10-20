# EC2

La aplicación de este repositorio va a correr en AWS, en una instancia EC2.

Hoy no hay instancia, ni grupo de seguridad, ni clave de acceso en el repositorio. Eso se crea cuando `docs/product/ALCANCE.md` deje de decir `PRODUCTO: pendiente` y exista un artefacto que desplegar.

Cuando llegue ese momento, el cambio de infraestructura queda en su propio pull request e incluye:

- región y tipo de instancia
- cómo se entra a la máquina
- qué comando la deja en el mismo estado que `npm run check` exige en local
- dónde viven los secretos, fuera de git
