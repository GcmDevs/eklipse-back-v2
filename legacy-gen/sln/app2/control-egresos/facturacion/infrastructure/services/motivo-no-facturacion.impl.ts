import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { MOTIVO_NO_FACTURACION_VALUES } from '@sln/c-types/gen';
@Injectable()
export class MotivoNoFacturacionImpl extends BaseSource {
  // Lista de motivos válidos basada en MotivoNoFacturacionCode (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7)
  private validMotivoCodes: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

  // Método para validar el motivo
  async validateMotivo(motivo: number): Promise<boolean> {
    // Verificar si el motivo es un número y está dentro del rango válido
    if (typeof motivo !== 'number' || !Number.isInteger(motivo)) {
      return false;
    }

    // Verificar si el motivo está en la lista de códigos válidos
    return this.validMotivoCodes.includes(motivo);
  }

  public async getMotivoNoFacturacion() {
    return MOTIVO_NO_FACTURACION_VALUES;
  }
}
