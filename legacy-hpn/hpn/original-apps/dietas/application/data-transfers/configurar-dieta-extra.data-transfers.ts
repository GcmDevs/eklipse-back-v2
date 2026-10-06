import { JornadaCode } from '@lgc/die/domain/types/local';

export interface ConfDietExtraPayload {
  pacienteId: number;
  jornada: JornadaCode;
  incluyeDietaFamiliarDesayuno: boolean;
  incluyeDietaFamiliarAlmuerzo: boolean;
  incluyeDietaFamiliarCena: boolean;
  incluyeMeriendaDesayuno: boolean;
  incluyeMeriendaAlmuerzo: boolean;
  incluyeMeriendaCena: boolean;
  tipoMerienda: string;
}

export interface ConfDietExtraDto extends Omit<ConfDietExtraPayload, 'jornada' | 'estanciaId'> {
  id: number;
}
