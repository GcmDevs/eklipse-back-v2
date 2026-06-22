import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  LineaCode,
  PrioridadCode,
  TiempoAdminCode,
  UnidadCode,
  VehiculoCode,
  ViaAdministracionCode,
} from '@inn/types/inn/central-mezclas';

export class CtMzPacienteExternoPayload {
  @ApiProperty({ required: false })
  @ValidateIf(payload => !payload.pacienteId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombreCompleto?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  numeroDocumento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cama?: string;
}

export class CtMzSeleccionPayload {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  medicamentoId: number;

  @ApiProperty({ enum: [1, 2, 3] })
  @Type(() => Number)
  @IsIn([1, 2, 3])
  unidadCode: UnidadCode;

  @ApiProperty({ enum: [1, 2, 3] })
  @Type(() => Number)
  @IsIn([1, 2, 3])
  vehiculoCode: VehiculoCode;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  concentracion: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volumen: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tiempoAdmin: number;

  @ApiProperty({ enum: [1, 2] })
  @Type(() => Number)
  @IsIn([1, 2])
  uniMedTiempoAdminCode: TiempoAdminCode;

  @ApiProperty({ enum: [1, 2, 3, 4] })
  @Type(() => Number)
  @IsIn([1, 2, 3, 4])
  viaAdministracionCode: ViaAdministracionCode;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  fechaAplicacion: Date;
}

export class CtMzSolicitudPayload {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pacienteExternoId?: number;

  @ApiProperty({ required: false, type: CtMzPacienteExternoPayload })
  @ValidateIf(payload => !payload.pacienteExternoId)
  @IsDefined()
  @ValidateNested()
  @Type(() => CtMzPacienteExternoPayload)
  pacienteExterno?: CtMzPacienteExternoPayload;

  @ApiProperty({ enum: [1, 2, 3, 4] })
  @Type(() => Number)
  @IsIn([1, 2, 3, 4])
  lineaCode: LineaCode;

  @ApiProperty({ enum: [1, 2, 3, 4] })
  @Type(() => Number)
  @IsIn([1, 2, 3, 4])
  prioridadCode: PrioridadCode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;

  @ApiProperty({ type: CtMzSeleccionPayload, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CtMzSeleccionPayload)
  seleccion: CtMzSeleccionPayload[];
}
