export interface PacientePostquirurgicoDto {
  ingreso: { creadoDesde: Date };
  folio: {
    id: number;
    creadoDesde: Date;
    historiaClinica: { descripcionCorta: string; descripcionLarga: string };
  };
  paciente: { nombreCompleto: string };
}
