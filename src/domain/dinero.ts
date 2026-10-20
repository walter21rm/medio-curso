import { ReglaNegocio } from "./errores.ts";

export class Dinero {
  readonly centavos: number;

  private constructor(centavos: number) {
    this.centavos = centavos;
  }

  static desdeCentavos(centavos: number): Dinero {
    if (!Number.isInteger(centavos) || centavos < 0) {
      throw new ReglaNegocio("dinero-invalido", "El monto es un entero de centavos, cero o mayor.");
    }
    return new Dinero(centavos);
  }

  static positivo(centavos: number): Dinero {
    const dinero = Dinero.desdeCentavos(centavos);
    if (dinero.centavos === 0) {
      throw new ReglaNegocio("dinero-invalido", "El monto es un entero de centavos mayor que cero.");
    }
    return dinero;
  }
}
