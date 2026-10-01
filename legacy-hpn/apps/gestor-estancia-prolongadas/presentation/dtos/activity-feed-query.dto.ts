import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export type ActivityFeedSeverity = 'info' | 'warning' | 'critical' | 'success';

export class ActivityFeedQueryDto {
  @ApiPropertyOptional({ description: 'Numero maximo de eventos a retornar', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtro por severidad' })
  @IsOptional()
  @IsIn(['info', 'warning', 'critical', 'success'])
  severity?: ActivityFeedSeverity;

  @ApiPropertyOptional({ description: 'Filtra eventos que requieren atencion' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  requiereAtencion?: boolean;

  @ApiPropertyOptional({ description: 'Filtro por sede institucional' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sedeId?: number;
}
