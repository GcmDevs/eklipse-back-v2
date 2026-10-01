import {
  InfoIngresoDto,
  LiqSigResultadoDto,
  LiquidoDto,
  SignoVitalDto,
} from '@hcn/rft/historia-clinica/reportes/application/dtos';
import { InfoIngresoResponse, LiquidoResponse, SignoVitalResponse } from '../responses';
import { cloneDeep, orderBy } from 'lodash';
import { groupByKey } from '@hcn/old/common/presentation/helpers';

export const dataToInfoIngresoDto = (_: InfoIngresoResponse): InfoIngresoDto => {
  const result: InfoIngresoDto = {
    id: _.OID,
    consecutivo: _.AINCONSEC,
    cama: {
      codigo: _.HCACODIGO,
      grupo: {
        nombre: _.HGRNOMBRE,
      },
    },
    paciente: {
      nombreCompleto: _.GPANOMCOM,
      peso: _.PESO,
      documento: {
        numero: _.PACNUMDOC,
      },
    },
    createdAt: _.HCFECREG,
    contrato: {
      nombre: _.GDENOMBRE,
    },
  };

  return result;
};

export const organizarLiquidos = (
  data: LiquidoResponse[],
  ignoreAutocompleteByIngresoElMismoDia: number[]
) => {
  const liquidosAgrupados = groupByKey(data, 'LIQUIDO', 'LIQUIDO');

  const liquidosOrganizados: LiquidoDto[] = [];

  liquidosAgrupados.map(group => {
    const liquidosSumados: LiquidoResponse[] = [];

    group.rows.map((liquido, i) => {
      if (!i) {
        liquidosSumados.push(liquido);
      } else {
        liquidosSumados.map(liquidoSumado => {
          if (liquido.HORA === liquidoSumado.HORA) {
            liquidoSumado.CANTIDAD = liquidoSumado.CANTIDAD + liquido.CANTIDAD;
          }
          if (!liquidosSumados.filter(i => i.HORA === liquido.HORA).length) {
            liquidosSumados.push(liquido);
          }
        });
      }
    });

    const liquidosTransformados = liquidosSumados.map(liquido => {
      return {
        hora: liquido.HORA,
        horaForHumans: `${liquido.HORA}:00`,
        valor: liquido.CANTIDAD,
      };
    });

    const liquidosAutocompletados: LiqSigResultadoDto[] = _autocompleteHours(
      liquidosTransformados,
      'hora',
      'valor',
      ignoreAutocompleteByIngresoElMismoDia,
      'INNECESARIO'
    );

    let totalLiquidosConsumidos = 0;

    liquidosAutocompletados.forEach(_ => {
      if (typeof _.valor === 'number') totalLiquidosConsumidos += _.valor;
    });

    liquidosAutocompletados.push({
      hora: 99,
      horaForHumans: 'Total',
      valor: totalLiquidosConsumidos,
    });

    liquidosOrganizados.push({
      liquido: group.name,
      clasificacion: group.rows[0].SUBGRUPO,
      resultados: liquidosAutocompletados,
    });
  });

  return liquidosOrganizados;
};

