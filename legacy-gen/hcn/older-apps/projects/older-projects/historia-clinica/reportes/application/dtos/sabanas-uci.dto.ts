export interface InfoIngresoDto {
  id: number;
  consecutivo: number;
  cama: {
    codigo: string;
    grupo: {
      nombre: string;
    };
  };
  paciente: {
    nombreCompleto: string;
    peso: number;
    documento: {
      numero: string;
    };
  };
  createdAt: string;
  contrato: {
    nombre: string;
  };
}

export interface LiquidoDto {
  liquido: string;
  clasificacion: string;
  resultados: LiqSigResultadoDto[];
}

export interface SignoVitalDto {
  signo: string;
  resultados: LiqSigResultadoDto[];
}

export interface LiqSigResultadoDto {
  horaForHumans: string;
  hora: number;
  valor: number;
}

export interface CirugiaDto {
  id: number;
  fechaInicio: string;
  fechaFin: string;
}
