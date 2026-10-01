export interface EpicrisisDto {
  consecutivo: number;
  ingreso: {
    consecutivo: number;
  };
  createdAt: string;
  paciente: {
    nombreCompleto: string;
    numeroDocumento: string;
    lugarExpedDocumento: string;
  };
  medico: {
    nombreCompleto: string;
  };
  estado: {
    code: number;
    forHumans: string;
  };
}
