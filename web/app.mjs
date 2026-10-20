import { api } from "./api.mjs";
import {
  dia,
  diaLargo,
  diasEntre,
  instante,
  hora,
  leerSoles,
  plural,
  soles,
  solesConSigno,
  solesParaCampo,
  sumarDias,
} from "./formato.mjs";

// ---------- HTML seguro ----------

class Html {
  constructor(texto) {
    this.texto = texto;
  }
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function valorHtml(valor) {
  if (valor === null || valor === undefined || valor === false) {
    return "";
  }
  if (valor instanceof Html) {
    return valor.texto;
  }
  if (Array.isArray(valor)) {
    return valor.map(valorHtml).join("");
  }
  return String(valor).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function html(partes, ...valores) {
  let texto = partes[0];
  valores.forEach((valor, i) => {
    texto += valorHtml(valor) + partes[i + 1];
  });
  return new Html(texto);
}

function icono(nombre) {
  return html`<svg aria-hidden="true"><use href="#i-${nombre}"/></svg>`;
}

function pintar(elemento, contenido) {
  elemento.innerHTML = valorHtml(contenido);
}

// ---------- Avisos y confirmación ----------

const avisos = document.getElementById("avisos");

function avisar(texto, tipo = "ok") {
  const aviso = document.createElement("div");
  aviso.className = `mensaje${tipo === "error" ? " error" : ""}`;
  aviso.textContent = texto;
  avisos.append(aviso);
  setTimeout(() => {
    aviso.classList.add("saliendo");
    setTimeout(() => aviso.remove(), 160);
  }, tipo === "error" ? 6000 : 3500);
}

const dialogo = document.getElementById("confirmar");

function confirmar({ titulo, texto, accion, peligro = false }) {
  document.getElementById("confirmar-titulo").textContent = titulo;
  document.getElementById("confirmar-texto").textContent = texto;
  const boton = document.getElementById("confirmar-si");
  boton.textContent = accion;
  boton.className = `boton ${peligro ? "peligro" : "principal"}`;
  dialogo.returnValue = "no";
  dialogo.showModal();
  return new Promise((resolver) => {
    dialogo.addEventListener("close", () => resolver(dialogo.returnValue === "si"), { once: true });
  });
}

// ---------- Ruteo ----------

const vista = document.getElementById("vista");
let turno = 0;

const RUTAS = [
  { patron: /^\/?$/, seccion: "hoy", titulo: "Hoy", vista: vistaHoy },
  { patron: /^\/ventas(?:\/(nueva))?$/, seccion: "ventas", titulo: "Ventas", vista: vistaVentas },
  { patron: /^\/compras(?:\/(nueva))?$/, seccion: "compras", titulo: "Compras", vista: vistaCompras },
  { patron: /^\/productos(?:\/(nuevo))?$/, seccion: "productos", titulo: "Productos", vista: vistaProductos },
  { patron: /^\/productos\/kardex\/([^/]+)$/, seccion: "productos", titulo: "Kardex", vista: vistaKardex },
  { patron: /^\/cartera$/, seccion: "cartera", titulo: "Cartera", vista: vistaCartera },
  { patron: /^\/caja$/, seccion: "caja", titulo: "Caja", vista: vistaCaja },
];

function leerHash() {
  const [ruta, consulta = ""] = location.hash.replace(/^#/, "").split("?");
  return { ruta: ruta || "/", parametros: new URLSearchParams(consulta) };
}

async function mostrar({ enfocar = true } = {}) {
  const miTurno = ++turno;
  const { ruta, parametros } = leerHash();
  const destino = RUTAS.find((r) => r.patron.test(ruta)) ?? RUTAS[0];
  const coincidencia = destino.patron.exec(ruta) ?? [];
  document.title = `${destino.titulo} · Mostrador`;
  for (const enlace of document.querySelectorAll(".nav a")) {
    if (enlace.dataset.ruta === destino.seccion) {
      enlace.setAttribute("aria-current", "page");
    } else {
      enlace.removeAttribute("aria-current");
    }
  }
  try {
    const contexto = { parametros, extra: coincidencia[1], vigente: () => miTurno === turno };
    await destino.vista(contexto);
  } catch (error) {
    if (miTurno !== turno) {
      return;
    }
    pintar(
      vista,
      html`<div class="panel"><h2>No se pudo cargar ${destino.titulo.toLowerCase()}</h2>
        <p class="nota">${error.message}</p>
        <div class="acciones mt-chico"><button class="boton" data-reintentar>Reintentar</button></div></div>`,
    );
    vista.querySelector("[data-reintentar]").addEventListener("click", () => mostrar());
  }
  if (enfocar && miTurno === turno) {
    vista.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function refrescar() {
  return mostrar({ enfocar: false });
}

window.addEventListener("hashchange", () => mostrar());
mostrar({ enfocar: false });

// ---------- Piezas comunes ----------

function encabezado(titulo, bajada, acciones = "") {
  return html`<div class="encabezado">
    <div><h1>${titulo}</h1>${bajada ? html`<p class="bajada">${bajada}</p>` : ""}</div>
    ${acciones ? html`<div class="acciones">${acciones}</div>` : ""}
  </div>`;
}

function mostrarError(formulario, error) {
  const caja = formulario.querySelector(".error-form");
  caja.textContent = error.message;
  caja.scrollIntoView({ block: "nearest" });
}

async function enviando(boton, accion) {
  const texto = boton.textContent;
  boton.disabled = true;
  boton.textContent = "Guardando…";
  try {
    return await accion();
  } finally {
    boton.disabled = false;
    boton.textContent = texto;
  }
}

function existenciaInsignia(existencia) {
  if (existencia === 0) {
    return html`<span class="insignia peligro">Agotado</span>`;
  }
  if (existencia <= 5) {
    return html`<span class="insignia aviso">${existencia}</span>`;
  }
  return html`${existencia}`;
}

// Editor de líneas de venta o compra. Actualiza subtotales sin repintar, así el foco no se pierde.
function editorLineas(contenedor, productos, { conCosto, alCambiar }) {
  const porId = new Map(productos.map((p) => [p.id, p]));
  const lineas = [nuevaLinea()];

  function nuevaLinea() {
    return { productoId: "", cantidad: "1", costo: "" };
  }

  function opciones(seleccionado) {
    return html`<option value="">Elige un producto</option>${productos.map(
      (p) => html`<option value="${p.id}" ${p.id === seleccionado ? html`selected` : ""}>${p.nombre} · ${
        conCosto ? `${p.existencia} en stock` : `${soles(p.precio)} · ${p.existencia} en stock`
      }</option>`,
    )}`;
  }

  function precioDe(linea) {
    const producto = porId.get(linea.productoId);
    if (producto === undefined) {
      return null;
    }
    return conCosto ? leerSoles(linea.costo) : producto.precio;
  }

  function subtotal(linea) {
    const precio = precioDe(linea);
    const cantidad = Number(linea.cantidad);
    if (precio === null || !Number.isInteger(cantidad) || cantidad < 1) {
      return null;
    }
    return precio * cantidad;
  }

  function pintarLineas() {
    pintar(
      contenedor,
      lineas.map(
        (linea, i) => html`<div class="linea${conCosto ? "" : " sin-costo"}" data-i="${i}">
          <label class="campo campo-producto"><span>Producto</span>
            <select data-campo="productoId" required>${opciones(linea.productoId)}</select></label>
          <label class="campo"><span>Cantidad</span>
            <input data-campo="cantidad" class="num" type="number" min="1" step="1" inputmode="numeric" value="${linea.cantidad}" required></label>
          ${conCosto
            ? html`<label class="campo"><span>Costo unitario (S/)</span>
                <input data-campo="costo" class="num" inputmode="decimal" placeholder="0.00" value="${linea.costo}" required></label>`
            : ""}
          <div class="campo campo-subtotal"><span>Subtotal</span><div class="subtotal" data-subtotal>—</div></div>
          <button type="button" class="boton solo-icono" data-quitar aria-label="Quitar línea ${i + 1}" ${lineas.length === 1 ? html`disabled` : ""}>${icono("quitar")}</button>
        </div>`,
      ),
    );
    actualizar();
  }

  function actualizar() {
    let total = 0;
    let completo = true;
    contenedor.querySelectorAll(".linea").forEach((fila, i) => {
      const valor = subtotal(lineas[i]);
      fila.querySelector("[data-subtotal]").textContent = valor === null ? "—" : soles(valor);
      if (valor === null) {
        completo = false;
      } else {
        total += valor;
      }
    });
    alCambiar(total, completo);
  }

  contenedor.addEventListener("input", (evento) => {
    const fila = evento.target.closest(".linea");
    const campo = evento.target.dataset.campo;
    if (fila === null || campo === undefined) {
      return;
    }
    const linea = lineas[Number(fila.dataset.i)];
    linea[campo] = evento.target.value;
    if (campo === "productoId" && conCosto) {
      const producto = porId.get(linea.productoId);
      if (producto !== undefined) {
        linea.costo = solesParaCampo(producto.costoPromedio);
        fila.querySelector('[data-campo="costo"]').value = linea.costo;
      }
    }
    actualizar();
  });

  contenedor.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-quitar]");
    if (boton === null) {
      return;
    }
    lineas.splice(Number(boton.closest(".linea").dataset.i), 1);
    pintarLineas();
  });

  pintarLineas();

  return {
    agregar() {
      lineas.push(nuevaLinea());
      pintarLineas();
      contenedor.querySelector(".linea:last-child select").focus();
    },
    leer() {
      return lineas.map((linea) => ({
        productoId: linea.productoId,
        cantidad: Number(linea.cantidad),
        costoUnitario: conCosto ? leerSoles(linea.costo) : undefined,
      }));
    },
  };
}

// ---------- Hoy ----------

async function vistaHoy({ vigente }) {
  const r = await api.resumen();
  if (!vigente()) {
    return;
  }
  const caja = r.caja;
  pintar(
    vista,
    html`${encabezado(
      "Hoy",
      diaLargo(r.fecha),
      html`<a class="boton principal" href="#/ventas/nueva">${icono("mas")}Nueva venta</a>
        <a class="boton" href="#/compras/nueva">Nueva compra</a>`,
    )}
    <div class="rejilla">
      <section class="panel" aria-labelledby="t-caja">
        <div class="panel-cabeza"><h2 id="t-caja">Caja de hoy</h2><a href="#/caja">Ver caja</a></div>
        <dl class="cifras">
          <dt>Ventas al contado</dt><dd>${soles(caja.ventasContado)}</dd>
          <dt>Abonos cobrados</dt><dd>${soles(caja.abonos)}</dd>
          <dt>Anulaciones</dt><dd>${caja.reversos === 0 ? soles(0) : soles(-caja.reversos)}</dd>
          <dt class="total">Esperado en caja</dt><dd class="total">${soles(caja.esperado)}</dd>
        </dl>
        <p class="nota">${
          caja.cierre
            ? html`Caja cerrada. Diferencia ${diferenciaTexto(caja.cierre.diferencia)}.`
            : html`${plural(r.ventasDelDia, "venta registrada", "ventas registradas")} hoy. La caja sigue abierta.`
        }</p>
      </section>

      <section class="panel sin-relleno" aria-labelledby="t-cobrar">
        <div class="panel-cabeza"><h2 id="t-cobrar">Por cobrar</h2><a href="#/cartera">Ver cartera</a></div>
        <div class="relleno-cifra">
          <p class="cifra-grande">${soles(r.porCobrar)}</p>
          <p class="nota">${plural(r.cuentasAbiertas, "cuenta abierta", "cuentas abiertas")}${
            r.vencidas.length ? html` · <span class="negativo">${plural(r.vencidas.length, "vencida", "vencidas")}</span>` : ""
          }</p>
        </div>
        ${
          r.vencidas.length
            ? html`<div class="tabla-caja"><table>
                <thead><tr><th>Cliente</th><th>Venció</th><th class="num">Saldo</th></tr></thead>
                <tbody>${r.vencidas.map(
                  (c) => html`<tr><td>${c.cliente}</td><td>${dia(c.vencimiento)}</td><td class="num">${soles(c.saldo)}</td></tr>`,
                )}</tbody></table></div>`
            : html`<p class="vacio con-linea">Ninguna cuenta vencida.</p>`
        }
      </section>
    </div>

    <section class="panel sin-relleno mt" aria-labelledby="t-stock">
      <div class="panel-cabeza"><h2 id="t-stock">Stock bajo</h2><a href="#/compras">${
        r.comprasPorRecibir ? plural(r.comprasPorRecibir, "compra por recibir", "compras por recibir") : "Ver compras"
      }</a></div>
      ${
        r.stockBajo.length
          ? html`<div class="tabla-caja"><table>
              <thead><tr><th>Producto</th><th class="num">Existencia</th><th class="num opcional">Precio</th><th></th></tr></thead>
              <tbody>${r.stockBajo.map(
                (p) => html`<tr><td>${p.nombre}</td><td class="num">${existenciaInsignia(p.existencia)}</td>
                  <td class="num opcional">${soles(p.precio)}</td>
                  <td class="accion"><a href="#/productos/kardex/${encodeURIComponent(p.id)}">Kardex</a></td></tr>`,
              )}</tbody></table></div>`
          : html`<p class="vacio">Todos los productos tienen más de 5 unidades.</p>`
      }
    </section>`,
  );
}

function diferenciaTexto(diferencia) {
  if (diferencia === 0) {
    return html`<span class="positivo">cuadra</span>`;
  }
  return diferencia > 0
    ? html`<span class="positivo">sobran ${soles(diferencia)}</span>`
    : html`<span class="negativo">faltan ${soles(-diferencia)}</span>`;
}

// ---------- Ventas ----------

async function vistaVentas({ extra, vigente }) {
  const [productos, ventas, caja] = await Promise.all([api.productos(), api.ventas(), api.caja()]);
  if (!vigente()) {
    return;
  }
  const abierto = extra === "nueva";
  const clientes = [...new Set(ventas.map((v) => v.cliente))].sort();

  pintar(
    vista,
    html`${encabezado(
      "Ventas",
      "Contado entra a caja; crédito abre una cuenta por cobrar.",
      abierto ? "" : html`<a class="boton principal" href="#/ventas/nueva">${icono("mas")}Nueva venta</a>`,
    )}
    ${abierto ? html`<section class="panel" aria-labelledby="t-nueva">
      <h2 id="t-nueva">Nueva venta</h2>
      <form class="formulario" novalidate>
        <div class="campos">
          <div class="campo"><span>Tipo</span>
            <div class="segmentado" role="radiogroup" aria-label="Tipo de venta">
              <label><input type="radio" name="tipo" value="contado" checked><span>Contado</span></label>
              <label><input type="radio" name="tipo" value="credito"><span>Crédito</span></label>
            </div></div>
          <label class="campo"><span>Cliente</span>
            <input name="cliente" list="clientes" autocomplete="off" placeholder="Nombre del cliente" required></label>
          <label class="campo" data-vencimiento hidden><span>Vence el</span>
            <input name="vencimiento" type="date" value="${sumarDias(caja.hoy, 30)}" min="${caja.hoy}"></label>
        </div>
        <datalist id="clientes">${clientes.map((c) => html`<option value="${c}"></option>`)}</datalist>
        <div class="lineas" data-lineas></div>
        <div class="pie-lineas">
          <button type="button" class="boton" data-agregar>${icono("mas")}Agregar producto</button>
          <p class="total-lineas"><span>Total</span><output data-total>${soles(0)}</output></p>
        </div>
        <p class="error-form" role="alert"></p>
        <div class="acciones acciones-fin">
          <a class="boton" href="#/ventas">Cancelar</a>
          <button class="boton principal" type="submit" data-enviar>Registrar venta</button>
        </div>
      </form></section>` : ""}

    <section class="panel sin-relleno" aria-labelledby="t-ventas">
      <div class="panel-cabeza"><h2 id="t-ventas">Registro de ventas</h2></div>
      ${
        ventas.length
          ? html`<div class="tabla-caja"><table>
            <thead><tr><th class="opcional">Venta</th><th class="opcional">Fecha</th><th>Cliente</th><th>Tipo</th><th class="num">Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>${ventas.map(
              (v) => html`<tr>
                <td class="codigo opcional">${v.id}</td>
                <td class="opcional">${instante(v.ocurridoEn)}</td>
                <td>${v.cliente}</td>
                <td>${v.tipo === "credito" ? html`Crédito <span class="secundario opcional">· vence ${dia(v.vencimiento)}</span>` : "Contado"}</td>
                <td class="num">${soles(v.total)}</td>
                <td>${v.estado === "anulada" ? html`<span class="insignia peligro">Anulada</span>` : html`<span class="insignia ok">Confirmada</span>`}</td>
                <td class="accion">${
                  v.estado === "confirmada" ? html`<button class="boton chico" data-anular="${v.id}">Anular</button>` : ""
                }</td></tr>`,
            )}</tbody></table></div>`
          : html`<div class="vacio"><strong>Aún no hay ventas.</strong>Registra la primera con «Nueva venta».</div>`
      }
    </section>`,
  );

  vista.querySelectorAll("[data-anular]").forEach((boton) =>
    boton.addEventListener("click", async () => {
      const venta = ventas.find((v) => v.id === boton.dataset.anular);
      const efecto =
        venta.tipo === "credito"
          ? "Devuelve el stock y cancela la deuda del cliente."
          : `Devuelve el stock y descuenta ${soles(venta.total)} de la caja de hoy.`;
      const ok = await confirmar({ titulo: `¿Anular ${venta.id}?`, texto: efecto, accion: "Anular venta", peligro: true });
      if (!ok) {
        return;
      }
      try {
        await api.anularVenta(venta.id);
        avisar(`Venta ${venta.id} anulada.`);
        await refrescar();
      } catch (error) {
        avisar(error.message, "error");
      }
    }),
  );

  if (!abierto) {
    return;
  }
  const formulario = vista.querySelector("form");
  const enviar = formulario.querySelector("[data-enviar]");
  const totalSalida = formulario.querySelector("[data-total]");
  const campoVence = formulario.querySelector("[data-vencimiento]");
  const editor = editorLineas(formulario.querySelector("[data-lineas]"), productos, {
    conCosto: false,
    alCambiar: (total) => {
      totalSalida.textContent = soles(total);
    },
  });
  formulario.querySelector("[data-agregar]").addEventListener("click", () => editor.agregar());
  formulario.addEventListener("change", (evento) => {
    if (evento.target.name === "tipo") {
      campoVence.hidden = evento.target.value !== "credito";
    }
  });
  formulario.cliente.focus();

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    const tipo = datos.get("tipo");
    const lineas = editor.leer().map(({ productoId, cantidad }) => ({ productoId, cantidad }));
    if (lineas.some((l) => l.productoId === "")) {
      mostrarError(formulario, new Error("Elige un producto en cada línea, o quita la línea vacía."));
      return;
    }
    try {
      const venta = await enviando(enviar, () =>
        api.crearVenta({
          tipo,
          cliente: String(datos.get("cliente")),
          lineas,
          ...(tipo === "credito" ? { vencimiento: String(datos.get("vencimiento")) } : {}),
        }),
      );
      avisar(`Venta ${venta.id} registrada · ${soles(venta.total)}${venta.tipo === "credito" ? " a crédito" : ""}.`);
      await refrescar();
    } catch (error) {
      mostrarError(formulario, error);
    }
  });
}

