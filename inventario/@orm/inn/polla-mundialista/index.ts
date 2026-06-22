import { PollaMundialistaOrm } from './polla-mundialista.orm';
import { PollaMundialistaApuestaOrm } from './polla-mundialista-apuesta.orm';

export * from './polla-mundialista.orm';
export * from './polla-mundialista-apuesta.orm';

export const ORM_INN_POLLA_MUNDIALISTA_ENTITIES = [
  // --- AVOID NOWRAP --- //
  PollaMundialistaOrm,
  PollaMundialistaApuestaOrm,
];
