import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsArray, ValidateNested, IsString } from 'class-validator';

export class DietaNoRecibidaDto {
  @ApiProperty()
  @IsString()
  date: Date;

  @ApiProperty()
  @IsNumber()
  centroId: number;

  @ApiProperty()
  @IsNumber()
  scheduleId: number;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleDietaNoRecibidaDto)
  detail: DetalleDietaNoRecibidaDto[];
}

export class DetalleDietaNoRecibidaDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  config: string;
}
