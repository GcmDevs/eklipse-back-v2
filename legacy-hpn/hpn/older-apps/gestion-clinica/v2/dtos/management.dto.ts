import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateManagementDto {
  title: string;
  content: string;
  priority: number;
  patient: number;
  consecutive: number;
  area: number;
}

export class ReasignarDto {
  @IsNumber()
  gestionId: number;
  @IsNumber()
  areaId: number;
  @IsString()
  @Length(0, 500)
  @IsOptional()
  observacion: string;
}
