import { createServer } from "node:http";
import { crearApp } from "./app.ts";

// PORT y MOSTRADOR_SEMILLA vienen del entorno, así se configura igual en local y en EC2.
const puerto = Number(process.env.PORT ?? 3000);
const semilla = process.env.MOSTRADOR_SEMILLA !== "0";

const servidor = createServer(crearApp({ semilla }));
servidor.listen(puerto, () => {
  process.stdout.write(`Mostrador en http://localhost:${puerto}\n`);
});
