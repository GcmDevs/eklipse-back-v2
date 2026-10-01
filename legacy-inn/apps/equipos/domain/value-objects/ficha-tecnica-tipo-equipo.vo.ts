import { normalizeUppercaseText } from '@common/domain/value-objects';
import {
  ClasificacionBiomedica,
  DatosCalibracion,
  DatosTecnicos,
  PeriodoDeTiempo,
} from '@equipos/domain/value-objects';

export class FichaTecnicaTipoEquipo {
  private constructor(
    private datosTecnicos: DatosTecnicos,
    private clasificacionBiomedica: ClasificacionBiomedica,
    private vidaUtil: PeriodoDeTiempo | null,
    private reqCalibracion: boolean,
    private datosCalibracion: DatosCalibracion | undefined,
    private dtCalibNormaAplicable: string | undefined
  ) {}

  static create(
    datosTecnicos?: DatosTecnicos,
    clasificacionBiomedica?: ClasificacionBiomedica,
    vidaUtil?: PeriodoDeTiempo,
    reqCalibracion?: boolean,
    dtCalib?: DatosCalibracion,
    dtCalibNormaAplicable?: string
  ): FichaTecnicaTipoEquipo {
    return new FichaTecnicaTipoEquipo(
      datosTecnicos ?? DatosTecnicos.create(),
      clasificacionBiomedica ?? ClasificacionBiomedica.create(),
      vidaUtil ?? null,
      reqCalibracion ?? false,
      dtCalib,
      dtCalibNormaAplicable ? normalizeUppercaseText(dtCalibNormaAplicable) : undefined
    );
  }

  get getDatosTecnicos(): DatosTecnicos {
    return this.datosTecnicos;
  }
  get getClasificacionBiomedica(): ClasificacionBiomedica {
    return this.clasificacionBiomedica;
  }
  get getVidaUtil(): PeriodoDeTiempo | null {
    return this.vidaUtil;
  }
  get getReqCalibracion(): boolean {
    return this.reqCalibracion;
  }
  get getDtCalib(): DatosCalibracion | undefined {
    return this.datosCalibracion;
  }
  get getDtCalibNormaAplicable(): string | undefined {
    return this.dtCalibNormaAplicable;
  }
}
