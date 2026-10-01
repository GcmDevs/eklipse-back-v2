import { IsNumber, IsString } from 'class-validator';

export class VerificarEstanteDto {
  @IsString()
  observaciones: string;
}

export class UpdateExistenciaEstanteDto {
  @IsNumber()
  productoId: number;

  @IsNumber()
  stock: number;
}
