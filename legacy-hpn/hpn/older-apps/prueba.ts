import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { HpnIngresoOrm, HpnPacienteOrm } from './orm';
import { In } from 'typeorm';
import { orderBy } from 'lodash';
import { GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';

@ApiTags('V1/V2/V3')
@Controller('v1/prueba')
export class PruebaController {
  constructor() {}

  @Get('')
  public async examples() {
    try {
      const cn = switchConn(GCM_CONTEXTS.ALTACENTRO);

      const ids: { ingresoId: number; pacienteId: number }[] =
        await cn.query(`select I.OID ingresoId, I.GENPACIEN pacienteId from HPNESTANC E
      INNER JOIN  ADNINGRESO I on I.OID = E.ADNINGRES
      INNER JOIN  HPNDEFCAM C on C.OID = E.HPNDEFCAM
      where E.HESFECSAL is null AND C.HCAESTADO < 3 and I.GENPACIEN in(104412)`);

      const ingresoRp = cn.getRepository(HpnIngresoOrm);
      const pacienteRp = cn.getRepository(HpnPacienteOrm);

      const ingresos = await ingresoRp.find({
        where: { id: In(ids.map(r => r.ingresoId)) },
        relations: [
          'egreso',
          'diagnostico',
          'detalleContrato',
          'detalleContrato.municipio',
          'estancias',
          /*'estancias.usuario',
          'estancias.cama',
          'estancias.cama.centro',
          'estancias.cama.grupo',
          'estancias.cama.subgrupo', */
        ],
      });

      const pacientes = await pacienteRp.find({
        order: { id: 'desc' },
        where: { id: In(ids.map(r => r.pacienteId)) },
        relations: ['direccion', 'telefono', 'estrato'],
      });

      pacientes.map(paciente => {
        const ingresoActual = ingresos.filter(ing => ing.pacienteId === paciente.id)[0];

        ingresoActual.setTypes(true);
        /* ingresoActual.estancias.map(es => {
          es.cama.setTypes(true);
          es.setTypes(true);
        }); */

        if (ingresoActual.estancias) {
          ingresoActual.estanciaActual = orderBy(ingresoActual.estancias, 'id', 'desc')[0];
        }

        delete ingresoActual.detalleContrato.contratoId;

        paciente.ingresoActual = ingresoActual;

        paciente.justNombreCompleto();

        paciente.setTypes(true);
        delete paciente.estratoId;
        delete paciente.paisId;
        delete paciente.direccionId;
        delete paciente.telefonoId;
      });

      return pacientes;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
