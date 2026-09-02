export class TDiagnosticoRes {
  fechaFolio: Date;
  diagnostico: {
    codigo: string;
    nombre: string;
  };
  medico: {
    nombre: string;
    documento: string;
  };
  observacion: string;
}
