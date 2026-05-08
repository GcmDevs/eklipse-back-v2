import { ApiProperty } from '@nestjs/swagger';

export class EpsRes {
  @ApiProperty()
  nombre: string;
}

export class DocPacHospRes {
  @ApiProperty()
  numero: string;
  @ApiProperty()
  tipo: string;
}

export class EntBasRes {
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  nombre: string;
}

export class UbicacionRes {
  @ApiProperty({ type: EntBasRes })
  subgrupo: EntBasRes;
  @ApiProperty({ type: EntBasRes })
  cama: EntBasRes;
}

export class PacienteHospitalizadoRes {
  @ApiProperty()
  nombreCompleto: string;
  @ApiProperty({ type: DocPacHospRes })
  documento: DocPacHospRes;
  @ApiProperty()
  fechaNacimiento: Date;
  @ApiProperty()
  fechaIngreso: Date;
  @ApiProperty({ type: EpsRes })
  eps: EpsRes;
  @ApiProperty()
  ubicacion: UbicacionRes;
}
