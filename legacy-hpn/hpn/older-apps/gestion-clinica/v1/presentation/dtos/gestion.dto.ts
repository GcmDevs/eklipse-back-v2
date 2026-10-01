import { GcmContextCode } from '@common/domain/types';
import {
  MotivoCancelacionTrasladoTypeCode,
  MotivoCancelacionTypeCode,
  TipoTrasladoItemTypeCode,
  TipoTrasladoTypeCode,
} from '@hpn/gestion-clinica/v1/domain/types';
import { TipoSoporteVitalTypeCode } from '@hpn/gestion-clinica/v1/domain/types/tipo-soperte-vital';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class EntidadDto {
  @IsNumber()
  id: number;
  @IsString()
  nombre: string;
}
export class TrasladoAmbulanciaDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EntidadDto)
  motTraslado: EntidadDto;

  @IsOptional()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EntidadDto)
  servicioDestino: EntidadDto;

  @IsNumber()
  @IsOptional()
  lugarOrigenId: number;

  @IsString()
  @IsOptional()
  lugarOrigen: string;

  @IsNumber()
  deptoOrigenId: number;

  @IsNumber()
  municipioOrigenId: number;

  @IsNumber()
  direccionOrigen: string;

  @IsNumber()
  @IsOptional()
  lugarDestinoId: number;

  @IsString()
  lugarDestino: string;

  @IsNumber()
  deptoDestinoId: number;

  @IsNumber()
  municipioDestinoId: number;

  @IsString()
  @Length(0, 100)
  direccionDestino: string;

  @IsNumber()
  tipoTraslado: TipoTrasladoTypeCode;

  @IsNumber()
  tipo: TipoTrasladoItemTypeCode;

  @IsNumber()
  @IsArray()
  @ValidateNested({ each: true })
  tipoSoportes: TipoSoporteVitalTypeCode[];

  @IsString()
  @IsOptional()
  otroSoporteVital: string;

  @IsString()
  @Length(0, 500)
  @IsOptional()
  observaciones: string;

  @IsBoolean()
  epp: boolean;

  @IsDateString()
  fechaHoraTraslado: Date;
}

export class CreateGestionDto {
  @IsString()
  title: string;

  @IsString()
  @Length(0, 500)
  @IsOptional()
  content: string;

  @IsNumber()
  priority: number;

  @IsNumber()
  patient: number;

  @IsNumber()
  consecutive: number;

  @IsNumber()
  area: number;

  @IsOptional()
  solicitudAmbulancia?: TrasladoAmbulanciaDto;
}

export class ReasignarDto {
  @IsNumber()
  gestionId: number;
  @IsNumber()
  areaId: number;
  @IsString()
  @Length(0, 500)
  @IsOptional()
  observacion: string;
}
export class CancelarGestionDto {
  @IsNumber()
  areaId: number;

  @IsNumber()
  gestionId: number;

  @IsString()
  @IsOptional()
  contextoCode: GcmContextCode;

  @IsNumber()
  isTipoGestion: number;

  @IsNumber()
  @IsOptional()
  motivoCancelacionNCode: MotivoCancelacionTypeCode;

  @IsNumber()
  @IsOptional()
  motivoCancelacionTCode: MotivoCancelacionTrasladoTypeCode;

  @IsString()
  @Length(0, 300)
  observacion: string;
}
