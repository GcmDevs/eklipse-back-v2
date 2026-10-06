import { JornadaCode } from '@lgc/die/domain/types/local';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class ConfDietaExtraRequest {
  @IsNumber()
  pacienteId: number;

  @IsNumber()
  jornada: JornadaCode;

  @IsBoolean()
  incluyeDietaFamiliarDesayuno: boolean;

  @IsBoolean()
  incluyeDietaFamiliarAlmuerzo: boolean;

  @IsBoolean()
  incluyeDietaFamiliarCena: boolean;

  @IsBoolean()
  incluyeMeriendaDesayuno: boolean;

  @IsBoolean()
  incluyeMeriendaAlmuerzo: boolean;

  @IsBoolean()
  incluyeMeriendaCena: boolean;

  @IsString()
  tipoMerienda: string;
}
