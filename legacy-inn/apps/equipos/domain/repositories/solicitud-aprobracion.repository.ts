import { FilterSolicitudDto } from "@equipos/presentation/dto";
import { SolicitudAprobacion } from "../entities";
import { TipoAccionAprobacion } from "../enums";
import { SolicitudRead } from "../read";

export interface SolicitudRepository {
  save(solicitud: SolicitudAprobacion): Promise<SolicitudAprobacion>;
  update(solicitud: SolicitudAprobacion): Promise<SolicitudAprobacion>;
  findById(id: number): Promise<SolicitudAprobacion | null>;
  findViewById(id: number): Promise<SolicitudRead | null>;
  findAllView(filters: FilterSolicitudDto): Promise<[SolicitudRead[], number]>;
  existPendiente(equipoId: number, tipo: TipoAccionAprobacion): Promise<boolean>;
}