import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GCM_CONTEXTS_VALUES } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services/connections';
import { ConsultaReportes } from '../../domain/consulta';
import { INGRESOS_REPORTES_SQL, PACIENTE_REPORTES_SQL } from '../queries/consulta';
import {
  FilaIngresoReportes,
  FilaPacienteReportes,
  ingresoReportesFactory,
  pacienteReportesFactory,
} from '../factories/consulta.factory';
import type { PropietarioReportes } from './ejecuciones.impl';

// El despachador vive entre solicitudes y reinicios: su consulta clínica no puede
// heredar BaseSource ni REQUEST, que convertirían la cola en un proveedor por petición.
@Injectable()
export class ConsultaColaReportesImpl {
  async consultar(documento: string, propietario: PropietarioReportes): Promise<ConsultaReportes> {
    if (typeof documento !== 'string' || !/^\d{1,20}$/.test(documento.trim()))
      throw new BadRequestException('La cédula debe contener entre 1 y 20 dígitos.');
    const contexto = GCM_CONTEXTS_VALUES.find(ctx => ctx.getCode() === propietario.contexto);
    if (!contexto) throw new BadRequestException('La sede de la solicitud no es válida.');
    const conexion = switchConn(contexto);
    const consultar = async <T>(sql: string, parametros: Array<string | number>): Promise<T[]> => {
      try {
        return await conexion.query(sql, parametros);
      } catch {
        throw new ServiceUnavailableException(
          'No fue posible validar el ingreso antes de iniciar su turno.'
        );
      }
    };
    const pacientes = await consultar<FilaPacienteReportes>(PACIENTE_REPORTES_SQL, [
      documento.trim(),
    ]);
    if (!pacientes.length) return { paciente: null, ingresos: [] };
    if (pacientes.length > 1)
      throw new ConflictException(
        'Hay varios pacientes con esta cédula. Revisa su identificación antes de generar reportes.'
      );
    const filas = await consultar<FilaIngresoReportes>(INGRESOS_REPORTES_SQL, [pacientes[0].OID]);
    return {
      paciente: pacienteReportesFactory(pacientes[0]),
      ingresos: filas.map(ingresoReportesFactory),
    };
  }
}
