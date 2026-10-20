export class ReglaNegocio extends Error {
  readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
    this.name = "ReglaNegocio";
  }
}
