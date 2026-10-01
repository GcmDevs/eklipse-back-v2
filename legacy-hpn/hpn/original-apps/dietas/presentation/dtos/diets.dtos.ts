import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export interface FetchReservedIntegratedDietsDto {
  date: Date;
  clientId: number;
  groupId: string;
  scheduleId: number;
  locations: number[];
}

export class ItdDietDto {
  @IsNumber()
  scheduleId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailItdDietDto)
  detail: DetailItdDietDto[];
}

export class DetailItdDietDto {
  @IsNumber()
  @IsOptional()
  referenceId: number;

  @IsString()
  @IsOptional()
  config: string;
}

export class UnreceivedItdDietDto {
  @ApiProperty()
  @IsString()
  date: Date;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  clientId: number;

  @ApiProperty()
  @IsNumber()
  scheduleId: number;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailUnreceivedItdDietDto)
  detail: DetailUnreceivedItdDietDto[];
}

export class DetailUnreceivedItdDietDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  config: string;
}
