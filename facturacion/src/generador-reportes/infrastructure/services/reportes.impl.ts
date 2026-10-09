import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services/base.source';
import { ConsultaReportesResponse } from '../../presentation/dtos/busqueda.dto';
import { INGRESOS_REPORTES_SQL, PACIENTE_REPORTES_SQL } from '../queries/consulta';
import {
  FilaIngresoReportes,
  FilaPacienteReportes,
  ingresoReportesFactory,
  pacienteReportesFactory,
} from '../factories/consulta.factory';

@Injectable()
export class GeneradorReportesImpl extends BaseSource {
  public async consultar(documento: unknown): Promise<ConsultaReportesResponse> {
    if (typeof documento !== 'string' || !/^\d{1,20}$/.test(documento.trim())) {
      throw new BadRequestException('La cédula debe contener entre 1 y 20 dígitos.');
    }
    const pacientes = await this.consultarFilas<FilaPacienteReportes>(PACIENTE_REPORTES_SQL, [
      documento.trim(),
    ]);
    if (!pacientes.length) return { paciente: null, ingresos: [] };
    if (pacientes.length > 1) {
      throw new ConflictException(
        'Hay varios pacientes con esta cédula. Revisa su identificación antes de consultar los ingresos.'
      );
    }
    const paciente = pacientes[0];
    const ingresos = await this.consultarFilas<FilaIngresoReportes>(INGRESOS_REPORTES_SQL, [
      paciente.OID,
    ]);
    return {
      paciente: pacienteReportesFactory(paciente),
      ingresos: ingresos.map(ingresoReportesFactory),
    };
  }

  private async consultarFilas<T>(sql: string, parametros: (string | number)[]): Promise<T[]> {
    try {
      return await this.conn.query(sql, parametros);
    } catch {
      throw new ServiceUnavailableException(
        'No fue posible consultar el paciente y sus ingresos. Intenta nuevamente.'
      );
    }
  }
}
