import { DOMAIN_EVENT_DISPATCHER, DomainEventBase, EventDispatcher, TransactionManager } from "@common/application/services";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseSource } from "../../services";
import { TypeOrmTransactionContext } from "./typeorm-transaction-context";


@Injectable()
export class TypeOrmTransactionManagerImpl
  extends BaseSource
  implements TransactionManager {

  @Optional()
  @Inject(DOMAIN_EVENT_DISPATCHER)
  private readonly dispatcher: EventDispatcher;

  async transactional<T>(
    work: () => Promise<T>,
    aggregates?: Array<{ pullEvents(): DomainEventBase[] }>,
    correlationId?: string
  ): Promise<T> {
    if (TypeOrmTransactionContext.isInTransaction()) {
      const result = await work();
      if (aggregates?.length && this.dispatcher) {
        const events = aggregates.flatMap(agg => agg.pullEvents());
        if (events.length) {
          if (correlationId) events.forEach(ev => { ev.correlationId = correlationId; });
          await this.dispatcher.dispatch(events);
        }
      }
      return result;
    }

    const qr = this.conn.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    return TypeOrmTransactionContext.run(qr, async () => {
      try {
        const result = await work();

        if (aggregates?.length && this.dispatcher) {
          const events = aggregates.flatMap(agg => agg.pullEvents());
          if (events.length) {
            if (correlationId) {
              events.forEach(ev => { ev.correlationId = correlationId; });
            }
            await this.dispatcher.dispatch(events);
          }
        }

        await qr.commitTransaction();
        return result;
      } catch (e) {
        if (this.isInTransaction()) {
          await qr.rollbackTransaction();
        }
        throw e;
      } finally {
        await qr.release();
      }
    });
  }

  //TODO: CUANDO SE LE HAGAN CAMBIOS A ACTIVOS SE COMBINAN LA FUNCIONALIDAD DE transactional()
  //CON TRANSACTIONALON, PORQUE EN LA PRIMERA VERSION SE OMITIERON LAS POSIBILADES DE
  //MULTI-TENANT O DE BUSCAR EN OTRAS CONEXIONES
  async transactionalOn<T>(dataSource: DataSource, work: () => Promise<T>): Promise<T> {
    const active = TypeOrmTransactionContext.getQueryRunner();
    if (active?.connection === dataSource) {
      return work();
    }

    const qr = dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    return TypeOrmTransactionContext.run(qr, async () => {
      try {
        const result = await work();
        await qr.commitTransaction();
        return result;
      } catch (e) {
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    });
  }

  async nonTransactional<T>(work: () => Promise<T>): Promise<T> {
    return TypeOrmTransactionContext.run(undefined, work);
  }

  isInTransaction(): boolean {
    return TypeOrmTransactionContext.isInTransaction();
  }
}
