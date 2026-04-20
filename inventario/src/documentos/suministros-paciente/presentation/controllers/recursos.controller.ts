import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { GCM_CONTEXTS, GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { SRDCentroOrm } from '@inn/orm/shared-bd';

@ApiTags('Recursos')
@Controller('v1/inn/suministros-paciente/recursos')
export class RecursosController {
  @Get('pacientes-hospitalizados/:contextCode')
  async fetchPacientesHospitalizados(@Param('contextCode') contextCode: GcmContextCode) {
    try {
      const ctx = gcmContextFactory(contextCode);
      const conn = switchConn(ctx);
      const query = `SELECT P.OID pacienteId, I.AINCONSEC consecutivoIngreso,
      P.GPANOMCOM nombreCompletoPaciente, P.PACNUMDOC cedulaPaciente, C.HCACODIGO codigoCama,
      SG.HSUCODIGO codigoSubgrupo, SG.HSUNOMBRE nombreSubgrupo, I.ADNCENATE centroId
      FROM HPNESTANC E INNER JOIN ADNINGRESO I ON E.ADNINGRES = I.OID
      INNER JOIN GENPACIEN P ON I.GENPACIEN = P.OID
      INNER JOIN HPNDEFCAM C ON I.HPNDEFCAM = C.OID
      INNER JOIN HPNSUBGRU SG ON C.HPNSUBGRU = SG.OID
      WHERE E.HESFECSAL IS NULL AND E.ADNINGRES IS NOT NULL
      AND (C.HCAESTADO < 3) AND I.AINURGCON <> 1`;
      return await conn.query(query);
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
