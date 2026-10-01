export interface InterConsultaPendienteDto {
  id: number;
  ingreso: {
    id: number;
    consecutivo: number;
  };
  centro: {
    id: number;
    nombre: string;
  };
  especialidad: {
    id: number;
    nombre: string;
  };
  folio: {
    id: number;
    createdAt: Date;
  };
  paciente: {
    id: number;
    nombreCompleto: string;
    numeroDocumento: string;
    genero: {
      type: number;
      forHumans: string;
    };
  };
  cama: {
    codigo: string;
    nombre: string;
    subgrupo: {
      codigo: string;
      nombre: string;
    };
  };
  diagnostico: {
    codigo: number | null;
    nombre: string | null;
  };
  motivoConsulta: string;
}
