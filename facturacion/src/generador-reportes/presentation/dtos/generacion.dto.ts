import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class GeneracionReportesDto {
  @ApiProperty({ description: 'Cédula del paciente', maxLength: 20 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d{1,20}$/)
  documento: string;

  @ApiProperty({ description: 'Consecutivo del ingreso', maxLength: 20 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d{1,20}$/)
  ingreso: string;
}
