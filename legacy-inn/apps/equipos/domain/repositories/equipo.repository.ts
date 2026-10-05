import { BaseRepository } from '@common/domain/repositories';
import { FiltersEquipos, ResultFindEquipoGlobalSystem } from '@equipos/application';
import { Equipo, EquipoBaja } from '../entities';
import { TipoActividad } from '../enums';
import { EquipoRead, ResumenEquiposRead } from '../read/equipo.read';

export interface EquiposRepository extends BaseRepository<Equipo, EquipoRead> {
  findViewByPlaca(numeroPlaca: string): Promise<EquipoRead | null>;
  findGeneralActivoByNumeroPlaca(numeroPlaca: string): Promise<any | null>;
  findInGlobalSystemByPlaca(numeroPlaca: string): Promise<ResultFindEquipoGlobalSystem>;
  alreadyExistActivoLegacy(numeroPlaca: string): Promise<boolean>;
  alreadyExist(numeroPlaca: string): Promise<boolean>;
  findAllAndCount(
    page: number,
    limit: number,
    filters: FiltersEquipos
  ): Promise<[EquipoRead[], number]>;
  updatePlan(equipo: Equipo, tipo: TipoActividad): Promise<Equipo>;
  updateRegistroFotografico(equipo: Equipo): Promise<Equipo | null>;
  changeEstado(equipo: Equipo): Promise<void>;
  findIdsByTipoEquipoId(tipoEquipoId: number): Promise<number[]>;
  findIdsByTipoEquipoIdSinActividad(tipoEquipoId: number): Promise<number[]>;
  getResumen(filters?: FiltersEquipos): Promise<ResumenEquiposRead>;
  saveBaja(equipo: Equipo, baja: EquipoBaja): Promise<void>;
}
