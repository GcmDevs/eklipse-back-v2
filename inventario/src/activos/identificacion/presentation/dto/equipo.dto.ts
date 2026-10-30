import { OptionalBoolean, OptionalDateString, OptionalEnum, OptionalInteger, OptionalIntegerArray, OptionalNested, OptionalNestedArray, OptionalNestedWhen, OptionalText, RequiredEnum, RequiredInteger, RequiredNested, RequiredText } from '@common/presentation/decorators';
import { PaginationDto } from '@common/presentation/dto';
import { IntersectionType, OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { EstadoEquipo, MotivoCambioEstadoEquipo } from '../../domain/enums';
import { CreatePlanActividadDto } from './actividades';

export class ConfiguracionPlanDto {
  @OptionalBoolean()
  usarPlanTipoEquipo?: boolean;

  @OptionalNestedWhen(
    () => CreatePlanActividadDto,
    (o: ConfiguracionPlanDto) => o.usarPlanTipoEquipo !== true
  )
  plan?: CreatePlanActividadDto;
}

class CreateRegistroFotograficoDto {
  @RequiredInteger({ min: 1 })
  archivoId: number;

  @OptionalText({ maxLength: 300 })
  descripcion?: string;

  @OptionalInteger({ min: 1 })
  orden?: number;

  @OptionalBoolean()
  principal?: boolean;
}

export class AddFotoDto {
  @RequiredInteger({ min: 1 })
  archivoId: number;

  @OptionalText({ maxLength: 300 })
  descripcion?: string;

  @OptionalInteger({ min: 1 })
  orden?: number;

  @OptionalBoolean()
  principal?: boolean;
}

export class UpdateFotoDto {
  @OptionalText({ maxLength: 300 })
  descripcion?: string;

  @OptionalInteger({ min: 1 })
  orden?: number;
}

export class CreateEquipoDto {
  @RequiredText({ maxLength: 255 })
  nombre: string;

  @RequiredText({ maxLength: 255 })
  codigo: string;

  @RequiredText({ maxLength: 255 })
  numeroSerie: string;

  @RequiredText({ maxLength: 255 })
  numeroPlaca: string;

  @OptionalText({ maxLength: 255 })
  numeroInventario?: string | null;

  @RequiredInteger({ min: 1 })
  tipoEquipoId: number;

  @OptionalDateString()
  fechaPuestaFuncionamiento?: Date;

  @OptionalText({ maxLength: 420 })
  observaciones?: string;

  @RequiredInteger({ min: 1 })
  responsableId: number;

  @RequiredEnum(EstadoEquipo)
  estado: EstadoEquipo;

  @RequiredText({ maxLength: 255 })
  localizacion: string;

  @RequiredInteger({ min: 1 })
  compraId: number;

  @OptionalNested(() => ConfiguracionPlanDto)
  planMantenimiento?: ConfiguracionPlanDto;

  @OptionalNested(() => ConfiguracionPlanDto)
  planCalibracion?: ConfiguracionPlanDto;

  @OptionalNestedArray(() => CreateRegistroFotograficoDto)
  registroFotografico?: CreateRegistroFotograficoDto[];
}

export class ComplementoImportLegacyDto extends IntersectionType(
  PickType(CreateEquipoDto, ['tipoEquipoId', 'compraId'] as const),
  PartialType(OmitType(CreateEquipoDto, ['numeroPlaca', 'tipoEquipoId', 'compraId'] as const))
) { }

export class ImportEquipoLegacyDto {
  @RequiredText({ maxLength: 255 })
  numeroPlaca: string;

  @RequiredNested(() => ComplementoImportLegacyDto)
  complemento: ComplementoImportLegacyDto;
}

export class UpdateEquipoDto extends PartialType(
  OmitType(CreateEquipoDto, [
    'nombre',
    'codigo',
    'numeroPlaca',
    'numeroSerie',
    'estado',
    'responsableId',
    'planMantenimiento',
    'planCalibracion',
    'registroFotografico',
  ] as const)
) { }

export class FilterEquipoDto extends PaginationDto {
  @OptionalEnum(EstadoEquipo)
  estado?: EstadoEquipo;

  @OptionalInteger({ min: 1 })
  tipoActivoId?: number;

  @OptionalIntegerArray({ min: 1 })
  responsablesIds?: number[];

  @OptionalInteger({ min: 1 })
  areaId?: number;
}

export class DarDeBajaEquipoDto {
  @RequiredInteger({ min: 1 })
  archivoActaId: number;

  @RequiredText({ maxLength: 300 })
  motivo: string;

  @OptionalText({ maxLength: 500 })
  observaciones?: string;

  @OptionalDateString()
  fechaBaja?: Date;
}

export class FilterResumenEquipoDto extends OmitType(FilterEquipoDto, ['page', 'limit'] as const) { }
