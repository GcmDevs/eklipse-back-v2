import { EstadoEquipo, OrigenPlanEquipo } from '../enums';
import { FotoItem } from '../value-objects';
import { AccesorioUnidadRead } from './accesorio-unidad.read';
import { PlanActividadRead } from './actividades.read';
import { CompraRead, PlanDefaultTipoEquipoRead, TipoEquipoEmbeddedRead } from './catalogo.read';

export interface PlanEquipoPropioRead {
  origen: OrigenPlanEquipo.PROPIO;
  equipoId: number;
  plan: PlanActividadRead;
}

export interface PlanEquipoHeredadoRead {
  origen: OrigenPlanEquipo.TIPO_EQUIPO;
  tipoEquipoId: number;
  plan: PlanDefaultTipoEquipoRead;
}

export type PlanEquipoRead = PlanEquipoPropioRead | PlanEquipoHeredadoRead;

export interface PlanesEquipoRead {
  mantenimiento: PlanEquipoRead | null;
  calibracion: PlanEquipoRead | null;
}

export interface ResumenEquiposRead {
  totalFiltrado: number;
  porEstado: Record<EstadoEquipo, number>;
  porTipo: Record<string, number>;
}

export class EquipoRead {
  id: number;
  nombre: string;
  codigo: string;
  numeroSerie: string;
  numeroPlaca: string;
  numeroInventario: string;
  tipoActivoId: number;
  tipoActivoNombre: string;
  tipoEquipo: TipoEquipoEmbeddedRead | null;
  accesoriosUnidad: AccesorioUnidadRead[];
  planes: PlanesEquipoRead;
  responsable: any;
  estado: EstadoEquipo;
  localizacion: string;
  createdAt: Date;
  updatedAt: Date;
  fechaPuestaFuncionamiento?: Date | null;
  observaciones?: string | null;
  baja?: EquipoBajaRead | null;
  compra?: CompraRead | null;
  registroFotografico: FotoItem[] | [];
}

export class EquipoMinimalRead {
  id: number;
  nombre: string;
  codigo: string;
  numeroSerie: string;
  numeroPlaca: string;
  numeroInventario: string;
  tipoActivoNombre: string;
  responsable: any;
  estado: EstadoEquipo;
  localizacion: string;
  createdAt: Date;
  updatedAt: Date;
  fechaPuestaFuncionamiento?: Date | null;
  observaciones?: string | null;
}

export interface EquipoBajaRead {
  id: number;
  motivo: string;
  fechaBaja: Date;
  archivoActaId: number;
  usuarioResponsableId: number;
  observaciones?: string | null;
}
