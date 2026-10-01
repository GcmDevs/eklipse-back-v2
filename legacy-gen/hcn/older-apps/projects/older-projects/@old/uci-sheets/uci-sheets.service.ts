import { Injectable } from '@nestjs/common';
import { UciSheetsRepository } from './repository';
import { organizarLiquidos } from './services/liquidos';
import { DefaultResponse } from '@hcn/old/common/application/models';
import { orderBy } from 'lodash';
import { addOrdenByName } from './repository/add-orden-by-nombre';
import { FetchReporteSabanasUciServices } from '@hcn/rft/historia-clinica/reportes/infrastructure/services';

@Injectable()
export class UciSheetsService {
  constructor(
    private readonly repository: UciSheetsRepository,
    private _reportesServices: FetchReporteSabanasUciServices
  ) {}

  async getUciSheets(adnIngreso: string, fecha: Date) {
    try {
      //Liquidos
      const liq = await this.repository.liquidos(adnIngreso, fecha);
      const liquidos = organizarLiquidos(liq);
      //Glucometria
      const glucometria = await this.repository.glucometria(adnIngreso, fecha);
      //Signos Vitales
      const sV = await this.repository.signosVitales(adnIngreso, fecha);
      const signosVitales = sV.reduce((h: any, obj: any) => {
        h[obj.SIGNO] = (h[obj.SIGNO] || []).concat(obj);
        return h;
      }, {});
      delete signosVitales.null;
      const signos = [];
      for (const signo in signosVitales) {
        const signosa = { signo, resultados: signosVitales[signo] };
        signos.push(signosa);
      }

      const newSignos = signos.filter(_ => _.signo !== 'TENSION ARTERIAL MEDIA');
      let newSignosOrdered: any;

      if (signos.filter(_ => _.signo === 'TENSION ARTERIAL').length) {
        const obj = {
          signo: 'TENSION ARTERIAL MEDIA',
          resultados: [],
        };

        signos
          .filter(_ => _.signo === 'TENSION ARTERIAL')[0]
          .resultados.map(_f => {
            const sistolica = _f.VALOR.split('/')[0];
            const diastolica = parseInt(_f.VALOR.split('/')[1]);
            const result = (sistolica - diastolica) / 3;

            obj.resultados.push({
              hora: _f.hora,
              oid: _f.oid,
              HORAREG: _f.HORAREG,
              SIGNO: _f.signo,
              VALOR: Math.round(diastolica + result),
              CATEGORIA: _f.CATEGORIA,
              SUBGRUPO: _f.SUBGRUPO,
              FECHA_REGISTRO_ENF: _f.FECHA_REGISTRO_ENF,
              ORDEN: 2,
            });
          });

        newSignos.push(obj);
      }

      newSignos.map(_ => {
        _.orden = addOrdenByName(_.signo);
      });

      newSignosOrdered = orderBy(newSignos, 'orden', 'asc');

      const infoIngreso = await this.repository.infoIngreso(adnIngreso, fecha);

      const balanceLiquidos = (
        await this._reportesServices.fetchByConsecutivo(+adnIngreso, [], fecha, [])
      ).estadisticas;

      const data = {
        infoIngreso,
        liquidos,
        signos: newSignosOrdered,
        glucometria,
        balanceLiquidos,
      };
      return {
        success: true,
        message: 'Sabanas UCI',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'sin datos para Sabanas UCI',
      };
    }
  }

  async getUciSheet(ingreso: string, fechaInicio: Date, fechaFinal: Date) {
    try {
      const data = [];
      const fechas = [];
      while (fechaInicio <= fechaFinal) {
        const mili = 24 * 60 * 60 * 1000;
        const manana = new Date(fechaInicio.getTime() + mili);
        fechas.push(fechaInicio);
        fechaInicio = manana;
      }
      for (let i = 0; i < fechas.length; i++) {
        const datos = await this.getUciSheets(ingreso, fechas[i]);
        data.push(datos.data);
      }
      if (data.length > 0) {
        return {
          success: true,
          message: 'Datos Para Generar Sabanas de Radicacion',
          data,
        };
      } else {
        return {
          success: false,
          message: 'No Hay Informacion Para Generar La Sabana',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No Hay Informacion Para Generar La Sabana',
      };
    }
  }

  async getHpnestancia(adnIngreso: string): Promise<DefaultResponse> {
    try {
      const data = await this.repository.getHpnestancia(adnIngreso);
      if (!data) {
        return {
          success: false,
          message: 'No hay Estancias',
        };
      } else {
        return {
          success: true,
          message: 'Estancia Paciente',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No hay Estancias',
      };
    }
  }

  async PacientesSinPeso(): Promise<DefaultResponse> {
    try {
      const data = await this.repository.pacientesSinPeso();
      if (!data) {
        return {
          success: false,
          message: 'No hay Pacientes',
        };
      } else {
        return {
          success: true,
          message: 'Lista de Pacientes',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No hay Pacientes',
      };
    }
  }
}
