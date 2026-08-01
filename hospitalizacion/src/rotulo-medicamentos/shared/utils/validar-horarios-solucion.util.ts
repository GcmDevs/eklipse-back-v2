import { BadRequestException } from '@nestjs/common';
import { TipoRotulo } from '../types';

export function validarHorariosSolucion(
  tipoRotulo: TipoRotulo,
  preparacion?: string,
  inicio?: string
): void {
  if (tipoRotulo !== TipoRotulo.Solucion) return;

  if (!preparacion) return;
  if (!inicio) throw new BadRequestException('Inicio es obligatorio para una solución');

  if (preparacion > inicio) {
    throw new BadRequestException('La hora de preparación no puede ser posterior al inicio');
  }
}
