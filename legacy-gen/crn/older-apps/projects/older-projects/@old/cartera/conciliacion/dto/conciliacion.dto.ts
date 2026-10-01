import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class ConciliacionCarteraDto {
  @ApiProperty({ description: 'Numero de Acta de Entrega', example: '111' })
  @IsString()
  NACTACONCI: string;

  @ApiProperty({ description: 'Id de la Gestion', example: 111 })
  @IsNumber()
  GCMGESCAR!: number;

  @ApiProperty({ description: 'Fecha de Conciliacion', example: '01-01-0001' })
  @IsDateString()
  FECHACONC!: Date;

  @ApiProperty({ description: 'Valor Conciliado', example: 111 })
  @IsNumber()
  VALCONCI: number;

  // @ApiProperty({ description: 'Valor Cartera', example: 111 })
  // @IsNumber()
  // VALCARTE: number;

  @ApiProperty({ description: 'Valor Reconocido para Pagos', example: 111 })
  @IsNumber()
  VALRECPAG: number;

  @ApiProperty({ description: 'Valor Glosado', example: 111 })
  @IsNumber()
  VALGLOSAD: number;

  @ApiProperty({ description: 'Valor Devuelto', example: 111 })
  @IsNumber()
  VALDEVUEL: number;

  @ApiProperty({ description: 'Valor no Radicado', example: 111 })
  @IsNumber()
  VALNORADI: number;

  @ApiProperty({ description: 'Valor en Auditoria', example: 111 })
  @IsNumber()
  AUDITORIA: number;

  @ApiProperty({ description: 'Valor de Retencion', example: 111 })
  @IsNumber()
  RETENCION: number;

  @ApiProperty({
    description: 'Valor Glosas Aceptadas por la Ips',
    example: 111,
  })
  @IsNumber()
  GLOSACEPTIPS: number;

  @ApiProperty({
    description: 'Valor de las Notas no Descontadas Por la Eps',
    example: 111,
  })
  @IsNumber()
  NOTNODESCEPS: number;

  @ApiProperty({ description: 'Valor d Pagos no Aplicados', example: 111 })
  @IsNumber()
  PAGNOAPLI: number;

  @ApiProperty({ description: 'Valor de Cuota Moderadora', example: 111 })
  @IsNumber()
  COPCUOMODE: number;

  @ApiProperty({ description: 'Valor cancelado', example: 111 })
  @IsNumber()
  VALCANCEL: number;

  @ApiProperty({
    description: 'Estado de la Conciliacion',
    example: 'PENDIENTE',
  })
  @IsString()
  ESTADO: string;
}
