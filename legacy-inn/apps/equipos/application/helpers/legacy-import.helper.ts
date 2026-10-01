import { Marca, Modelo } from '@equipos/domain/entities';
import { EstadoEquipo, UnidadTiempo } from '@equipos/domain/enums';
import { GeneralActivoLegacyView } from '@equipos/infrastructure/persistence/views/external';
import { ResponseMarcaDto, ResponseModeloDto } from '@equipos/presentation/dto/marca.dto';
import { LegacyImportSuggestionsDto } from '@equipos/presentation/dto/equipo-legacy.dto';

export const CAMPOS_REQUERIDOS_USUARIO_BASE = [
  'tipoEquipoId',
  'compraId',
] as const;

export function buildLocalizacionLegacy(view: GeneralActivoLegacyView): string {
  const parts = [view.departamentoNombre, view.areaNombre].filter(Boolean);
  return parts.join(' / ') || view.areaNombre || '';
}

export function buildPeriocidadMantenimientoLegacy(
  tiempoMantenimiento?: number | null,
): { valor: number; unidad: UnidadTiempo } | null {
  if (tiempoMantenimiento == null || tiempoMantenimiento <= 0) {
    return null;
  }
  return { valor: tiempoMantenimiento, unidad: UnidadTiempo.MESES };
}

export function resolveAplicaGarantiaLegacy(
  legacy: GeneralActivoLegacyView,
  fechaVencimientoUsuario?: Date | null,
): boolean {
  if (fechaVencimientoUsuario != null) {
    return !!fechaVencimientoUsuario;
  }
  return !!legacy.aplicaGarantia && !!legacy.fechaVencimientoGarantia;
}

export function mapMarcaToResponse(marca: Marca | null): ResponseMarcaDto | null {
  if (!marca) return null;
  return {
    id: marca.getId.getValor,
    nombre: marca.getNombre,
    descripcion: marca.getDescripcion,
    createdAt: marca.getCreatedAt,
    updatedAt: marca.getUpdatedAt,
  };
}

export function mapModeloToResponse(
  modelo: Modelo | null,
  marca: Marca | null,
): ResponseModeloDto | null {
  if (!modelo) return null;
  return {
    id: modelo.getId.getValor,
    nombre: modelo.getNombre,
    createdAt: modelo.getCreatedAt,
    updatedAt: modelo.getUpdatedAt,
    marca: mapMarcaToResponse(marca),
  };
}

export function buildCamposRequeridosUsuario(): string[] {
  return [...CAMPOS_REQUERIDOS_USUARIO_BASE];
}

export function buildLegacyImportSuggestions(
  legacy: GeneralActivoLegacyView,
  _modelo: Modelo | null,
): LegacyImportSuggestionsDto {
  const periocidad = buildPeriocidadMantenimientoLegacy(legacy.tiempoMantenimiento);

  return {
    nombre: legacy.productoNombre?.trim() ?? null,
    codigo: legacy.productoCodigo ?? null,
    numeroSerie: legacy.numeroSerie ?? null,
    numeroInventario: legacy.numeroPlaca ?? null,
    tipoEquipoId: null,
    responsableId: legacy.responsableId ?? null,
    estado: EstadoEquipo.FUNCIONANDO,
    localizacion: buildLocalizacionLegacy(legacy),
    observaciones: legacy.observaciones ?? null,
    fechaPuestaFuncionamiento: legacy.fechaInstalacion ?? null,
    compra: {
      proveedorId: legacy.proveedorId ?? null,
      numFactura: legacy.numeroFactura ?? null,
      fechaCompra: legacy.fechaCompra ?? null,
      aplicaGarantia: resolveAplicaGarantiaLegacy(legacy),
      fechVencGarantia: legacy.fechaVencimientoGarantia ?? null,
      tipoAdquisicion: null,
      fabricanteId: null,
      distribuidorId: null,
      fabricanteLegacy: legacy.fabricante ?? null,
      distribuidorLegacy: legacy.distribuidor ?? null,
      observaciones: legacy.observaciones ?? null,
    },
    planMantenimiento: periocidad
      ? { plan: { periocidad } }
      : null,
    planCalibracion: null,
    legacyReferencia: {
      generalActivoId: legacy.id,
      activoId: legacy.activoId,
      proveedorTerceroId: legacy.proveedorTerceroId ?? null,
      clasificacionNombre: legacy.clasificacionNombre ?? null,
      tipoManualCode: legacy.tipoManualCodigo ?? null,
      productoPrecioSugerido: legacy.productoPrecioSugerido ?? null,
    },
  };
}
