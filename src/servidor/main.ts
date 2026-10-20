import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as crearServidorTls } from "node:https";
import { crearApp } from "./app.ts";

// PORT y MOSTRADOR_SEMILLA vienen del entorno, así se configura igual en local y en EC2.
// El panel de EC2 abre la dirección pública con https. Si hay certificado, también se escucha ese puerto.
const puerto = Number(process.env.PORT ?? 3000);
const puertoTls = Number(process.env.TLS_PORT ?? 443);
const semilla = process.env.MOSTRADOR_SEMILLA !== "0";
const certificado = process.env.TLS_CERT ?? "/etc/mostrador/cert.pem";
const clave = process.env.TLS_KEY ?? "/etc/mostrador/key.pem";

const app = crearApp({ semilla });
const servidor = createServer(app);
servidor.listen(puerto, () => {
  process.stdout.write(`Mostrador en http://localhost:${puerto}\n`);
});

if (existsSync(certificado) && existsSync(clave)) {
  const seguro = crearServidorTls(
    { cert: readFileSync(certificado), key: readFileSync(clave) },
    app,
  );
  seguro.listen(puertoTls, () => {
    process.stdout.write(`Mostrador en https://localhost:${puertoTls}\n`);
  });
}
