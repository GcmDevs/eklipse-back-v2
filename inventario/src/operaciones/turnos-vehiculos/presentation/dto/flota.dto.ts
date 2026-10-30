import {
  OptionalBoolean,
  OptionalText,
  RequiredEnum,
  RequiredInteger,
  RequiredText,
} from '@common/presentation/decorators';
import {
  EstadoItemDotacion,
  RecursoPlazoFlota,
  RespuestaEntregaItem,
  TipoAmbulanciaFlota,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
  ValidateBy,
  ValidateNested,
} from 'class-validator';

function IsObservacionValida(respuestaProp: string, valorNegativo: any) {
  return ValidateBy({
    name: 'isObservacionValida',
    validator: {
      validate(value: unknown, args): boolean {
        const obj = args.object as any;
        const resp = obj[respuestaProp];
        if (resp === valorNegativo) {
          return typeof value === 'string' && value.trim().length > 0;
        }
        return value === undefined || value === null || typeof value === 'string';
      },
      defaultMessage(args): string {
        const obj = args.object as any;
        if (obj[respuestaProp] === valorNegativo) {
          return `${args.property} es obligatoria cuando la respuesta es ${valorNegativo}.`;
        }
        return `${args.property} debe ser un texto o null.`;
      },
    },
  });
}

export class CreateAmbulanciaFlotaDto {
  /** OID del catálogo de vehículos (`VehiculoRead.id`). Internamente se guarda como `vehiculoId`. */
  @RequiredInteger() activoId: number;
  @RequiredText() tipoAmbulancia: TipoAmbulanciaFlota;
}

export class FueraServicioDto {
  @RequiredText() motivo: string;
  @RequiredText() evidencia: string;
}

export class EnServicioDto {
  @OptionalText() observacion?: string;
}

export class CreateTurnoDto {
  @RequiredInteger() vehiculoId: number;
}

export class PatchEntregaItemDto {
  @RequiredEnum(RespuestaEntregaItem)
  respuesta: RespuestaEntregaItem;

  @IsObservacionValida('respuesta', RespuestaEntregaItem.NO)
  observacion?: string | null;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Cada evidencia debe ser un número entero' })
  @IsPositive({ each: true, message: 'Cada evidencia debe ser un entero positivo' })
  evidencias?: number[];
}

export class CerrarIncompletoDto {
  @OptionalBoolean() confirmarIncompleto?: boolean;
}

export class PatchLimpiezaItemDto {
  @IsOptional()
  @IsIn(['C', 'NC', null], { message: 'respuesta debe ser C, NC o null' })
  respuesta: 'C' | 'NC' | null;

  @IsObservacionValida('respuesta', 'NC')
  observacion?: string | null;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Cada evidencia debe ser un número entero' })
  @IsPositive({ each: true, message: 'Cada evidencia debe ser un entero positivo' })
  evidencias?: number[];
}

export class PatchLimpiezaMetaDto {
  @IsOptional() reproceso: boolean | null;
}

export class PatchDotacionItemDto {
  @RequiredEnum(EstadoItemDotacion)
  estado: EstadoItemDotacion;

  @IsOptional()
  @IsInt()
  @Min(0)
  cantidadEncontrada?: number;

  @IsOptional()
  @IsDateString()
  fechaVencObservada?: string;

  @IsObservacionValida('estado', EstadoItemDotacion.NOVEDAD)
  observacion?: string | null;
}

export class ResolverNovedadDto {
  @RequiredText() observacion: string;
}

export class UpsertVencimientoDto {
  @RequiredText() fechaVencimiento: string;
}

export class CrearPlantillaVersionDto {
  estructura: Record<string, unknown>;
}

export class CorreccionEntregaItemDto extends PatchEntregaItemDto {
  @RequiredText() key: string;
}

export class CorreccionEntregaDto {
  @RequiredText() motivo: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorreccionEntregaItemDto)
  cambios: CorreccionEntregaItemDto[];
}

export class CorreccionLimpiezaItemDto extends PatchLimpiezaItemDto {
  @RequiredText() key: string;
}

export class CorreccionLimpiezaDto {
  @RequiredText() motivo: string;
  @IsOptional() reproceso?: boolean | null;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorreccionLimpiezaItemDto)
  cambios: CorreccionLimpiezaItemDto[];
}

export class CorreccionDotacionItemDto extends PatchDotacionItemDto {
  @RequiredText() key: string;
}

export class CorreccionDotacionDto {
  @RequiredText() motivo: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorreccionDotacionItemDto)
  cambios: CorreccionDotacionItemDto[];
}

export class AdminMotivoDto {
  @RequiredText() motivo: string;
}

export class AdminTransferirDto {
  @RequiredInteger() nuevoResponsableId: number;
  @RequiredText() motivo: string;
}

export class AdminExtenderPlazoDto {
  @RequiredEnum(RecursoPlazoFlota) recurso: RecursoPlazoFlota;
  @RequiredInteger() id: number;
  @RequiredInteger({ min: 1, max: 120 }) minutos: number;
  @RequiredText() motivo: string;
}
