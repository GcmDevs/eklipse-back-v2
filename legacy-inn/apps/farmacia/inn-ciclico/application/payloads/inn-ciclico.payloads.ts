import { IsNumber, IsString } from 'class-validator';

export class VerificarEstantePayload {
  @IsString()
  observaciones: string;
}

export class UpdateExistenciaEstantePayload {
  @IsNumber()
  productoId: number;

  @IsNumber()
  stock: number;
}
export class AgregarProductoPayload {
  @IsNumber()
  productoId: number;

  @IsNumber()
  estanteId: number;

  @IsNumber()
  stock: number;
}
