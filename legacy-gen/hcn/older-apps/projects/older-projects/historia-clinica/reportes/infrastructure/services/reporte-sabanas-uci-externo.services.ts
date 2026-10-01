import { Injectable } from '@nestjs/common';
import {
  fetchGlucometriasQuery,
  fetchInfoIngresoQuery,
  fetchLiquidosQuery,
  fetchSignosVitalesQuery,
} from '../queries';
import {
  GlucometriaResponse,
  InfoIngresoResponse,
  LiquidoResponse,
  SignoVitalResponse,
} from '../responses';
import { dataToInfoIngresoDto, organizarLiquidos, organizarSignosVitales } from '../factories';
import {
  InfoIngresoDto,
  LiquidoDto,
  SignoVitalDto,
} from '@hcn/rft/historia-clinica/reportes/application/dtos';
import { viaEliminacionLiquidosTypeFactory } from '@hcn/rft/historia-clinica/reportes/domain/types';
import {
  LIQUIDOS_ADMINISTRADOS,
  LIQUIDOS_ELIMINADOS,
} from '@hcn/rft/historia-clinica/reportes/application/constants';
import { orderBy } from 'lodash';
import { GCM_CONTEXTS, GcmContextCode } from '@common/domain/types';
import { DataSource } from 'typeorm';

@Injectable()
export class FetchReporteSabanasUciExternoServices {
  public async single(consecutivo: number, fecha: Date, conn: DataSource, context: GcmContextCode) {
    try {
      const paciente = await conn.query(
        `SELECT OID, GENPACIEN, AINCONSEC, AINFECING FROM ADNINGRESO WHERE AINCONSEC = ${consecutivo}`
      );

      const sixMonthsAgo = new Date(fecha.getTime() - 86400000 * 150);

      const qr = `SELECT OID, AINCONSEC, AINFECING FROM ADNINGRESO
        WHERE GENPACIEN = ${paciente[0].GENPACIEN}
        AND CONVERT(DATE, AINFECING, 103) > '${sixMonthsAgo.toISOString().split('T')[0]}'
        AND '${fecha.toISOString().split('T')[0]}' BETWEEN CONVERT(DATE, AINFECING, 103)
        AND isnull(CONVERT(DATE, AINFECEGRE, 103), '${
          new Date(fecha.getTime() + 86400000).toISOString().split('T')[0]
        }');`;

      let ingresosQR = await conn.query(qr);

      ingresosQR = ingresosQR.filter(_ => _.AINCONSEC !== paciente[0].AINCONSEC);

      ingresosQR.unshift(...paciente);

      const ignoreAutocompleteByIngresoElMismoDia: number[] = [];

      const ingresoElMismoDia =
        ingresosQR.length === 1 &&
        new Date(ingresosQR[0].AINFECING.getTime()).toISOString().split('T')[0] ===
          fecha.toISOString().split('T')[0];

      if (ingresoElMismoDia) {
        const limit = new Date(ingresosQR[0].AINFECING.getTime()).getHours();
        if (limit >= 7) {
          for (let i = 7; i < 23; i++) {
            if (i <= limit) ignoreAutocompleteByIngresoElMismoDia.push(i);
          }
        }
        if (limit < 7) {
          for (let i = 0; i < 6; i++) {
            if (i <= limit) ignoreAutocompleteByIngresoElMismoDia.push(i);
          }
        }
      }

      const ingresos = ingresosQR.map((_: any) => _.OID);

      const consecutivos = ingresosQR.map((_: any) => _.AINCONSEC);

      const result = await this.fetchByConsecutivo(
        consecutivo,
        ingresos,
        fecha,
        ignoreAutocompleteByIngresoElMismoDia,
        conn,
        context,
        consecutivos
      );

      if (result) return result;
      else throw new Error('No existen registros con este consecutivo en esa fecha');
    } catch (error) {
      //console.log(error.message);
      throw new Error(error.message);
    }
  }

