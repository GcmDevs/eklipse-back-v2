import { TimerService } from '@common/infrastructure/services';

export interface ReporteDpSabanaUciDto {
  informacionIngreso: InformacionIngresoDto;
  balanceLiquidos: BalanceLiquidoDto;
  glucometrias: GlucometriaDto[];
  liquidos: LiquidoDto[];
  signos: SignoVitalDto[];
}
export interface BalanceLiquidoDto {
  _24Horas: number;
  acumulado: number;
  gastoUrinario: number;
  liquidosAdministrados: number;
  liquidosEliminados: number;
  perdidaInsensible: number;
}
export interface GlucometriaDto {
  cantidad: number;
  observacion: string | null;
  resultado: number | null;
  hora: number;
  glucometria?: string | null;
  insulina?: string | null;
}
export interface InformacionIngresoDto {
  fechaRegistro: Date;
  fechaRegistroFt: string;
  cama: {
    codigo: string;
  };
  ingreso: {
    consecutivo: number;
  };
  paciente: {
    nombreCompleto: string;
    documento: {
      numero: string;
    };
    peso: number;
  };
  entidad: {
    nombre: string;
  };
}
export interface CategoriaDto {
  categoria: {
    nombre: string;
    subcategoria?: {
      nombre: string;
    };
  };
}
export interface LiquidoDto extends CategoriaDto {
  liquido: string;
  resultados: ResultadoDto[];
}
export interface SignoVitalDto extends CategoriaDto {
  signo: string;
  resultados: ResultadoDto[];
}
export interface ResultadoDto {
  hora: number;
  valor: number | string;
}

export interface ReporteSabanaUciResponse {
  balanceLiquidos: BalanceLiquidoResponse;
  glucometria: GlucometriaResponse[];
  infoIngreso: InfoIngresoResponse[];
  liquidos: LiquidoResponse[];
  signos: SignoVitalResponse[];
}

export interface BalanceLiquidoResponse {
  balance24Horas: number;
  balanceAcumulado: number;
  gastoUrinario: number;
  liquidosAdministrados: number;
  liquidosEliminados: number;
  perdidaInsensible: number;
  totalLiquidosEliminados: number;
}

export interface GlucometriaResponse {
  CANTIDAD: number | null;
  GLUCOMETRIA: string;
  INSULINA: string | null;
  OBSERVACION: string | null;
  RESULTADO: number | null;
  hora: number;
}

export interface InfoIngresoResponse {
  CAMA: string;
  CONS_INGRESO: number;
  FECHA_REGISTRO_ENF: Date;
  GDENOMBRE: string;
  GPANOMCOM: string;
  GRUPO_CAMA: string;
  OID: number;
  PACNUMDOC: string;
  PESO: number;
}

export interface LiquidoResponse {
  liquido: string;
  subgrupo?: string;
  resultado: ResultadoLiquidoResponse[];
}

export interface ResultadoLiquidoResponse {
  CANTIDAD: number;
  LIQUIDO: string;
  SUBGRUPO: string;
  hora: number;
}

export interface SignoVitalResponse {
  signo: string;
  resultados: ResultadoSignoVitalResponse[];
}

export interface ResultadoSignoVitalResponse {
  CATEGORIA: string;
  FECHA_REGISTRO_ENF: string;
  HORAREG: number;
  SIGNO: string;
  SUBGRUPO: string;
  VALOR: string;
  hora: number;
  oid: number;
}

const _completarHorasLiquidos = (data: LiquidoResponse[]) => {
  let newArr: any[] = [];
  for (let i = 0; i < data.length; i++) {
    newArr.push({
      liquido: data[i].liquido,
      resultado: _autocompleteHours(data[i].resultado),
      subgrupo: data[i].subgrupo,
    });
  }
  return newArr;
};

const _autocompleteHours = (data: any): any => {
  const newArr: any[] = [];
  for (let i = 7; i <= 23; i++) {
    let arrFiltered = data.filter((el: any) => el.hora === i)[0];
    if (arrFiltered !== undefined) {
      newArr.push(arrFiltered);
    } else {
      newArr.push({ hora: i, CANTIDAD: 0, VALOR: 0 });
    }
  }
  for (let i = 0; i <= 6; i++) {
    let arrFiltered = data.filter((el: any) => el.hora === i)[0];
    if (arrFiltered !== undefined) {
      newArr.push(arrFiltered);
    } else {
      newArr.push({ hora: i, CANTIDAD: 0, VALOR: 0 });
    }
  }
  return newArr;
};

