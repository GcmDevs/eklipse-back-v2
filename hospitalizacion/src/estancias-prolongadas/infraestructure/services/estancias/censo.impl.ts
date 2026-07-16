import { BaseSource } from '@common/infrastructure/services';
import { mapGestorEstanciaProlongadasRows } from '@hpn/estancias-prolongadas/application/mappers';
import { Injectable } from '@nestjs/common';
import { CensoEstanciaProlongadaOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class CensoEstanciasProlongadasImpl extends BaseSource {
  public async fetchCenso() {
    try {
      const censoRp = this.conn.getRepository(CensoEstanciaProlongadaOrm);
      const grupoAgrupadoCase = `CASE
        WHEN censo.grupoNuevo = 'CIRUGIA' THEN 'CIRUGIA'
        WHEN censo.grupoNuevo IN ('HOSPITALIZACION', 'UNIDAD HEMATO ONCOLOGICA') THEN 'HOSPITALIZACION'
        WHEN censo.grupoNuevo LIKE 'UCI%' THEN 'UCI'
        WHEN censo.grupoNuevo IN ('OBSERVACION URGENCIAS', 'TEMPORAL REMITIDOS') THEN 'URGENCIAS'
        ELSE 'OTROS'
      END`;

      const result = await censoRp
        .createQueryBuilder('censo')
        .select([
          'censo.ingreso AS ingreso',
          'censo.sede AS sede',
          'censo.grupoNuevo AS grupoNuevo',
          `${grupoAgrupadoCase} AS grupoAgrupado`,
          'censo.hsunombre AS piso',
          'censo.gasnombre AS gas',
          'censo.fecha AS fecha',
          'censo.tipoIngreso AS tipoIngreso',
          'censo.identificacion AS identificacion',
          'censo.nombrePaciente AS nombrePaciente',
          'censo.cama AS cama',
          'censo.edad AS edad',
          'censo.sexo AS sexo',
          'censo.dias AS dias',
          'censo.especialidad AS especialidad',
          'censo.planBeneficio AS planBeneficio',
          'censo.entidad AS entidad',
          'censo.municipio AS municipio',
          'censo.hgrnombre AS hgrNombre',
          'censo.tipoRegimen AS tipoRegimen',
          'censo.dx_diagnostico_1 AS diagnostico',
        ])
        .where('censo.sede LIKE :sede', { sede: '%caribe' })
        .andWhere('censo.grupoNuevo <> :grupoExcluido', { grupoExcluido: 'HOSPICASA' })
        .orderBy(grupoAgrupadoCase, 'ASC')
        .addOrderBy('censo.grupoNuevo', 'ASC')
        .addOrderBy('censo.cama', 'ASC')
        .getRawMany();

      return mapGestorEstanciaProlongadasRows(result);
    } catch (error: any) {
      throw new Error(`Error fetching censo: ${error.message}`);
    }
  }
}