// ---------- Compras ----------

async function vistaCompras({ extra, vigente }) {
  const [productos, compras] = await Promise.all([api.productos(), api.compras()]);
  if (!vigente()) {
    return;
  }
  const abierto = extra === "nueva";
  const nombres = new Map(productos.map((p) => [p.id, p.nombre]));
  const proveedores = [...new Set(compras.map((c) => c.proveedor))].sort();

  pintar(
    vista,
    html`${encabezado(
      "Compras",
      "Una compra nace en borrador. Solo al recibirla sube el stock y se recalcula el costo promedio.",
      abierto ? "" : html`<a class="boton principal" href="#/compras/nueva">${icono("mas")}Nueva compra</a>`,
    )}
    ${abierto ? html`<section class="panel" aria-labelledby="t-nueva">
      <h2 id="t-nueva">Nueva compra</h2>
      <form class="formulario" novalidate>
        <div class="campos">
          <label class="campo"><span>Proveedor</span>
            <input name="proveedor" list="proveedores" autocomplete="off" placeholder="Nombre del proveedor" required></label>
        </div>
        <datalist id="proveedores">${proveedores.map((p) => html`<option value="${p}"></option>`)}</datalist>
        <div class="lineas" data-lineas></div>
        <div class="pie-lineas">
          <button type="button" class="boton" data-agregar>${icono("mas")}Agregar producto</button>
          <p class="total-lineas"><span>Costo total</span><output data-total>${soles(0)}</output></p>
        </div>
        <p class="error-form" role="alert"></p>
        <div class="acciones acciones-fin">
          <a class="boton" href="#/compras">Cancelar</a>
          <button class="boton principal" type="submit" data-enviar>Guardar borrador</button>
        </div>
      </form></section>` : ""}

    <section class="panel sin-relleno" aria-labelledby="t-compras">
      <div class="panel-cabeza"><h2 id="t-compras">Registro de compras</h2></div>
      ${
        compras.length
          ? html`<div class="tabla-caja"><table>
            <thead><tr><th class="opcional">Compra</th><th>Proveedor</th><th class="opcional">Detalle</th><th class="num">Costo</th><th>Estado</th><th class="opcional">Recibida</th><th></th></tr></thead>
            <tbody>${compras.map((c) => {
              const unidades = c.lineas.reduce((t, l) => t + l.cantidad, 0);
              const costo = c.lineas.reduce((t, l) => t + l.cantidad * l.costoUnitario, 0);
              const detalle = c.lineas.map((l) => `${l.cantidad} × ${nombres.get(l.productoId) ?? l.productoId}`).join(", ");
              return html`<tr>
                <td class="codigo opcional">${c.id}</td>
                <td>${c.proveedor}</td>
                <td class="opcional" title="${detalle}">${plural(c.lineas.length, "producto", "productos")} · ${plural(unidades, "unidad", "unidades")}</td>
                <td class="num">${soles(costo)}</td>
                <td>${c.estado === "recibida" ? html`<span class="insignia ok">Recibida</span>` : html`<span class="insignia aviso">Borrador</span>`}</td>
                <td class="opcional">${c.recibidaEn ? instante(c.recibidaEn) : html`<span class="secundario">—</span>`}</td>
                <td class="accion">${c.estado === "borrador" ? html`<button class="boton principal chico" data-recibir="${c.id}">Recibir</button>` : ""}</td>
              </tr>`;
            })}</tbody></table></div>`
          : html`<div class="vacio"><strong>Aún no hay compras.</strong>Registra una con «Nueva compra» y recíbela cuando llegue la mercadería.</div>`
      }
    </section>`,
  );

  vista.querySelectorAll("[data-recibir]").forEach((boton) =>
    boton.addEventListener("click", async () => {
      const compra = compras.find((c) => c.id === boton.dataset.recibir);
      const ok = await confirmar({
        titulo: `¿Recibir ${compra.id}?`,
        texto: `Sube el stock de ${plural(compra.lineas.length, "producto", "productos")} y recalcula su costo promedio. Una compra recibida no se vuelve a recibir.`,
        accion: "Recibir compra",
      });
      if (!ok) {
        return;
      }
      try {
        await api.recibirCompra(compra.id);
        avisar(`Compra ${compra.id} recibida. Stock y costos actualizados.`);
        await refrescar();
      } catch (error) {
        avisar(error.message, "error");
      }
    }),
  );

  if (!abierto) {
    return;
  }
  const formulario = vista.querySelector("form");
  const enviar = formulario.querySelector("[data-enviar]");
  const totalSalida = formulario.querySelector("[data-total]");
  const editor = editorLineas(formulario.querySelector("[data-lineas]"), productos, {
    conCosto: true,
    alCambiar: (total) => {
      totalSalida.textContent = soles(total);
    },
  });
  formulario.querySelector("[data-agregar]").addEventListener("click", () => editor.agregar());
  formulario.proveedor.focus();

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const lineas = editor.leer();
    if (lineas.some((l) => l.productoId === "")) {
      mostrarError(formulario, new Error("Elige un producto en cada línea, o quita la línea vacía."));
      return;
    }
    if (lineas.some((l) => l.costoUnitario === null)) {
      mostrarError(formulario, new Error("Escribe el costo unitario en soles, por ejemplo 12.50."));
      return;
    }
    try {
      const compra = await enviando(enviar, () =>
        api.crearCompra({ proveedor: formulario.proveedor.value, lineas }),
      );
      avisar(`Compra ${compra.id} guardada como borrador. Recíbela cuando llegue la mercadería.`);
      location.hash = "#/compras";
    } catch (error) {
      mostrarError(formulario, error);
    }
  });
}

