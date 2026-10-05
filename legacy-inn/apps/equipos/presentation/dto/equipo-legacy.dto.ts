import { EstadoBusquedaEquipo, EstadoEquipo, TipoAdquisicion } from '@equipos/domain/enums';
import { ConfiguracionPlanDto } from './equipo.dto';
import { ResponseMarcaDto, ResponseModeloDto } from './marca.dto';

export interface ResponseLegacyBaseDto {
  id: number;
  codigo: string;
  nombre: string;
}

export interface ResponseActivoLegacyDto {
  id: number;
  numPlaca: string;
  fechaCompra: Date;
}

export interface ResponseResponsableLegacyDto extends ResponseLegacyBaseDto {}

export interface ResponseAreaLegacyDto extends ResponseLegacyBaseDto {}

export interface ResponseDepartamentoLegacyDto extends ResponseLegacyBaseDto {}

export interface ResponseProductoLegacyDto extends ResponseLegacyBaseDto {
  precioSugerido: number;
}

export interface ResponseClasificacionLegacyDto {
  id: number;
  nombre: string;
}

export interface ResponseProveedorLegacyDto extends ResponseLegacyBaseDto {
  direccion: string;
  telefono1: string;
  telefono2: string;
  terceroId: number;
}

export interface ResponseGeneralActivoLegacyDto {
  id: number;
  numPlaca: string;
  numSerie: string;
  observaciones: string;
  garantia: boolean;
  fechaVectoGarantia: Date;
  fechaInstalacion: Date;
  mantenimiento: number;
  numeroFactura: string;
  tipoManualCode: string;
  modeloLegacyNombre: string;
  marcaLegacyNombre: string;
  marca: ResponseMarcaDto;
  modelo: ResponseModeloDto;
  fabricante: string;
  distribuidor: string;
  fechaCompra: Date;

  activo: ResponseActivoLegacyDto;
  responsable: ResponseResponsableLegacyDto;
  area: ResponseAreaLegacyDto;
  departamento: ResponseDepartamentoLegacyDto;
  producto: ResponseProductoLegacyDto;
  clasificacion: ResponseClasificacionLegacyDto;
  proveedor: ResponseProveedorLegacyDto;
}

export interface LegacyImportCompraSuggestionsDto {
  proveedorId: number | null;
  numFactura: string | null;
  fechaCompra: Date | null;
  aplicaGarantia: boolean;
  fechVencGarantia: Date | null;
  tipoAdquisicion: TipoAdquisicion | null;
  fabricanteId: number | null;
  distribuidorId: number | null;
  fabricanteLegacy: string | null;
  distribuidorLegacy: string | null;
  observaciones: string | null;
}

export interface LegacyReferenciaDto {
  generalActivoId: number;
  activoId: number;
  proveedorTerceroId: number | null;
  clasificacionNombre: string | null;
  tipoManualCode: string | null;
  productoPrecioSugerido: number | null;
}

export interface LegacyImportSuggestionsDto {
  nombre: string | null;
  codigo: string | null;
  numeroSerie: string | null;
  numeroInventario: string | null;
  tipoEquipoId: number | null;
  responsableId: number | null;
  estado: EstadoEquipo;
  localizacion: string | null;
  observaciones: string | null;
  fechaPuestaFuncionamiento: Date | null;
  compra: LegacyImportCompraSuggestionsDto;
  planMantenimiento: ConfiguracionPlanDto | null;
  planCalibracion: ConfiguracionPlanDto | null;
  legacyReferencia: LegacyReferenciaDto;
}

export interface LegacyCatalogoEquivalenciasDto {
  marca: ResponseMarcaDto | null;
  modelo: ResponseModeloDto | null;
  proveedorExiste: boolean;
  responsableExiste: boolean;
}

export interface ResponseGeneralActivoLegacyEnrichedDto {
  legacy: ResponseGeneralActivoLegacyDto;
  catalogo: LegacyCatalogoEquivalenciasDto;
  valoresSugeridos: LegacyImportSuggestionsDto;
  camposRequeridosUsuario: string[];
  estado: EstadoBusquedaEquipo;
}
