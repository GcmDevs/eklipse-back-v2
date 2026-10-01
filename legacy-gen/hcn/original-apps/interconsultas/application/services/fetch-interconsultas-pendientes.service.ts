import { InterConsultaPendienteDto } from '../data-transfers';

export abstract class FetchInterconsultasPendientesService {
  public abstract all(especialidades?: number[]): Promise<InterConsultaPendienteDto[]>;
  public abstract porEspecialidadUsuarioAutenticado(): Promise<InterConsultaPendienteDto[]>;
}
