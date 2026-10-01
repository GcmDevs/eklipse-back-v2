import { Injectable } from '@nestjs/common';
import { UciSheetsExternoRepository } from './repository';
import { organizarLiquidos } from './services/liquidos';
import { DefaultResponse } from '@hcn/old/common/application/models';
import { orderBy } from 'lodash';
import { addOrdenByName } from './repository/add-orden-by-nombre';
import { FetchReporteSabanasUciExternoServices } from '@hcn/rft/historia-clinica/reportes/infrastructure/services';
import { DataSource } from 'typeorm';
import { GcmContextCode } from '@common/domain/types';

@Injectable()
export class UciSheetsExternoService {
  constructor(
    private readonly repository: UciSheetsExternoRepository,
    private _reportesServices: FetchReporteSabanasUciExternoServices
  ) {}

  async getUciSheets(adnIngreso: string, fecha: Date, conn: DataSource, context: GcmContextCode) {
    try {
      //Liquidos
      const liq = await this.repository.liquidos(adnIngreso, fecha, conn);
      const liquidos = organizarLiquidos(liq);
      //Glucometria
      const glucometria = await this.repository.glucometria(adnIngreso, fecha, conn);
      //Signos Vitales
      const sV = await this.repository.signosVitales(adnIngreso, fecha, conn);
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

      const infoIngreso = await this.repository.infoIngreso(adnIngreso, fecha, conn);

      const balanceLiquidos = (
        await this._reportesServices.fetchByConsecutivo(+adnIngreso, [], fecha, [], conn, context)
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

  async getUciSheet(
    ingreso: string,
    fechaInicio: Date,
    fechaFinal: Date,
    conn: DataSource,
    context: GcmContextCode
  ) {
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
        const datos = await this.getUciSheets(ingreso, fechas[i], conn, context);
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

  async getHpnestancia(adnIngreso: string, conn: DataSource): Promise<DefaultResponse> {
    try {
      const data = await this.repository.getHpnestancia(adnIngreso, conn);
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

  async PacientesSinPeso(conn: DataSource) {
    try {
      const data = await this.repository.pacientesSinPeso(conn);
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
