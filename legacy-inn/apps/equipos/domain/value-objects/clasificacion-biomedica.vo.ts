import { BadInputError } from '@common/domain/errors';
import { Riesgo } from '../enums';

export class ClasificacionBiomedica {
  private constructor(
    private readonly aplicaRegSanitario: boolean = false,
    private readonly diagnostico: boolean = false,
    private readonly prevencion: boolean = false,
    private readonly rehabilitacion: boolean = false,
    private readonly analisisLaboratorio: boolean = false,
    private readonly tratamientoMantenimientoDeVida: boolean = false,
    private readonly riesgo: Riesgo = Riesgo.NO_APLICA,
    private readonly numeroRegSanitario?: string,
    private readonly expedienteRegSanitario?: string
  ) {}

  static create(
    aplicaRegSanitario?: boolean,
    diagnostico?: boolean,
    prevencion?: boolean,
    rehabilitacion?: boolean,
    analisisLaboratorio?: boolean,
    tratamientoMantenimientoDeVida?: boolean,
    riesgo?: Riesgo,
    numeroRegSanitario?: string,
    expedienteRegSanitario?: string
  ): ClasificacionBiomedica {
    if (!aplicaRegSanitario && (numeroRegSanitario || expedienteRegSanitario)) {
      throw new BadInputError(
        'No se puede asignar un numero de registro o expediente si el registro sanitario no aplica'
      );
    }

    return new ClasificacionBiomedica(
      aplicaRegSanitario,
      diagnostico ?? false,
      prevencion ?? false,
      rehabilitacion ?? false,
      analisisLaboratorio ?? false,
      tratamientoMantenimientoDeVida ?? false,
      riesgo,
      numeroRegSanitario,
      expedienteRegSanitario
    );
  }

  get getRiesgo(): Riesgo {
    return this.riesgo;
  }

  get getAplicaRegSanitario(): boolean {
    return this.aplicaRegSanitario;
  }

  get getNumeroRegSanitario(): string | undefined {
    return this.numeroRegSanitario;
  }

  get getDiagnostico(): boolean {
    return this.diagnostico;
  }

  get getRehabilitacion(): boolean {
    return this.rehabilitacion;
  }

  get getAnalisisLaboratorio(): boolean {
    return this.analisisLaboratorio;
  }

  get getPrevencion(): boolean {
    return this.prevencion;
  }

  get getExpedienteRegistroSanitario(): string {
    return this.expedienteRegSanitario;
  }

  get getTratamientoMantenimientoDeVida(): boolean {
    return this.tratamientoMantenimientoDeVida;
  }
}