const _completarHorasSignos = (data: SignoVitalResponse[]) => {
  //console.log(data);
  let newArr: any[] = [];
  for (let i = 0; i < data.length; i++) {
    newArr.push({
      signo: data[i].signo,
      resultados: _autocompleteHours(data[i].resultados),
      categoria: { nombre: 'SIGNOS VITALES' },
    });
  }
  return newArr;
};

export const dataToInformacionIngreso = (_: InfoIngresoResponse): InformacionIngresoDto => {
  const formatTime = new TimerService();
  const fechaRegistro = new Date(`${_.FECHA_REGISTRO_ENF.toISOString().split('T')[0]}:00:00`);
  const _2 = {
    fechaRegistro,
    fechaRegistroFt: formatTime.formatDate(fechaRegistro, 9, true),
    cama: {
      codigo: _.CAMA,
    },
    ingreso: {
      consecutivo: _.CONS_INGRESO,
    },
    paciente: {
      nombreCompleto: _.GPANOMCOM,
      documento: {
        numero: _.PACNUMDOC,
      },
      peso: _.PESO,
    },
    entidad: {
      nombre: _.GDENOMBRE,
    },
  };

  return _2;
};

export const dataToBalanceLiquidos = (_: BalanceLiquidoResponse): BalanceLiquidoDto => {
  const _2 = {
    _24Horas: _.balance24Horas ? +_.balance24Horas.toFixed(2) : _.balance24Horas,
    acumulado: _.balanceAcumulado ? +_.balanceAcumulado.toFixed(2) : _.balanceAcumulado,
    gastoUrinario: _.gastoUrinario ? +_.gastoUrinario.toFixed(2) : _.gastoUrinario,
    liquidosAdministrados: _.liquidosAdministrados
      ? +_.liquidosAdministrados.toFixed(2)
      : _.liquidosAdministrados,
    liquidosEliminados: _.liquidosEliminados
      ? +_.liquidosEliminados.toFixed(2)
      : _.liquidosEliminados,
    perdidaInsensible: _.perdidaInsensible ? +_.perdidaInsensible.toFixed(2) : _.perdidaInsensible,
  };

  return _2;
};

export const dataToGlucometrias = (_: GlucometriaResponse[]): GlucometriaDto[] => {
  const _2 = _.map(_2 => {
    return {
      cantidad: _2.CANTIDAD || 0,
      observacion: _2.OBSERVACION,
      resultado: _2.RESULTADO,
      hora: _2.hora,
    };
  });

  return _2;
};

export const dataToLiquidos = (_: LiquidoResponse[]): LiquidoDto[] => {
  _.map(_2 => {
    _2.subgrupo = _2.resultado[0].SUBGRUPO;
  });

  _ = _completarHorasLiquidos(_);

  const _2 = _.map(_2 => {
    return {
      liquido: _2.liquido.trim(),
      resultados: _2.resultado.map(_3 => {
        return {
          hora: _3.hora,
          valor: _3.CANTIDAD,
        };
      }),
      categoria: {
        nombre: 'LIQUIDOS',
        subcategoria: {
          nombre: _2.subgrupo!,
        },
      },
    };
  });

  return _2;
};

export const dataToSignos = (_: SignoVitalResponse[]): SignoVitalDto[] => {
  _ = _completarHorasSignos(_);

  const _2 = _.map(_2 => {
    return {
      signo: _2.signo.trim(),
      resultados: _2.resultados.map(_3 => {
        return {
          hora: _3.hora,
          valor: _3.VALOR,
        };
      }),
      categoria: {
        nombre: 'SIGNOS VITALES',
      },
    };
  });

  return _2;
};

export const dataToReporteSabanasUci = (_: ReporteSabanaUciResponse): ReporteDpSabanaUciDto => {
  return {
    informacionIngreso: dataToInformacionIngreso(_.infoIngreso[0]),
    balanceLiquidos: dataToBalanceLiquidos(_.balanceLiquidos),
    glucometrias: dataToGlucometrias(_.glucometria),
    liquidos: dataToLiquidos(_.liquidos),
    signos: dataToSignos(_.signos),
  };
};
