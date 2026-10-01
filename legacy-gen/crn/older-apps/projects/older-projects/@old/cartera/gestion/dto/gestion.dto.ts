import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class GestionCarteraDto {
  @ApiProperty({ description: 'Fecha de Gestion', example: '01-01-0001' })
  @IsDateString()
  FECHA: Date;

  @ApiProperty({ description: 'Id de la Enidad', example: 111 })
  @IsNumber()
  GENTERCER: number;

  @ApiProperty({
    description: 'Telefono de Contacto de la Entidad',
    example: '123456789',
  })
  @IsString()
  TELEFTERC: string;

  @ApiProperty({
    description: 'Responsanble de la Entidad',
    example: 'Jane Doe',
  })
  @IsString()
  RESPTERC: string;

  @ApiProperty({
    description: 'Motivo de la Llamada',
    example: 'Llamada de Cobro',
  })
  @IsString()
  MOTLLAMAD: string;

  @ApiProperty({ description: 'Observaciones', example: 'Observaciones' })
  @IsString()
  OBSERVACION: string;

  @ApiProperty({
    description: 'Fecha Asignada para la Consiliacion',
    example: '01-01-0001',
  })
  @IsOptional()
  @IsDateString(/* { null: true, allowNull: true } */)
  FECHCONCI!: Date;

  @ApiProperty({
    description: 'Tipo de Consiliacion',
    example: 'Cartera ó Glosas',
  })
  @IsString()
  TIPCONCI: string;
}
