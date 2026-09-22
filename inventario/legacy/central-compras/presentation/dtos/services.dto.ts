import { GcmContexts } from '@common/domain/types';
import { castDataServices } from '@common/application/services';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TipoCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';

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
  @IsOptional()
  cotizacionId?: number;
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  productoId: number;
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  tipoCode?: TipoCode;
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

export class CambiarTipoSolicitudDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `${castDataServices.enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @ApiProperty()
  @IsNumber()
  solicitudId: number;

  @ApiProperty()
  @IsNumber()
  tipoCode: TipoCode;
}