// ---------- Productos ----------

async function vistaProductos({ extra, parametros, vigente }) {
  const productos = await api.productos();
  if (!vigente()) {
    return;
  }
  const abierto = extra === "nuevo";
  const filtro = parametros.get("q") ?? "";

  pintar(
    vista,
    html`${encabezado(
      "Productos",
      `${plural(productos.length, "producto", "productos")} en el almacén.`,
      abierto ? "" : html`<a class="boton principal" href="#/productos/nuevo">${icono("mas")}Nuevo producto</a>`,
    )}
    ${abierto ? html`<section class="panel" aria-labelledby="t-nuevo">
      <h2 id="t-nuevo">Nuevo producto</h2>
      <form class="formulario" novalidate>
        <div class="campos">
          <label class="campo ancho-2"><span>Nombre</span>
            <input name="nombre" maxlength="120" placeholder="Ej. Arroz extra 5 kg" required></label>
          <label class="campo"><span>Código</span>
            <input name="codigo" maxlength="64" pattern="[A-Za-z0-9-]+" autocomplete="off" placeholder="Automático">
            <small>Letras, números y guiones.</small></label>
        </div>
        <div class="campos">
          <label class="campo"><span>Existencia inicial</span>
            <input name="existencia" class="num" type="number" min="0" step="1" inputmode="numeric" value="0" required></label>
          <label class="campo"><span>Costo promedio (S/)</span>
            <input name="costo" class="num" inputmode="decimal" placeholder="0.00" required></label>
          <label class="campo"><span>Precio de venta (S/)</span>
            <input name="precio" class="num" inputmode="decimal" placeholder="0.00" required></label>
        </div>
        <p class="error-form" role="alert"></p>
        <div class="acciones acciones-fin">
          <a class="boton" href="#/productos">Cancelar</a>
          <button class="boton principal" type="submit" data-enviar>Dar de alta</button>
        </div>
      </form></section>` : ""}

    <section class="panel sin-relleno" aria-labelledby="t-catalogo">
      <div class="panel-cabeza"><h2 id="t-catalogo">Catálogo</h2></div>
      <div class="filtros relleno-x">
        <label class="visualmente-oculto" for="buscar">Buscar producto</label>
        <input id="buscar" type="search" placeholder="Buscar por nombre o código" value="${filtro}">
      </div>
      <div class="tabla-caja" data-tabla></div>
    </section>`,
  );

  const tabla = vista.querySelector("[data-tabla]");
  const buscar = vista.querySelector("#buscar");
  const pintarTabla = () => {
    const q = buscar.value.trim().toLowerCase();
    const visibles = productos.filter((p) => !q || p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    pintar(
      tabla,
      visibles.length
        ? html`<table>
          <thead><tr><th class="opcional">Código</th><th>Producto</th><th class="num">Existencia</th><th class="num opcional">Costo prom.</th><th class="num">Precio</th><th class="num opcional">Margen</th><th></th></tr></thead>
          <tbody>${visibles.map(
            (p) => html`<tr>
              <td class="codigo opcional">${p.id}</td>
              <td><a href="#/productos/kardex/${encodeURIComponent(p.id)}">${p.nombre}</a></td>
              <td class="num">${existenciaInsignia(p.existencia)}</td>
              <td class="num opcional">${soles(p.costoPromedio)}</td>
              <td class="num">${soles(p.precio)}</td>
              <td class="num opcional">${margen(p)}</td>
              <td class="accion"><a href="#/productos/kardex/${encodeURIComponent(p.id)}">Kardex</a></td>
            </tr>`,
          )}</tbody></table>`
        : html`<div class="vacio">${
            productos.length ? html`<strong>Nada coincide con «${buscar.value}».</strong>Prueba con otra palabra o con el código.` : html`<strong>El catálogo está vacío.</strong>Da de alta el primer producto.`
          }</div>`,
    );
  };
  buscar.addEventListener("input", pintarTabla);
  pintarTabla();

  if (!abierto) {
    return;
  }
  const formulario = vista.querySelector("form");
  const enviar = formulario.querySelector("[data-enviar]");
  formulario.nombre.focus();
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const costo = leerSoles(formulario.costo.value);
    const precio = leerSoles(formulario.precio.value);
    if (costo === null || precio === null) {
      mostrarError(formulario, new Error("Escribe costo y precio en soles, por ejemplo 12.50."));
      return;
    }
    try {
      const producto = await enviando(enviar, () =>
        api.crearProducto({
          id: formulario.codigo.value,
          nombre: formulario.nombre.value,
          existencia: Number(formulario.existencia.value),
          costoPromedio: costo,
          precio,
        }),
      );
      avisar(`${producto.nombre} dado de alta con el código ${producto.id}.`);
      location.hash = "#/productos";
    } catch (error) {
      mostrarError(formulario, error);
    }
  });
}

