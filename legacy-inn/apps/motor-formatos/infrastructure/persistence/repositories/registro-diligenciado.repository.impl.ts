import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import {
  RegistroDiligenciadoFmt,
  RegistroDiligenciadoFmtRead,
  RegistroDiligenciadoRepository,
} from 'apps/motor-formatos/domain';
import { RegistroDiligenciadoMapper } from '../../mappers';
import { RegistroDiligenciadoFmtOrm } from '../orm';

@Injectable()
export class TypeOrmRegistroDiligenciadoRepository
  extends BaseSource
  implements RegistroDiligenciadoRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(RegistroDiligenciadoFmtOrm)
      : this.conn.getRepository(RegistroDiligenciadoFmtOrm);
  }

  async save(registro: RegistroDiligenciadoFmt): Promise<RegistroDiligenciadoFmtRead> {
    const orm = RegistroDiligenciadoMapper.toOrm(registro);
    const saved = await this.repository.save(orm);
    return RegistroDiligenciadoMapper.toView(saved);
  }

  async findById(id: number): Promise<RegistroDiligenciadoFmt | null> {
    const registro = await this.repository.findOne({ where: { id } });
    return registro ? RegistroDiligenciadoMapper.toDomain(registro) : null;
  }

  async findViewById(id: number): Promise<RegistroDiligenciadoFmtRead | null> {
    const registro = await this.repository.findOne({ where: { id } });
    return registro ? RegistroDiligenciadoMapper.toView(registro) : null;
  }

  async findViewByRegActividad(
    registroActividadId: number
  ): Promise<RegistroDiligenciadoFmtRead | null> {
    const registro = await this.repository.findOne({
      where: { registroActividadId: registroActividadId },
    });
    return registro ? RegistroDiligenciadoMapper.toView(registro) : null;
  }

  async findByRegActividad(registroActividadId: number): Promise<RegistroDiligenciadoFmt | null> {
    const registro = await this.repository.findOne({
      where: { registroActividadId: registroActividadId },
    });
    return registro ? RegistroDiligenciadoMapper.toDomain(registro) : null;
  }
}