  public async fetchByConsecutivo(
    consecutivo: number,
    ingresos: number[],
    fecha: Date,
    ignoreAutocompleteByIngresoElMismoDia: number[],
    conn: DataSource,
    context: GcmContextCode,
    consecutivos?: number[]
  ) {
    if (!consecutivos) consecutivos = [consecutivo];

    let cirugias = [];

    if (ingresos.length)
      cirugias = await this._fetchCirugiasPaciente(ingresos, fecha, conn, context);

    const ingresoExistente: InfoIngresoResponse[] = await conn.query(
      fetchInfoIngresoQuery(consecutivo, fecha)
    );

    if (ingresoExistente.length) {
      const ingreso: InfoIngresoDto = dataToInfoIngresoDto(ingresoExistente[0]);
      const liquidos = await this.fetchLiquidos(
        consecutivos,
        fecha,
        ignoreAutocompleteByIngresoElMismoDia,
        conn
      );

      const signosVitales = await this._fetchSignosVitales(
        consecutivos,
        fecha,
        ignoreAutocompleteByIngresoElMismoDia,
        conn
      );

      const estadisticas = await this._fetchEstadisticasFromLiquidos(
        liquidos,
        consecutivos,
        24 - ignoreAutocompleteByIngresoElMismoDia.length,
        ingreso.paciente.peso,
        fecha,
        ignoreAutocompleteByIngresoElMismoDia.length > 1,
        signosVitales,
        conn
      );

      let glucometrias = await this._fetchGlucometrias(consecutivos, fecha, conn);

      glucometrias = orderBy(glucometrias, 'hora', 'asc');

      const gluco1 = glucometrias.slice(0, 7);
      const gluco2 = glucometrias.slice(7);

      glucometrias = [...gluco2, ...gluco1];

      return {
        ingreso,
        liquidos,
        estadisticas,
        signosVitales,
        glucometrias,
        cirugias,
      };
    } else {
      return false as any as {
        estadisticas: any;
      };
    }
  }

  public async fetchLiquidos(
    consecutivos: number[],
    fecha: Date,
    ignoreAutocompleteByIngresoElMismoDia: number[],
    conn: DataSource
  ) {
    const liquidosRs: LiquidoResponse[] = await conn.query(fetchLiquidosQuery(consecutivos, fecha));

    liquidosRs.map(l => {
      l.LIQUIDO = l.LIQUIDO ? l.LIQUIDO.trim() : l.LIQUIDO;

      if (l.LIQUIDO === 'OTROS' && l.SUBGRUPO === 'LIQUIDOS ELIMINADOS' && l.HCLVIAELM) {
        l.LIQUIDO = viaEliminacionLiquidosTypeFactory(l.HCLVIAELM).getForHumans();
      }
    });

    const liquidos = liquidosRs.length
      ? organizarLiquidos(liquidosRs, ignoreAutocompleteByIngresoElMismoDia)
      : [];

    return liquidos;
  }

  private async _fetchSignosVitales(
    consecutivos: number[],
    fecha: Date,
    ignoreAutocompleteByIngresoElMismoDia: number[],
    conn: DataSource
  ) {
    const signosVitalesRs: SignoVitalResponse[] = await conn.query(
      fetchSignosVitalesQuery(consecutivos, fecha)
    );

    if (!signosVitalesRs.filter(_ => _.SIGNO! === 'VENTILADO SI=1 / NO=2').length) {
      signosVitalesRs.push({
        hora: 0,
        valor: '2',
        SIGNO: 'VENTILADO SI=1 / NO=2',
      });
    }

    const signosVitales = signosVitalesRs.length
      ? organizarSignosVitales(signosVitalesRs, ignoreAutocompleteByIngresoElMismoDia)
      : [];

    return signosVitales;
  }

