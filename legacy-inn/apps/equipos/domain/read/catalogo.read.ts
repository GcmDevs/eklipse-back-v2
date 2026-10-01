import { ArchivoAlmacenadoRead } from '@core/media/domain/read/media.read';
import { CategoriaDocumento, Riesgo } from '../enums';
import { ModeloMinimalRead, ModeloRead } from './marca.read';

export interface ParteCatgRead {
  id: number;
  parte: string;
}

export interface TipoActivoRead {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaseEquipoRead {
  id: number;
  tipoActivoId: number;
  tipoActivoNombre: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubclaseEquipoRead {
  id: number;
  claseId: number;
  claseNombre: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TipoEquipoRead {
  id: number;
  nombre: string;
  modelo: ModeloMinimalRead;
  subclaseId: number;
  subclaseNombre: string;
  tipoActivoId: number;
  tipoActivoNombre: string;
  observaciones?: string;
  activo: boolean;
  fichaTecnica: FichaTecnicaTipoEquipoRead | null;
  documentos: DocumentoTipoEquipoRead[];
  accesorios?: AccesorioTipoEquipoRead[];
  planesDefault?: PlanDefaultTipoEquipoRead[];
  createdAt: Date;
  updatedAt: Date;
}

export type TipoEquipoEmbeddedRead = Omit<TipoEquipoRead, 'accesorios' | 'planesDefault'>;

export interface PeriodoTiempoRead {
  valor: number;
  unidad: string;
}

export interface MedidaTecnicaRead {
  tipo: string;
  valor?: number | null;
  valorMin?: number | null;
  valorMax?: number | null;
  unidadId: number;
  unidadNombre?: string;
  nombre?: string;
}

export interface DatosTecnicosRead {
  medidas: MedidaTecnicaRead[];
}

export interface DatosCalibracionRead {
  variables: { tipo: string; nombre?: string }[];
  codigoUltimaCalibracion?: string | null;
}

export interface ClasificacionBiomedicaRead {
  aplicaRegSanitario: boolean;
  numeroRegSanitario?: string | null;
  expedienteRegSanitario?: string | null;
  prevencion: boolean;
  diagnostico: boolean;
  rehabilitacion: boolean;
  tratamientoMantenimientoDeVida: boolean;
  analisisLaboratorio: boolean;
  riesgo: Riesgo;
}

export interface FichaTecnicaTipoEquipoRead {
  vidaUtil: PeriodoTiempoRead | null;
  reqCalibracion: boolean;
  datosTecnicos: DatosTecnicosRead | null;
  datosCalibracion: DatosCalibracionRead | null;
  dtCalibNormaAplicable: string | null;
  clasificacion: ClasificacionBiomedicaRead | null;
}

export interface ReglaObligatoriedadTipoActivoRead {
  tipoActivoId: number;
  tipoActivoNombre?: string;
  esObligatorio: boolean;
}

export interface TipoDocCategoriaActivoRead {
  id: number;
  nombre: string;
  categoria: CategoriaDocumento;
  reglasTipoActivo: ReglaObligatoriedadTipoActivoRead[];
  esObligatorio?: boolean;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompraRead {
  id: number;
  codigo: string;
  fechaCompra: Date;
  tipoAdquisicion: string;
  proveedorId: number;
  proveedorNombre: string;
  numFactura?: string;
  fechaFactura?: Date;
  fechaFabricacion?: Date;
  aplicaGarantia?: boolean;
  fechVencGarantia?: Date;
  fabricanteId?: number;
  fabricanteNombre?: string;
  documentos: DocumentoTipoEquipoRead[];
  distribuidorId?: number;
  distribuidorNombre?: string;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanDefaultTipoEquipoRead {
  id: number;
  tipoEquipoId: number;
  tipo: string;
  periocidad?: PeriodoTiempoRead | null;
  diasAntNotif?: number;
  realizaExterno: boolean;
  formatoId?: number;
  formatoNombre?: string;
  observaciones?: string;
  activo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentoTipoEquipoRead {
  id: number;
  tipoEquipoId?: number;
  compraId?: number;
  tipoDocumentoId: number;
  tipoDocumentoNombre: string;
  tipoDocumentoCategoria?: string;
  aplica: boolean;
  archivoId?: number;
  archivo?: ArchivoAlmacenadoRead;
  observaciones?: string;
  activo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccesorioTipoEquipoRead {
  id: number;
  tipoEquipoId: number;
  parteId: number;
  parteSnap: string;
  marcaId?: number;
  marcaNombre?: string;
  cantidad: number;
  referencia?: string;
  observaciones?: string;
  activo?: boolean;
}

export interface AuditTipoEquipoRead {
  id: number;
  tipoEquipoId: number;
  tipo: string;
  campo?: string | null;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  sincronizo: boolean;
  usuarioId: number;
  usuarioNombre: string;
  fechaCambio: Date;
  observaciones?: string | null;
  correlationOid: string;
  createdAt: Date;
}
