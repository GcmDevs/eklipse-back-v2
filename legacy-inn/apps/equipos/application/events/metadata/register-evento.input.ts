import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import { MetadataEventoMap } from './metadata-event';

export type RegisterEventoAuditInput<T extends TipoEventoAuditEquipo> = {
  equipoId: number;
  tipo: T;
  descripcion: string;
  autor: {
    id: number | null;
    nombre: string;
  };
  metadata: MetadataEventoMap[T];
  referenciaEntidad?: string;
  referenciaId?: number;
  eventoOrigenId?: number;
  correlationId?: string;
  secuencia?: number;
};