  private async _fetchEstadisticasFromLiquidos(
    liquidos: LiquidoDto[],
    consecutivos: number[],
    horasDia: number,
    pesoPaciente: number,
    fecha: Date,
    ingresoElMismoDia: boolean,
    signosVitales: SignoVitalDto[],
    conn: DataSource
  ) {
    let liquidosAdministrados = 0;
    let liquidosEliminados = 0;
    let perdidasInsensibles = 0;
    let diuresis = 0;
    let balanceAcumulado = 0;
    let gastoUrinario = 0;
    let balance24H = 0;

    /** PERDIDAS INSENSIBLES */
    perdidasInsensibles = this._calcularPerdidasInsensibles(signosVitales, pesoPaciente);
    /* LIQUIDOS */
    liquidos.forEach(liquido => {
      liquido.resultados.forEach(_ => {
        if (_.hora === 99) {
          if (liquido.clasificacion === LIQUIDOS_ADMINISTRADOS) {
            liquidosAdministrados += _.valor;
          }
          if (liquido.clasificacion === LIQUIDOS_ELIMINADOS) {
            liquidosEliminados += _.valor;
            if (liquido.liquido === 'ORINA') diuresis += _.valor;
          }
        }
      });
    });

    liquidosEliminados += perdidasInsensibles;

    balance24H = liquidosAdministrados - liquidosEliminados;

    if (pesoPaciente !== 0) gastoUrinario = diuresis / pesoPaciente / horasDia;
    else gastoUrinario = 0;

    if (!ingresoElMismoDia) {
      const liquidosDiaAnterior = await this.fetchLiquidos(
        consecutivos,
        new Date(fecha.getTime() - 86400000),
        [],
        conn
      );

      const signosDiaAnterior = await this._fetchSignosVitales(
        consecutivos,
        new Date(fecha.getTime() - 86400000),
        [],
        conn
      );

      const perdidasInsensiblesDiaAnterior = this._calcularPerdidasInsensibles(
        signosDiaAnterior,
        pesoPaciente
      );

      let liquidosAdministradosDiaAnterior = 0;
      let liquidosEliminadosDiaAnterior = perdidasInsensiblesDiaAnterior;

      liquidosDiaAnterior.forEach(liquido => {
        liquido.resultados.forEach(_ => {
          if (_.hora === 99) {
            if (liquido.clasificacion === LIQUIDOS_ADMINISTRADOS) {
              liquidosAdministradosDiaAnterior += _.valor;
            }
            if (liquido.clasificacion === LIQUIDOS_ELIMINADOS) {
              liquidosEliminadosDiaAnterior += _.valor;
            }
          }
        });
      });

      const balanceAnterior = liquidosAdministradosDiaAnterior - liquidosEliminadosDiaAnterior;
      balanceAcumulado = balance24H + balanceAnterior;
    } else {
      balanceAcumulado = balance24H;
    }

    return {
      liquidosAdministrados,
      liquidosEliminados,
      diuresis,
      perdidasInsensibles,
      balanceAcumulado,
      gastoUrinario,
      balance24H,
      balance24Horas: balance24H,
      totalLiquidosEliminados: liquidosEliminados,
      perdidaInsensible: perdidasInsensibles,
    };
  }

  private _calcularPerdidasInsensibles(signosVitales: SignoVitalDto[], pesoPaciente: number) {
    let perdidasInsensibles = 0;
    const temperaturas = signosVitales.filter(_ => _.signo === 'TEMPERATURA');
    const estadoVentiladoHr = signosVitales.filter(_ => _.signo === 'VENTILADO SI=1 / NO=2')[0]
      .resultados;

    if (temperaturas.length) {
      for (let i = 0; i <= 23; i++) {
        const temperatura = +`${
          temperaturas[0].resultados.filter(_ => _.hora === i)[0].valor
        }`.replace(',', '.');
        const isVentilado =
          `${estadoVentiladoHr.filter(_ => _.hora === i)[0].valor}` === '1' ? true : false;

        if (!isNaN(temperatura) && temperatura !== 0) {
          let constante = 0.5;
          if (isVentilado) constante = 0.75;
          if (temperatura > 38) constante += 0.2;

          perdidasInsensibles += constante * pesoPaciente;
        }
      }
    }
    return perdidasInsensibles;
  }

  private async _fetchGlucometrias(consecutivos: number[], fecha: Date, conn: DataSource) {
    const glucometrias: GlucometriaResponse[] = await conn.query(
      fetchGlucometriasQuery(consecutivos, fecha)
    );

    glucometrias.map(g => {
      g.horaForHumans = `${g.hora}:00`;
    });
    return glucometrias;
  }

  private async _fetchCirugiasPaciente(
    ingresos: number[],
    fecha: Date,
    conn: DataSource,
    context: GcmContextCode
  ) {
    let cirugias = [];
    let folios = [];

    folios = await conn.query(
      `SELECT OID FROM HCNFOLIO WHERE ADNINGRESO IN (${ingresos}) AND CONVERT(DATE, HCFECFOL, 103) = @0;`,
      [fecha.toISOString().split('T')[0]]
    );

    folios = folios.map(f => f.OID);

    if (folios.length) {
      const fechaInicio = context === GCM_CONTEXTS.SANJUAN.getCode() ? 'HCCM06N01' : 'HCCM06N02';
      const fechaFin = context === GCM_CONTEXTS.SANJUAN.getCode() ? 'HCCM06N02' : 'HCCM06N03';

      cirugias = await conn.query(
        `SELECT OID id, ${fechaInicio} fechaInicio, ${fechaFin} fechaFin
        FROM HCMDESCQX WHERE HCNFOLIO IN (${folios}) AND CONVERT(DATE, ${fechaInicio}, 103) = @0;`,
        [fecha.toISOString().split('T')[0]]
      );
    }

    return cirugias;
  }
}
