import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { GCM_CONTEXTS, GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { SRDCentroOrm } from '@inn/orm/shared-bd';
import { PacienteHospitalizadoI, pacientesHospitalizadosQuery } from '../../infrastructure/queries';
import { SuministroPacienteRecibidoOrm } from '@inn/orm/inn/documentos';
import { In, IsNull } from 'typeorm';

@ApiTags('Recursos')
@Controller('v1/inn/suministros-paciente/recursos')
export class RecursosController {
  @Get('pacientes-hospitalizados/:contextCode')
  async fetchPacientesHospitalizados(@Param('contextCode') contextCode: GcmContextCode) {
    try {
      const ctx = gcmContextFactory(contextCode);
      const conn = switchConn(ctx);
      const results: PacienteHospitalizadoI[] = await conn.query(pacientesHospitalizadosQuery());

      const sumPacRecRp = conn.manager.getRepository(SuministroPacienteRecibidoOrm);

      const ingresosIds = results.map(r => r.ingresoId);

      const suministrosRecibidos = await sumPacRecRp.find({
        where: { ingresoId: In(ingresosIds), usuarioRecibeId: IsNull() },
      });

      results.map(r => {
        if (suministrosRecibidos.some(s => s.ingresoId === r.ingresoId)) {
          r.tieneSuministrosPorEntregar = true;
        } else r.tieneSuministrosPorEntregar = false;
      });

      return results;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('centros/:contextCode')
  async fetchCenters(@Param('contextCode') contextCode: GcmContextCode) {
    try {
      const conn = switchConn(GCM_CONTEXTS.EKLIPSE);
      const centerRp = conn.getRepository(SRDCentroOrm);
      const centers = await centerRp.find();

      if (contextCode) return centers.filter(c => c.contextCode === contextCode);

      return centers;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
