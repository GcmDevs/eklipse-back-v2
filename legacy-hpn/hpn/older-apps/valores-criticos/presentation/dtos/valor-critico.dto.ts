import { TipoAreaCode } from '@hpn/old/valores-criticos/domain/types';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ValorCriticoDto {
  @IsNumber()
  areaReporta: TipoAreaCode;

  @IsNumber()
  pacienteId: number;

  @IsNumber()
  medicoId: number;

  @IsNumber()
  estanciaId: number;

  @IsString()
  valorCritico: string;

  @IsString()
  observaciones: string;
}

export class ValoresCriticosReactivosDto {
  @IsString()
  fuentePublicacion: string;

  @IsNumber()
  tipoProducto: number;

  @IsNumber()
  tipoEvento: number;

  @IsString()
  nombre: string;

  @IsString()
  risaRH: string;

  @IsString()
  acciones: string;

  @IsBoolean()
  relInstitucion: boolean;
}

export class RecepcionTecnicaReactivosDto {
  @IsString()
  fechaRecepcion: Date;

  @IsString()
  nombre: string;

  @IsString()
  presentacion: string;

  @IsString()
  marca: string;

  @IsNumber()
  cantidadRecepcionada: number;

  @IsString()
  lote: string;

  @IsString()
  fechaVencimiento: Date;

  @IsString()
  registroInvima: string;

  @IsString()
  empaque: string;

  @IsString()
  cadenaFrio: string;

  @IsString()
  temperaturaAmbienteEmbalaje: string;

  @IsString()
  refrigeradoEmbalaje: string;

  @IsString()
  temperaturaAmbienteRecepcion: string;

  @IsString()
  refrigeradoRecepcion: string;

  @IsString()
  observacion: string;

  @IsString()
  usuarioRecibido: string;
}

export class AuditadoDto {
  @IsNumber()
  reporteId: number;

  @IsString()
  @IsOptional()
  observacion: string;

  @IsBoolean()
  isAprobado: boolean;
}
