import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { CtMzMedicamentoSeleccionRes } from '@inn/central-mezclas/application/responses';
import { MedicamentoOrm } from '@inn/orm/inn/central-mezclas';
import { dataToMedicamentoSeleccionRes } from '../factories';
import { Like } from 'typeorm';

@Injectable()
export class FetchMedicamentosByPatternImpl extends BaseSource {
  async execute(pattern: string): Promise<CtMzMedicamentoSeleccionRes[]> {
    if (!pattern?.trim()) throw new Error('El patron de busqueda del medicamento es requerido');

    pattern = pattern.trim();

    const medicamentoRp = this.conn.getRepository(MedicamentoOrm);

    const medicamentos = await medicamentoRp.find({
      where: { nombre: Like(`%${pattern}%`) },
      take: 5,
    });

    return medicamentos.map(dataToMedicamentoSeleccionRes);
  }
}
