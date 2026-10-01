import { Type } from 'class-transformer';
import { MotivoDevolucionSumPacCode } from './../../domain/types';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';

export class DevolucionSumPacDto {
  @IsNumber()
  documentoId: number;

  @IsNumber()
  motivoCode: MotivoDevolucionSumPacCode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetDevDto)
  detalle: DetDevDto[];
}

export class DetDevDto {
  @IsNumber()
  suministroId: number;

  @IsNumber()
  estadoCode: 1 | 2 | 3;
}