function margen(producto) {
  if (producto.precio === 0) {
    return "—";
  }
  const porcentaje = Math.round(((producto.precio - producto.costoPromedio) * 100) / producto.precio);
  return html`<span class="${porcentaje < 0 ? "negativo" : ""}">${porcentaje} %</span>`;
}

// ---------- Kardex ----------

async function vistaKardex({ extra, vigente }) {
  const id = decodeURIComponent(extra);
  const { producto, movimientos } = await api.kardex(id);
  if (!vigente()) {
    return;
  }
  const neto = movimientos.reduce((t, m) => t + (m.direccion === "entrada" ? m.cantidad : -m.cantidad), 0);
  let saldo = producto.existencia - neto;
  const filas = movimientos.map((m) => {
    saldo += m.direccion === "entrada" ? m.cantidad : -m.cantidad;
    return { ...m, saldo };
  });
  const origen = (m) =>
    m.origen === "compra"
      ? html`Compra <span class="codigo">${m.origenId}</span>`
      : m.origen === "venta"
        ? html`Venta <span class="codigo">${m.origenId}</span>`
        : html`Anulación de <span class="codigo">${m.origenId}</span>`;

  pintar(
    vista,
    html`<a class="volver" href="#/productos">${icono("atras")}Productos</a>
    ${encabezado(producto.nombre, html`Kardex · código <span class="codigo">${producto.id}</span>`)}
    <div class="rejilla mb">
      <section class="panel" aria-label="Situación actual">
        <dl class="cifras">
          <dt>Existencia</dt><dd>${plural(producto.existencia, "unidad", "unidades")}</dd>
          <dt>Costo promedio</dt><dd>${soles(producto.costoPromedio)}</dd>
          <dt>Precio de venta</dt><dd>${soles(producto.precio)}</dd>
          <dt class="total">Valor del stock</dt><dd class="total">${soles(producto.existencia * producto.costoPromedio)}</dd>
        </dl>
      </section>
    </div>
    <section class="panel sin-relleno" aria-labelledby="t-mov">
      <div class="panel-cabeza"><h2 id="t-mov">Movimientos</h2></div>
      ${
        filas.length
          ? html`<div class="tabla-caja"><table>
            <thead><tr><th>Fecha</th><th>Origen</th><th class="num">Entrada</th><th class="num">Salida</th><th class="num">Saldo</th></tr></thead>
            <tbody>${filas.map(
              (m) => html`<tr>
                <td>${instante(m.ocurridoEn)}</td>
                <td>${origen(m)}</td>
                <td class="num positivo">${m.direccion === "entrada" ? `+${m.cantidad}` : ""}</td>
                <td class="num negativo">${m.direccion === "salida" ? `−${m.cantidad}` : ""}</td>
                <td class="num">${m.saldo}</td></tr>`,
            )}</tbody></table></div>
            <p class="nota nota-pie">Saldo inicial antes del primer movimiento: ${producto.existencia - neto}.</p>`
          : html`<div class="vacio"><strong>Sin movimientos todavía.</strong>Las compras recibidas, las ventas y las anulaciones aparecen aquí.</div>`
      }
    </section>`,
  );
}

