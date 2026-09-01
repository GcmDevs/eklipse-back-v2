import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SignosVitalesFlowDto {
  @IsString()
  ta: string;

  @IsNumber()
  fc: number;

  @IsNumber()
  fr: number;

  @IsNumber()
  sato2: number;

  @IsNumber()
  fcf: number;

  @IsNumber()
  glasgow: number;

  @IsNumber()
  @IsOptional()
  peso: number;

  @IsNumber()
  @IsOptional()
  talla: number;

  @IsNumber()
  @IsOptional()
  temp: number;

  @IsString()
  fechaRegistro: string;

  @IsOptional()
  @IsString()
  observacion: string;
}
