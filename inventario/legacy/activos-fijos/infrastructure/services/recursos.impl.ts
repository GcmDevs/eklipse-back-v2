import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ActivoOrm } from '@inn/lgc/afn/orm/inn/activos-fijos';
import {
  afnActivoOrmToAfnActivoRecFactory,
  afnIngresoOrmToAfnInfoPacienteFactory,
} from '../factories';
import { AfnActivoRec, afnInfoPacienteRes } from '@inn/lgc/afn/application/responses';
import { IngresoOrm } from '@inn/lgc/afn/orm/gen';

@Injectable()
export class AfnRecursosImpl extends BaseSource {
  public async fetchActivos(pattern: string): Promise<AfnActivoRec[]> {
    try {
      const repository = this.conn.getRepository(ActivoOrm);

      const result = await repository.find({
        where: { placa: Like(`%${pattern}%`) },
        relations: ['producto', 'informacionAdicional', 'responsable'],
        take: 5,
      });

      return result.map(r => afnActivoOrmToAfnActivoRecFactory(r));
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async fetchPacientes(pattern: string): Promise<afnInfoPacienteRes[]> {
    try {
      const repository = this.conn.getRepository(IngresoOrm);

      const result = await repository
        .createQueryBuilder('ingreso')
        .leftJoinAndSelect('ingreso.paciente', 'paciente')
        .leftJoinAndSelect('ingreso.contrato', 'contrato')
        .leftJoinAndSelect('contrato.tercero', 'tercero')
        .where('CAST(ingreso.id AS NVARCHAR) LIKE :ingreso', { ingreso: `%${pattern}%` })
        .take(5)
        .getMany();

      return result.map(r => afnIngresoOrmToAfnInfoPacienteFactory(r));
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