// ---------- Cartera ----------

async function vistaCartera({ parametros, vigente }) {
  const [cuentas, abonos, resumen] = await Promise.all([api.cuentas(), api.abonos(), api.resumen()]);
  if (!vigente()) {
    return;
  }
  const hoy = resumen.fecha;
  const vencidas = new Set(resumen.vencidas.map((c) => c.id));
  const filtro = parametros.get("ver") ?? "abiertas";
  const visibles = cuentas.filter((c) =>
    filtro === "vencidas" ? vencidas.has(c.id) : filtro === "todas" ? true : c.estado === "abierta",
  );
  const totalVencido = resumen.vencidas.reduce((t, c) => t + c.saldo, 0);

  const plazo = (c) => {
    if (c.estado !== "abierta") {
      return html`${dia(c.vencimiento)}`;
    }
    const dias = diasEntre(hoy, c.vencimiento);
    if (vencidas.has(c.id)) {
      return html`${dia(c.vencimiento)} <span class="insignia peligro">vencida hace ${plural(-dias, "día", "días")}</span>`;
    }
    if (dias === 0) {
      return html`${dia(c.vencimiento)} <span class="insignia aviso">vence hoy</span>`;
    }
    return html`${dia(c.vencimiento)} <span class="secundario">en ${plural(dias, "día", "días")}</span>`;
  };
  const estado = (c) =>
    c.estado === "pagada"
      ? html`<span class="insignia ok">Pagada</span>`
      : c.estado === "cancelada"
        ? html`<span class="insignia">Cancelada</span>`
        : html`<span class="insignia acento">Abierta</span>`;

  pintar(
    vista,
    html`${encabezado("Cartera", "Cuentas por cobrar de las ventas a crédito.")}
    <div class="rejilla mb">
      <section class="panel" aria-label="Totales">
        <dl class="cifras">
          <dt>Por cobrar</dt><dd>${soles(resumen.porCobrar)}</dd>
          <dt>Vencido</dt><dd class="${totalVencido ? "negativo" : ""}">${soles(totalVencido)}</dd>
          <dt class="total">Cuentas abiertas</dt><dd class="total">${resumen.cuentasAbiertas}</dd>
        </dl>
      </section>
    </div>
    <section class="panel sin-relleno" aria-labelledby="t-cuentas">
      <div class="panel-cabeza"><h2 id="t-cuentas">Cuentas</h2></div>
      <div class="filtros relleno-x">
        <div class="segmentado" role="radiogroup" aria-label="Mostrar">
          ${[
            ["abiertas", "Abiertas"],
            ["vencidas", `Vencidas (${vencidas.size})`],
            ["todas", "Todas"],
          ].map(
            ([valor, texto]) => html`<label><input type="radio" name="ver" value="${valor}" ${filtro === valor ? html`checked` : ""}><span>${texto}</span></label>`,
          )}
        </div>
      </div>
      ${
        visibles.length
          ? html`<div class="tabla-caja"><table>
            <thead><tr><th>Cliente</th><th class="opcional">Venta</th><th>Vence</th><th class="num opcional">Monto</th><th class="num">Saldo</th><th class="opcional">Estado</th><th></th></tr></thead>
            <tbody>${visibles.map(
              (c) => html`<tr data-cuenta="${c.id}">
                <td>${c.cliente}</td>
                <td class="codigo opcional">${c.ventaId}</td>
                <td>${plazo(c)}</td>
                <td class="num opcional">${soles(c.monto)}</td>
                <td class="num">${soles(c.saldo)}</td>
                <td class="opcional">${estado(c)}</td>
                <td class="accion">${c.estado === "abierta" ? html`<button class="boton chico" data-abonar="${c.id}">Abonar</button>` : ""}</td>
              </tr>`,
            )}</tbody></table></div>`
          : html`<div class="vacio">${
              filtro === "vencidas"
                ? html`<strong>Ninguna cuenta vencida.</strong>Una cuenta aparece aquí desde el día siguiente a su vencimiento.`
                : html`<strong>No hay cuentas ${filtro === "todas" ? "" : "abiertas"}.</strong>Las ventas a crédito abren una cuenta por cobrar.`
            }</div>`
      }
    </section>
    <section class="panel sin-relleno mt" aria-labelledby="t-abonos">
      <div class="panel-cabeza"><h2 id="t-abonos">Últimos abonos</h2></div>
      ${
        abonos.length
          ? html`<div class="tabla-caja"><table>
            <thead><tr><th>Fecha</th><th>Cliente</th><th class="opcional">Cuenta</th><th class="num">Monto</th></tr></thead>
            <tbody>${abonos.slice(0, 8).map((a) => {
              const cuenta = cuentas.find((c) => c.id === a.cuentaId);
              return html`<tr><td>${instante(a.ocurridoEn)}</td><td>${cuenta?.cliente ?? ""}</td><td class="codigo opcional">${a.cuentaId}</td><td class="num">${soles(a.monto)}</td></tr>`;
            })}</tbody></table></div>`
          : html`<p class="vacio">Todavía no hay abonos.</p>`
      }
    </section>`,
  );

  vista.querySelectorAll('input[name="ver"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      location.hash = radio.value === "abiertas" ? "#/cartera" : `#/cartera?ver=${radio.value}`;
    }),
  );

  vista.querySelectorAll("[data-abonar]").forEach((boton) =>
    boton.addEventListener("click", () => {
      vista.querySelector("tr.fila-abono")?.remove();
      vista.querySelector("tr.fila-abierta")?.classList.remove("fila-abierta");
      const cuenta = cuentas.find((c) => c.id === boton.dataset.abonar);
      const fila = boton.closest("tr");
      fila.classList.add("fila-abierta");
      const formularioFila = document.createElement("tr");
      formularioFila.className = "fila-abono fila-abierta";
      pintar(
        formularioFila,
        html`<td colspan="7"><form class="formulario" novalidate>
          <div class="campos alinear-fin">
            <label class="campo"><span>Abono de ${cuenta.cliente} (S/)</span>
              <input name="monto" class="num" inputmode="decimal" value="${solesParaCampo(cuenta.saldo)}" required>
              <small>Saldo: ${soles(cuenta.saldo)}</small></label>
            <div class="acciones">
              <button type="button" class="boton" data-cerrar>Cancelar</button>
              <button class="boton principal" type="submit" data-enviar>Registrar abono</button>
            </div>
          </div>
          <p class="error-form" role="alert"></p>
        </form></td>`,
      );
      fila.after(formularioFila);
      const formulario = formularioFila.querySelector("form");
      formulario.monto.select();
      formulario.querySelector("[data-cerrar]").addEventListener("click", () => {
        formularioFila.remove();
        fila.classList.remove("fila-abierta");
        boton.focus();
      });
      formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const monto = leerSoles(formulario.monto.value);
        if (monto === null || monto === 0) {
          mostrarError(formulario, new Error("Escribe un monto mayor que cero, por ejemplo 50.00."));
          return;
        }
        try {
          await enviando(formulario.querySelector("[data-enviar]"), () => api.abonar({ cuentaId: cuenta.id, monto }));
          const saldo = cuenta.saldo - monto;
          avisar(
            saldo === 0
              ? `Abono de ${soles(monto)} registrado. ${cuenta.cliente} quedó al día.`
              : `Abono de ${soles(monto)} registrado. Saldo: ${soles(saldo)}.`,
          );
          await refrescar();
        } catch (error) {
          mostrarError(formulario, error);
        }
      });
    }),
  );
}

