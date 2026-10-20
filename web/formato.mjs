// El dinero viaja en centavos enteros. Aquí solo se muestra y se lee, sin pasar por decimales.

const miles = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });

export function soles(centavos) {
  const negativo = centavos < 0;
  const absoluto = Math.abs(centavos);
  const enteros = Math.trunc(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, "0");
  return `${negativo ? "−" : ""}S/ ${miles.format(enteros)}.${resto}`;
}

export function solesConSigno(centavos) {
  return centavos > 0 ? `+${soles(centavos)}` : soles(centavos);
}

// "12", "12.5", "12,50" → centavos. Devuelve null si no es un monto válido.
export function leerSoles(texto) {
  const coincidencia = /^\s*(\d{1,9})(?:[.,](\d{1,2}))?\s*$/.exec(String(texto));
  if (coincidencia === null) {
    return null;
  }
  const centavos = (coincidencia[2] ?? "").padEnd(2, "0");
  return Number(coincidencia[1]) * 100 + Number(centavos);
}

export function solesParaCampo(centavos) {
  return `${Math.trunc(centavos / 100)}.${String(centavos % 100).padStart(2, "0")}`;
}

const formatoDia = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatoDiaLargo = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const formatoHora = new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" });
const formatoInstante = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function dia(fecha) {
  return formatoDia.format(new Date(`${fecha}T00:00:00Z`));
}

export function diaLargo(fecha) {
  const texto = formatoDiaLargo.format(new Date(`${fecha}T00:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function hora(instante) {
  return formatoHora.format(new Date(instante));
}

export function instante(valor) {
  return formatoInstante.format(new Date(valor));
}

export function sumarDias(fecha, dias) {
  const base = new Date(`${fecha}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

export function diasEntre(desde, hasta) {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

export function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}
