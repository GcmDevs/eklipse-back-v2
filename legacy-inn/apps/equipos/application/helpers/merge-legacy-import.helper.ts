import { BadInputError } from '@common/domain/errors';
import { EstadoEquipo } from '@equipos/domain/enums';
import { LegacyImportSuggestionsDto } from '@equipos/presentation/dto/equipo-legacy.dto';
import {
  ComplementoImportLegacyDto,
  ConfiguracionPlanDto,
  CreateEquipoDto,
} from '@equipos/presentation/dto/equipo.dto';
import { LegacyDataMerger } from '../services/merger';

export interface LegacyImportMergedPayload {
  nombre: string;
  codigo: string;
  numeroSerie: string;
  numeroPlaca: string;
  numeroInventario: string | null;
  tipoEquipoId: number;
  fechaPuestaFuncionamiento?: Date;
  observaciones?: string;
  responsableId: number;
  estado: EstadoEquipo;
  localizacion: string;
  compraId: number;
  planMantenimiento?: ConfiguracionPlanDto;
  planCalibracion?: ConfiguracionPlanDto;
  registroFotografico?: CreateEquipoDto['registroFotografico'];
}

export function mergeLegacyImportPayload(
  numeroPlaca: string,
  suggestions: LegacyImportSuggestionsDto,
  complemento: ComplementoImportLegacyDto,
): LegacyImportMergedPayload {
  const merger = new LegacyDataMerger();

  const merged: LegacyImportMergedPayload = {
    nombre: merger.getValue(complemento.nombre, suggestions.nombre, 'nombre', true)!,
    codigo: merger.getValue(complemento.codigo, suggestions.codigo, 'codigo', true)!,
    numeroSerie: merger.getValue(complemento.numeroSerie, suggestions.numeroSerie, 'numeroSerie', true)!,
    numeroPlaca,
    numeroInventario: merger.getValue(
      complemento.numeroInventario,
      suggestions.numeroInventario,
      'numeroInventario',
      false,
    ),
    tipoEquipoId: complemento.tipoEquipoId,
    compraId: complemento.compraId,
    fechaPuestaFuncionamiento: merger.getValue(
      complemento.fechaPuestaFuncionamiento,
      suggestions.fechaPuestaFuncionamiento,
      'fechaPuestaFuncionamiento',
      false,
    ) ?? undefined,
    observaciones: merger.getValue(
      complemento.observaciones,
      suggestions.observaciones,
      'observaciones',
      false,
    ) ?? undefined,
    responsableId: merger.getValue(
      complemento.responsableId,
      suggestions.responsableId,
      'responsableId',
      true,
    )!,
    estado: merger.getValue(complemento.estado, suggestions.estado, 'estado', true)!,
    localizacion: merger.getValue(
      complemento.localizacion,
      suggestions.localizacion,
      'localizacion',
      false,
    ) ?? undefined,
    planMantenimiento: complemento.planMantenimiento ?? suggestions.planMantenimiento ?? undefined,
    planCalibracion: complemento.planCalibracion ?? suggestions.planCalibracion ?? undefined,
    registroFotografico: complemento.registroFotografico,
  };

  merger.validateAndThrow();

  if (merged.estado === EstadoEquipo.DE_BAJA) {
    throw new BadInputError('No se puede importar un equipo en estado DE BAJA');
  }

  return merged;
}
