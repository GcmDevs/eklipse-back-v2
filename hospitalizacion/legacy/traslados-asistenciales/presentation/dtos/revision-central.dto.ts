import { ApiProperty } from '@nestjs/swagger';
import { MotivoFallidoTypeCode } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { GcmContextCode } from '@common/domain/types';

export class CreateRevisionCentralDto {
  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;

  @ApiProperty({ description: 'ID del traslado' })
  @IsNumber()
  trasladoId: number;

  @ApiProperty({ description: 'Indica si la revisión fue aprobada' })
  @IsBoolean()
  aprobado: boolean;

  /*   @ApiProperty({ description: 'Código del motivo de fallo (si aplica)' })
  @IsNumber()
  motivo: MotivoFallidoTypeCode; */

  @ApiProperty({ description: 'Observaciones de la revisión' })
  @IsString()
  observacion: string;
}

export class CancelTrasladoDto {
  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;

  @ApiProperty({ description: 'ID del traslado a cancelar' })
  @IsNumber()
  trasladoId: number;

  @ApiProperty({ description: 'Observaciones de la cancelación' })
  @IsString()
  observacion: string;

  @ApiProperty({ description: 'Código del motivo de cancelación' })
  @IsNumber()
  motivoCode: MotivoFallidoTypeCode;
}
