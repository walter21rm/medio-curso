# EC2

Mostrador corre en AWS, en una sola instancia EC2. El ciclo de inventario y ventas ya está en `main`. El frontend lo sube la parte A. Después, una sola persona despliega esa instancia.

Hoy no hay instancia, ni grupo de seguridad, ni clave de acceso en el repositorio. El cambio de infraestructura va en su propio pull request e incluye:

- región y tipo de instancia
- cómo se entra a la máquina
- qué comando la deja en el mismo estado que `npm run check` exige en local
- la dirección en la que queda el mostrador
- dónde viven los secretos, fuera de git, con quien despliega

La otra persona revisa ese pull request y usa la misma dirección. No crea una segunda instancia.
