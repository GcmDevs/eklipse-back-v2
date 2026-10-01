import { ApiProperty } from '@nestjs/swagger';

export interface PacHospiBasicoI {
  OID: number;
  PACNUMDOC: string;
  GPANOMCOM: string;
}

export interface PacHospiI {
  ADNINGRESO: number;
  AINCONSEC: number;
  GPANOMPAC: string;
  GENPACIEN: number;
  GPADOCPAC: string;
  HCACODIGO: string;
  HCANOMBRE: string;
  HSUCODIGO: string;
  HSUNOMBRE: string;
}

export class IngrPacHospiRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  consecutivo: number;
}

export class SubgrPacHospiRes {
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  nombre: string;
}

export class PacienteHospiRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  documento: string;
  @ApiProperty()
  nombreCompleto: string;
}

export class CamPacHospiRes {
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  nombre: string;
  @ApiProperty()
  subgrupo: SubgrPacHospiRes;
}

export class PacHospiRes {
  @ApiProperty()
  ingreso: IngrPacHospiRes;
  @ApiProperty()
  cama: CamPacHospiRes;
  @ApiProperty()
  paciente: PacienteHospiRes;
}
