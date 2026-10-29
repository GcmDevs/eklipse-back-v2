import { IsBoolean, IsInt, Min } from 'class-validator';

export class ActualizarFacturadorDto {
  @IsInt()
  @Min(1)
  rolId: number;

  @IsBoolean()
  estado: boolean;
}
