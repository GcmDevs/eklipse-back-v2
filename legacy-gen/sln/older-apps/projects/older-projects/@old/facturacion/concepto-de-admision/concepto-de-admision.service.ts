import { Injectable } from '@nestjs/common';
import { IMedicamentos } from './interface';
import { ConceptoRepository } from './repository';

@Injectable()
export class ConceptoDeAdmisionService {
  constructor(private readonly repository: ConceptoRepository) {}

  async getmedicamentos(ingreso: string, tipo: string) {
    try {
      let data = null;
      if (tipo === 'null') {
        data = await this.repository.getmedicamentos(ingreso);
      } else {
        data = await this.repository.getmedicamentosTipos(ingreso, tipo);
      }
      if (data && data.length > 0) {
        return {
          success: true,
          message: 'Lista de Medicamentos del paciente',
          data,
        };
      } else {
        return {
          success: false,
          message: 'Este Paciente no tiene Medicamentos',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Este Paciente no tiene Medicamentos',
      };
    }
  }

  updatemedicamento(medicamentos: IMedicamentos[]) {
    return this.repository.updateMedicamentos(medicamentos);
  }
}
