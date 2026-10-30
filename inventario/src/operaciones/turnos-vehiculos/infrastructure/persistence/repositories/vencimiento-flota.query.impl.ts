import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { EstadoDeclaracion, EstadoDotacion, EstadoEntrega } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { TipoVencimientoFlota } from '@inn/operaciones/turnos-vehiculos/domain/policies/vencimiento-job.policy';
import {
  PlazoVencimientoActual,
  ProximoVencimientoRow,
  VencimientoFlotaQuery,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Injectable } from '@nestjs/common';
import { AmbDotacionOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-dotacion.orm';
import { AmbEntregaDeclOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-entrega-decl.orm';
import { AmbEntregaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-entrega.orm';
import { FindOptionsWhere, IsNull, LessThanOrEqual, Not, ObjectLiteral, Repository } from 'typeorm';

/** `now` presente: solo vencidas a esa fecha. Ausente: toda fila con plazo. */
const plazoWhere = (now?: Date) => (now ? LessThanOrEqual(now) : Not(IsNull()));

/**
 * Una sola definición de "pendiente" por tipo, usada por listados y por la revalidación
 * puntual de un job: lo que se programa y lo que se ejecuta nunca pueden divergir.
 */
const wherePendiente = {
  DOTACION: (now?: Date): FindOptionsWhere<AmbDotacionOrm> => ({
    bloqueada: false,
    estado: EstadoDotacion.EN_CURSO,
    fechaLimite: plazoWhere(now),
  }),
  ENTREGA_DECL: (now?: Date): FindOptionsWhere<AmbEntregaDeclOrm> => ({
    estado: EstadoDeclaracion.EN_EDICION,
    limiteEdicion: plazoWhere(now),
  }),
  ENTREGA_RECEPCION: (now?: Date): FindOptionsWhere<AmbEntregaOrm> => ({
    estado: EstadoEntrega.ABIERTA,
    fechaEntrega: Not(IsNull()),
    turnoEntranteId: IsNull(),
    limiteInicioRecepcion: plazoWhere(now),
  }),
  ENTREGA_CIERRE: (now?: Date): FindOptionsWhere<AmbEntregaOrm> => ({
    estado: EstadoEntrega.ABIERTA,
    fechaEntrega: IsNull(),
    turnoEntranteId: IsNull(),
    cierreAutomaticoEn: plazoWhere(now),
  }),
};

@Injectable()
export class TypeOrmVencimientoFlotaQuery extends BaseSource implements VencimientoFlotaQuery {
  private repoOf<T extends ObjectLiteral>(entity: new () => T): Repository<T> {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(entity) : this.conn.getRepository(entity);
  }

  async findVencidos(now: Date): Promise<ProximoVencimientoRow[]> {
    return this.collect(now);
  }

  async findPendientes(): Promise<ProximoVencimientoRow[]> {
    return this.collect(undefined);
  }

  async findPlazoActual(
    tipo: TipoVencimientoFlota,
    entidadId: number,
  ): Promise<PlazoVencimientoActual> {
    switch (tipo) {
      case 'DOTACION': {
        const row = await this.repoOf(AmbDotacionOrm).findOne({
          where: { ...wherePendiente.DOTACION(), id: entidadId },
        });
        return { pendiente: !!row, fechaLimite: row?.fechaLimite ?? null };
      }
      case 'ENTREGA_DECL': {
        const row = await this.repoOf(AmbEntregaDeclOrm).findOne({
          where: { ...wherePendiente.ENTREGA_DECL(), id: entidadId },
        });
        return { pendiente: !!row, fechaLimite: row?.limiteEdicion ?? null };
      }
      case 'ENTREGA_RECEPCION': {
        const row = await this.repoOf(AmbEntregaOrm).findOne({
          where: { ...wherePendiente.ENTREGA_RECEPCION(), id: entidadId },
        });
        return { pendiente: !!row, fechaLimite: row?.limiteInicioRecepcion ?? null };
      }
      case 'ENTREGA_CIERRE': {
        const row = await this.repoOf(AmbEntregaOrm).findOne({
          where: { ...wherePendiente.ENTREGA_CIERRE(), id: entidadId },
        });
        return { pendiente: !!row, fechaLimite: row?.cierreAutomaticoEn ?? null };
      }
      default:
        return { pendiente: false, fechaLimite: null };
    }
  }

  async bloquear(tipo: TipoVencimientoFlota, entidadId: number): Promise<void> {
    if (!TypeOrmTransactionContext.getQueryRunner()) return;
    const entity =
      tipo === 'DOTACION'
        ? AmbDotacionOrm
        : tipo === 'ENTREGA_DECL'
          ? AmbEntregaDeclOrm
          : AmbEntregaOrm;
    await this.repoOf(entity as new () => { id: number })
      .createQueryBuilder('x')
      .select('x.id')
      .where('x.id = :id', { id: entidadId })
      .setLock('pessimistic_write')
      .getOne();
  }

  private async collect(now?: Date): Promise<ProximoVencimientoRow[]> {
    const rows: ProximoVencimientoRow[] = [];

    const dotaciones = await this.repoOf(AmbDotacionOrm).find({ where: wherePendiente.DOTACION(now) });
    for (const d of dotaciones) {
      rows.push({ tipo: 'DOTACION', entidadId: d.id, fechaLimite: d.fechaLimite });
    }

    const decls = await this.repoOf(AmbEntregaDeclOrm).find({ where: wherePendiente.ENTREGA_DECL(now) });
    for (const d of decls) {
      rows.push({ tipo: 'ENTREGA_DECL', entidadId: d.id, fechaLimite: d.limiteEdicion });
    }

    const recepciones = await this.repoOf(AmbEntregaOrm).find({
      where: wherePendiente.ENTREGA_RECEPCION(now),
    });
    for (const e of recepciones) {
      rows.push({ tipo: 'ENTREGA_RECEPCION', entidadId: e.id, fechaLimite: e.limiteInicioRecepcion });
    }

    const cierres = await this.repoOf(AmbEntregaOrm).find({ where: wherePendiente.ENTREGA_CIERRE(now) });
    for (const e of cierres) {
      rows.push({ tipo: 'ENTREGA_CIERRE', entidadId: e.id, fechaLimite: e.cierreAutomaticoEn });
    }

    return rows;
  }
}
