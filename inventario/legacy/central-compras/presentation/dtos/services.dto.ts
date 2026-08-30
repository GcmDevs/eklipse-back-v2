import { GcmContexts } from '@common/domain/types';
import { castDataServices } from '@common/application/services';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateItemSolicitudCompraDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `${castDataServices.enumToString(GcmContexts)}`,
  })
  context: GcmContexts;
  @ApiProperty()
  @IsNumber()
  itemId: number;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  productoId: number;
  @ApiProperty()
  @IsString()
  @IsOptional()
  nombreServicio: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  nombreMarca: string;
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  cantidad: number;
}
