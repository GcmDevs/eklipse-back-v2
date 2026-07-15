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
  FormaFarmaceuticaCode,
  LINEAS,
  LineaCode,
  PrioridadCode,
  TiempoAdminCode,
  ViaCode,
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
  @IsOptional()
  tiempoAdmin: number;

  @ApiProperty({ enum: [1, 2] })
  @Type(() => Number)
  @IsIn([1, 2])
  @IsOptional()
  uniMedTiempoAdminCode: TiempoAdminCode;

  @ApiProperty({ enum: [1, 2, 3, 4, 5, 6, 7] })
  @Type(() => Number)
  @IsIn([1, 2, 3, 4, 5, 6, 7])
  viaAdministracionCode: ViaAdministracionCode;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  fechaAplicacion: Date;
}

export class CtMzNutricionParenteralPayload {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aa10Perc?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aa15Perc?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aaPed?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  glutamina?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  po4?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dad50Perc?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dad10Perc?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tabperioK?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tabperioNa?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tabperioCa?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tabperioMg?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  etPed?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  etAdu?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vhid?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vipPed?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vipAdu?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agua?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lip20Perc?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pesAjust?: number;

  @ApiProperty({ required: false, enum: [1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2])
  viaCode?: ViaCode;
}

export class CtMzReempaqueReenvasePayload {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  medicamentoId: number;

  @ApiProperty({ enum: [1, 2, 3, 4] })
  @Type(() => Number)
  @IsIn([1, 2, 3, 4])
  formaFarmaceuticaCode: FormaFarmaceuticaCode;

  @ApiProperty({ enum: [5, 6, 7] })
  @Type(() => Number)
  @IsIn([5, 6, 7])
  viaAdministracionCode: ViaAdministracionCode;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  laboratorio: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cantidadAdecuar: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lote: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  fechaVencimiento: Date;
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

  @ApiProperty({ required: false, type: CtMzSeleccionPayload, isArray: true })
  @ValidateIf(payload =>
    [LINEAS.ONCOLOGICO.getCode(), LINEAS.NO_ONCOLOGICO.getCode()].includes(payload.lineaCode)
  )
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CtMzSeleccionPayload)
  seleccion?: CtMzSeleccionPayload[];

  @ApiProperty({ required: false, type: CtMzNutricionParenteralPayload })
  @ValidateIf(payload => payload.lineaCode === LINEAS.NUTRICION_PARENTERAL.getCode())
  @IsDefined()
  @ValidateNested()
  @Type(() => CtMzNutricionParenteralPayload)
  nutricionParenteral?: CtMzNutricionParenteralPayload;

  @ApiProperty({ required: false, type: CtMzReempaqueReenvasePayload })
  @ValidateIf(payload => payload.lineaCode === LINEAS.REEMPAQUE_REENVASE.getCode())
  @IsDefined()
  @ValidateNested()
  @Type(() => CtMzReempaqueReenvasePayload)
  reempaqueReenvase?: CtMzReempaqueReenvasePayload;
}