export const organizarSignosVitales = (
  signosVitales: SignoVitalResponse[],
  ignoreAutocompleteByIngresoElMismoDia: number[]
): SignoVitalDto[] => {
  const signosVitalesReducidos = signosVitales.reduce((h, signoVital) => {
    h[signoVital.SIGNO] = (h[signoVital.SIGNO] || []).concat(signoVital);
    return h;
  }, {});

  const signosVitalesAgrupados = [];

  for (const signoVital in signosVitalesReducidos) {
    const signoVitalAgrupado = {
      signo: signoVital,
      resultados: signosVitalesReducidos[signoVital],
    };
    signosVitalesAgrupados.push(signoVitalAgrupado);
  }

  let signosVitalesFiltrados = cloneDeep(signosVitalesAgrupados);

  if (signosVitalesAgrupados.filter(_ => _.signo === 'TENSION ARTERIAL MEDIA').length) {
    signosVitalesFiltrados = signosVitalesAgrupados.filter(
      _ => _.signo !== 'TENSION ARTERIAL MEDIA'
    );

    const TAM = {
      signo: 'TENSION ARTERIAL MEDIA',
      resultados: [],
    };

    const temp = signosVitalesAgrupados.filter(
      (el: { signo: string }) => el.signo === 'TENSION ARTERIAL'
    );

    if (temp.length) {
      temp
        .filter((_: { signo: string }) => _.signo === 'TENSION ARTERIAL')[0]
        .resultados.map((_f: SignoVitalResponse) => {
          const sistolica = +_f.valor.split('/')[0];
          const diastolica = +_f.valor.split('/')[1];
          const result = (sistolica - diastolica) / 3;

          TAM.resultados.push({
            hora: _f.hora,
            valor: Math.round(diastolica + result),
          });
        });
    }

    signosVitalesFiltrados.push(TAM);
  }

  signosVitalesFiltrados.map(_ => {
    _.orden = _addOrdenSignoVitalByNombre(_.signo);

    const resultadoAutocompletado = _autocompleteHours(
      _.resultados,
      'hora',
      'valor',
      ignoreAutocompleteByIngresoElMismoDia,
      _.signo
    );
    _.resultados = resultadoAutocompletado;
  });

  const signosVitalesOrdenados = orderBy(signosVitalesFiltrados, 'orden', 'asc');

  signosVitalesOrdenados.map(_ => {
    _.resultados.map((resultado: SignoVitalResponse) => {
      resultado.horaForHumans = `${resultado.hora}:00`;
      delete resultado.SIGNO;
    });
    delete _.orden;
  });

  return signosVitalesOrdenados;
};

const _autocompleteHours = (
  data: any[],
  keyToAutocomplete: string,
  complement: string,
  ignoreAutocompleteByIngresoElMismoDia: number[],
  elementName: string
): any => {
  const newArr: any[] = [];
  for (let i = 7; i <= 23; i++) {
    let arrFiltered = data.filter((el: any) => el[keyToAutocomplete] === i)[0];
    if (arrFiltered !== undefined) {
      newArr.push(arrFiltered);
    } else {
      /* const valueAutocompleted = ignoreAutocompleteByIngresoElMismoDia.filter(_ => _ === i).length
        ? 'NI'
        : elementName === 'VENTILADO SI=1 / NO=2'
        ? 2
        : 0; */
      const valueAutocompleted = elementName === 'VENTILADO SI=1 / NO=2' ? 2 : 0;
      newArr.push({
        [keyToAutocomplete]: i,
        horaForHumans: `${i}:00`,
        [complement]: valueAutocompleted,
      });
    }
  }
  for (let i = 0; i <= 6; i++) {
    let arrFiltered = data.filter((el: any) => el[keyToAutocomplete] === i)[0];
    if (arrFiltered !== undefined) {
      newArr.push(arrFiltered);
    } else {
      /* const valueAutocompleted = ignoreAutocompleteByIngresoElMismoDia.filter(_ => _ === i).length
        ? 'NI'
        : elementName === 'VENTILADO SI=1 / NO=2'
        ? 2
        : 0; */
      const valueAutocompleted = elementName === 'VENTILADO SI=1 / NO=2' ? 2 : 0;
      newArr.push({
        [keyToAutocomplete]: i,
        horaForHumans: `${i}:00`,
        [complement]: valueAutocompleted,
      });
    }
  }
  return newArr;
};

const _addOrdenSignoVitalByNombre = (_: string) => {
  if (_ === 'TENSION ARTERIAL') return 1;
  if (_ === 'TENSION ARTERIAL MEDIA') return 2;
  if (_ === 'FRECUENCIA CARDIACA') return 3;
  if (_ === 'FRECUENCIA RESPIRATORIA') return 4;
  if (_ === 'TEMPERATURA') return 5;
  if (_ === 'SATURACION DE OXIGENO') return 6;
  else return 7;
};
