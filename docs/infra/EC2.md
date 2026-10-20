# EC2

Mostrador está en una sola instancia. La otra persona usa esta dirección y no crea otra.

| | |
| --- | --- |
| Dirección | http://15.228.243.126 |
| Región | `sa-east-1` (São Paulo) |
| Instancia | `i-0afdec2735297025e` |
| Tipo | `t3.micro` |
| Sistema | Amazon Linux 2023 (`ami-02ff524dbc0f828f5`) |
| Red | VPC por defecto `vpc-03035a44d6af80033`, grupo `sg-0a3af1ec4ad6e2bc5` |
| Puertos | 80 y 443. El botón «Abrir dirección» del panel entra por https |
| Entrada a la máquina | Session Manager. No hay puerto 22 ni clave SSH en el repositorio |

El botón «Abrir dirección» del panel usa `https://`. La instancia responde en ese puerto con el certificado que ella misma genera. La primera vez el navegador pide continuar, porque ese certificado no es de una autoridad pública. `http://15.228.243.126` sigue abriendo directo.

La IP pública cambia si la instancia se detiene y se vuelve a encender. No hay claves de AWS en el repositorio. El rol de la instancia es `mostrador-ec2` y solo permite Session Manager.
