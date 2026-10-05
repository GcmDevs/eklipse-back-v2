import { IsNumber } from 'class-validator';

export class AsignarPacienteTemporalDto {
  @IsNumber()
  centroId: number;

  @IsNumber()
  subgrupoDestinoId: number;

  @IsNumber()
  ingresoId: number;
}
