import { DetalleOfertaI } from './../data-transfers/index';
import { orderBy, uniqBy } from 'lodash';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DietasBaseSource } from '../sources';
import { ScheduleOrm } from '../models/diets';
import { OfertaI } from '../data-transfers';
import {
  DietaI,
  PacienteAcostadoI,
  dietasPedidasArgumentQuery,
  fetchPacientesAcostados,
  pacientesAcostadosFactory,
  refactorizeDietaCodeToConfig,
} from '../queries';
import { getDateToString } from '@common/application/services';
import { DieJornadaOrm, DieSubgrupoOrm, SubgrupoOrm } from '../models/local';

@Injectable()
export class FetchPacientesBySubgrupoImpl extends DietasBaseSource {
  public async execute(centroId: number, horarioId: number, subgrupoCode: string, fecha: Date) {
    const fechaFt = getDateToString(fecha);

    const centro = await this.fetchCentro(centroId);
    const horario = (await this.fetchHorarios(centroId, horarioId)) as ScheduleOrm;
    const ofertas = await this.fetchOfertas(centro.id, horario.id, true);

    const ofertasOrdered = this.orderOfertas(ofertas);

    let pacientesAcostados = await this._fetchPacientesAcostados(
      centro.id,
      subgrupoCode,
      ofertasOrdered
    );

    pacientesAcostados = uniqBy(pacientesAcostados, 'camaId');

    const dieJornadaRp = this.conn.getRepository(DieJornadaOrm);
    const dieSubgrupoRp = this.conn.getRepository(DieSubgrupoOrm);
    const subgrupoRp = this.conn.getRepository(SubgrupoOrm);

    let dieJornada: DieJornadaOrm;
    let dieSubgrupo: DieSubgrupoOrm;

    const subgrupo = await subgrupoRp.findOne({ where: { codigo: subgrupoCode } });

    if (!subgrupo) throw new BadRequestException('Este subgrupo no existe');

    dieJornada = await dieJornadaRp.findOne({ where: { fecha: fechaFt, horarioId } });

    if (dieJornada) {
      dieSubgrupo = await dieSubgrupoRp.findOne({
        where: { dieJornadaId: dieJornada.id, subGrupoId: subgrupo.id },
        relations: ['dietas'],
      });
    }

    const dietas = dieSubgrupo ? dieSubgrupo.dietas : [];
    const dietasAnteriorJornada = dieJornada ? true : false;

    const dieSolicitada = dietas.length && dietasAnteriorJornada ? true : false;

    let dietasAnteriores: DietaI[];
    if (!dieSubgrupo) {
      dietasAnteriores = await this.conn.query(
        `SELECT TOP(${pacientesAcostados.length}) ${dietasPedidasArgumentQuery()}
        WHERE SG.HSUCODIGO = @1 AND C.ADNCENATE = @0 ORDER BY D.OID DESC`,
        [centroId, subgrupoCode]
      );
    }

    if (dietas.length) {
      pacientesAcostados.map(p => {
        const dieta = dietas.filter(d => d.pacienteId == p.paciente.id);
        if (dieta.length) {
          let usarDieDoctor = false;

          if (p.folio.fecha) {
            const fechaFolio = new Date(p.folio.fecha).getTime();
            const fechaJornada = new Date(dieJornada.fecha).getTime();
            usarDieDoctor = fechaFolio > fechaJornada;
          }

          p.dieta.id = dieta[0].id;
          p.dieta.enAislamiento = dieta[0].enAislamiento;
          p.dieta.ultimaObservacion = null;
          p.dieta.observacion = dieta[0].observacion;

          if (!usarDieDoctor || dieSolicitada) {
            const dieConfig = refactorizeDietaCodeToConfig(
              ofertasOrdered,
              dieta[0].combinacionCode
            );
            p.dieta.tipos = dieConfig.tipos;
            p.dieta.consistencias = dieConfig.consistencias;
            p.dieta.extraordinarias = dieConfig.extraordinarias;
          }
        }
      });
    } else {
      if (dietasAnteriores && dietasAnteriores.length) {
        pacientesAcostados.map(p => {
          const dieta = dietasAnteriores.filter(d => d.pacienteId == p.paciente.id);
          if (dieta.length) {
            let usarDieDoctor = false;

            if (p.folio.fecha) {
              const fechaFolio = new Date(p.folio.fecha).getTime();
              const fechaJornada = new Date(dieta[0].fecha).getTime();
              usarDieDoctor = fechaFolio > fechaJornada;
            }

            p.dieta.id = dieta[0].id;
            p.dieta.enAislamiento = dieta[0].enAislamiento;
            p.dieta.ultimaObservacion = null;
            p.dieta.observacion = dieta[0].observacion;

            if (!usarDieDoctor || dieSolicitada) {
              const dieConfig = refactorizeDietaCodeToConfig(ofertasOrdered, dieta[0].config);
              p.dieta.tipos = dieConfig.tipos;
              p.dieta.consistencias = dieConfig.consistencias;
              p.dieta.extraordinarias = dieConfig.extraordinarias;
            }
          }
        });
      }
    }

    return {
      dieSolicitada,
      dieCentroId: dieJornada && dieSubgrupo ? dieJornada.dieCentroId : null,
      dieJornadaId: dieJornada && dieSubgrupo ? dieJornada.id : null,
      dieSubgrupoId: dieJornada && dieSubgrupo ? dieSubgrupo.id : null,
      pacientes: pacientesAcostados,
    };
  }

  private async _fetchPacientesAcostados(
    centroId: number,
    subgrupoCode: string,
    ofertasOrdered: OfertaI[]
  ): Promise<PacienteAcostadoI[]> {
    const pacientesRes = await this.conn.query(
      fetchPacientesAcostados(this.auth.context, centroId, subgrupoCode)
    );

    const pacientes = orderBy(pacientesRes, 'HCACODIGO', 'asc').map(p =>
      pacientesAcostadosFactory(ofertasOrdered, p)
    );

    return pacientes;
  }
}
