import { ApiProperty } from '@nestjs/swagger';
import { TipoRotulo } from '@hpn/rotulo-medicamentos/shared/types';

export class RotuloMedicamentoRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombrePaciente: string;

  @ApiProperty()
  numeroDocumento: string;

  @ApiProperty()
  codigoProducto: string;

  @ApiProperty()
  descripcionProducto: string;

  @ApiProperty()
  fechaRotulo: Date;

  @ApiProperty()
  cama: string;

  @ApiProperty()
  servicio: string;

  @ApiProperty()
  dosis: number | null;

  @ApiProperty()
  unidadMedida: string | null;

  @ApiProperty()
  viaAdministracion: string | null;

  @ApiProperty()
  inicio: string | null;

  @ApiProperty()
  usuario: string;

  @ApiProperty()
  ingresoConsecutivo: string;

  @ApiProperty({ enum: TipoRotulo })
  tipoRotulo: TipoRotulo;

  @ApiProperty({ required: false, nullable: true })
  mezcla: string | null;

  @ApiProperty({ required: false, nullable: true })
  preparacion: string | null;

  @ApiProperty({ required: false, nullable: true })
  velocidadInfusion: string | null;

  @ApiProperty({ required: false, nullable: true })
  finalizacion: string | null;
}

export class MedicamentoRotuloRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ingreso: number;

  @ApiProperty()
  folio: number;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  administrado: boolean;

  @ApiProperty()
  guardado: boolean;

  @ApiProperty()
  codigo_estado: number;

  @ApiProperty()
  estado: string;
}

export class CensoRotuloMedicamentoRes {
  @ApiProperty()
  sede: string;

  @ApiProperty()
  hsuNombre: string;

  @ApiProperty()
  gasNombre: string;

  @ApiProperty()
  cama: string;

  @ApiProperty()
  tipoIngreso: string;

  @ApiProperty()
  especialidad: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  identificacion: string;

  @ApiProperty()
  nombrePaciente: string;

  @ApiProperty()
  ingreso: number;

  @ApiProperty()
  grupoNuevo: string;

  @ApiProperty()
  edad: number;

  @ApiProperty()
  sexo: string;

  @ApiProperty()
  dias: number;

  @ApiProperty()
  planBeneficio: string;

  @ApiProperty()
  entidad: string;

  @ApiProperty()
  municipio: string;

  @ApiProperty()
  hgrNombre: string;

  @ApiProperty()
  diagnostico: string;
}

export class RegistrarRotuloMedicamentoRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ingresoId: number;

  @ApiProperty()
  usuarioId: number;

  @ApiProperty()
  pacienteId: number;

  @ApiProperty()
  productoId: number;

  @ApiProperty()
  cama: string;

  @ApiProperty()
  fechaRotulo: Date;

  @ApiProperty()
  servicio: string;

  @ApiProperty()
  dosis: number | null;

  @ApiProperty()
  viaAdministracion: string | null;

  @ApiProperty()
  inicio: string | null;

  @ApiProperty()
  unidadMedida: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  guardado: boolean;

  @ApiProperty({ description: 'Indica que el medicamento fue administrado al generar el rótulo' })
  administrado: boolean;

  @ApiProperty({ enum: TipoRotulo })
  tipoRotulo: TipoRotulo;

  @ApiProperty({ required: false, nullable: true })
  mezcla: string | null;

  @ApiProperty({ required: false, nullable: true })
  preparacion: string | null;

  @ApiProperty({ required: false, nullable: true })
  velocidadInfusion: string | null;

  @ApiProperty({ required: false, nullable: true })
  finalizacion: string | null;
}