// ---------- Caja ----------

async function vistaCaja({ parametros, vigente }) {
  const caja = await api.caja(parametros.get("fecha") ?? undefined);
  if (!vigente()) {
    return;
  }
  const esHoy = caja.fecha === caja.hoy;
  const futuro = caja.fecha > caja.hoy;
  const tipos = { venta_contado: "Venta al contado", abono: "Abono", reverso_venta: "Anulación" };

  pintar(
    vista,
    html`${encabezado(
      "Caja",
      esHoy ? html`${diaLargo(caja.fecha)} · hoy` : diaLargo(caja.fecha),
      html`<label class="campo"><span class="visualmente-oculto">Día</span>
        <input type="date" data-fecha value="${caja.fecha}" max="${caja.hoy}"></label>`,
    )}
    <div class="rejilla">
      <section class="panel" aria-labelledby="t-esperado">
        <h2 id="t-esperado">Esperado en caja</h2>
        <dl class="cifras">
          <dt>Ventas al contado</dt><dd>${soles(caja.ventasContado)}</dd>
          <dt>Abonos cobrados</dt><dd>${soles(caja.abonos)}</dd>
          <dt>Anulaciones</dt><dd>${caja.reversos === 0 ? soles(0) : soles(-caja.reversos)}</dd>
          <dt class="total">Esperado</dt><dd class="total">${soles(caja.esperado)}</dd>
        </dl>
      </section>
      <section class="panel" aria-labelledby="t-cierre">
        <h2 id="t-cierre">Cierre del día</h2>
        ${
          caja.cierre
            ? html`<dl class="cifras">
                <dt>Efectivo contado</dt><dd>${soles(caja.cierre.efectivoContado)}</dd>
                <dt>Esperado</dt><dd>${soles(caja.cierre.esperado)}</dd>
                <dt class="total">Diferencia</dt><dd class="total ${caja.cierre.diferencia < 0 ? "negativo" : "positivo"}">${solesConSigno(caja.cierre.diferencia)}</dd>
              </dl>
              <p class="nota">Día cerrado: ${diferenciaTexto(caja.cierre.diferencia)}. Ya no entran ventas, anulaciones ni abonos con esta fecha.</p>`
            : futuro
              ? html`<p class="nota">Todavía no llega este día.</p>`
              : html`<form class="formulario" novalidate>
                  <label class="campo"><span>Efectivo contado (S/)</span>
                    <input name="efectivo" class="num" inputmode="decimal" placeholder="0.00" required></label>
                  <p class="nota" data-vista-previa>Cuenta el efectivo y escríbelo para ver la diferencia.</p>
                  <p class="error-form" role="alert"></p>
                  <div class="acciones acciones-fin"><button class="boton principal" type="submit" data-enviar>Cerrar caja</button></div>
                </form>`
        }
      </section>
    </div>
    <section class="panel sin-relleno mt" aria-labelledby="t-movcaja">
      <div class="panel-cabeza"><h2 id="t-movcaja">Movimientos del día</h2></div>
      ${
        caja.movimientos.length
          ? html`<div class="tabla-caja"><table>
            <thead><tr><th>Hora</th><th>Movimiento</th><th class="opcional">Origen</th><th class="num">Monto</th></tr></thead>
            <tbody>${caja.movimientos.map((m) => {
              const monto = m.tipo === "reverso_venta" ? -m.monto : m.monto;
              return html`<tr><td>${hora(m.ocurridoEn)}</td><td>${tipos[m.tipo]}</td>
                <td class="codigo opcional">${m.origenId}</td>
                <td class="num ${monto < 0 ? "negativo" : ""}">${solesConSigno(monto)}</td></tr>`;
            })}</tbody></table></div>`
          : html`<div class="vacio"><strong>Sin movimientos este día.</strong>Las ventas al contado y los abonos entran aquí.</div>`
      }
    </section>`,
  );

  vista.querySelector("[data-fecha]").addEventListener("change", (evento) => {
    const fecha = evento.target.value;
    if (fecha) {
      location.hash = fecha === caja.hoy ? "#/caja" : `#/caja?fecha=${fecha}`;
    }
  });

  const formulario = vista.querySelector("form");
  if (formulario === null) {
    return;
  }
  const previa = formulario.querySelector("[data-vista-previa]");
  formulario.efectivo.addEventListener("input", () => {
    const contado = leerSoles(formulario.efectivo.value);
    pintar(
      previa,
      contado === null
        ? "Cuenta el efectivo y escríbelo para ver la diferencia."
        : html`Diferencia: ${diferenciaTexto(contado - caja.esperado)}.`,
    );
  });
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const contado = leerSoles(formulario.efectivo.value);
    if (contado === null) {
      mostrarError(formulario, new Error("Escribe el efectivo contado en soles, por ejemplo 250.00."));
      return;
    }
    const ok = await confirmar({
      titulo: `¿Cerrar la caja del ${dia(caja.fecha)}?`,
      texto: "El cierre queda registrado con su diferencia. Después no entran ventas, anulaciones ni abonos de este día.",
      accion: "Cerrar caja",
    });
    if (!ok) {
      return;
    }
    try {
      const cierre = await enviando(formulario.querySelector("[data-enviar]"), () =>
        api.cerrarCaja({ fecha: caja.fecha, efectivoContado: contado }),
      );
      avisar(
        cierre.diferencia === 0
          ? "Caja cerrada. Cuadra exacto."
          : `Caja cerrada con diferencia de ${solesConSigno(cierre.diferencia)}.`,
      );
      await refrescar();
    } catch (error) {
      mostrarError(formulario, error);
    }
  });
}
