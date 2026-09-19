import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class BoletaQuirurgicaDetalleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;
}

export class InicializarBoletaQuirurgicaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;
}

export class GuardarAutorizacionDto {
  @IsOptional()
  @IsString()
  observacionPendiente?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;

  @IsDateString()
  fechaCaptacion: string;

  @IsDateString()
  fechaGestor: string;

  @IsString()
  @MaxLength(150)
  municipio: string;

  @IsString()
  @MaxLength(100)
  tipo: string;

  @IsString()
  @MaxLength(20)
  autorizado: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente3?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente5?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente6?: string;

  @IsString()
  @MaxLength(250)
  pendiente7: string;

  @IsString()
  @MaxLength(250)
  servicio: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cambioCups?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  usuarioCambioCups?: string;
}

export class GuardarObservacionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;

  @IsString()
  observacion: string;

  @IsDateString()
  fecha: string;

  @IsString()
  @IsIn(['AUDITORIA', 'GESTOR', 'MAOS', 'PROGRAMACION', 'POST_QX'])
  @MaxLength(50)
  gestor: string;
}
export class ObservacionesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;

  @IsString()
  gestor: 'AUDITORIA' | 'GESTOR' | 'MAOS' | 'PROGRAMACION' | 'POST_QX';
}

export class GuardarProgramacionDto {
  @IsOptional()
  @IsString()
  observacionPendiente?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;

  @IsString()
  @MaxLength(150)
  institucion: string;

  @IsDateString()
  fechaRecepcion: string;

  @IsString()
  @MaxLength(50)
  programada: string;

  @IsDateString()
  fechaProgramacion: string;

  @IsString()
  @MaxLength(20)
  estadoProg: string;
}

export class GuardarGestorQxDto {
  @IsOptional()
  @IsString()
  observacionPendiente?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  otrasValoraciones?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsString()
  @MaxLength(50)
  estadoAutorizacion: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente3?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  pendiente4?: string;

  @IsOptional()
  @IsBoolean()
  reqMaos?: boolean;
}

export class GuardarMaosDto {
  @IsOptional()
  @IsString()
  observacionPendiente?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  maosSolicitado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  estadoMaos?: string;

  @IsOptional()
  @IsString()
  casaComercial?: string;

  @IsDateString()
  fechaEntrega: string;

  @IsString()
  @MaxLength(50)
  estado2Maos: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  existencia?: string;
}

export class CierreAdministrativoDto extends BoletaQuirurgicaDetalleDto {}

export class ActualizarCupEjecutadoDto extends BoletaQuirurgicaDetalleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cupEjecutadoOid: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  genseripsOid: number;
}

export class ActualizarCupSolicitadoDto extends BoletaQuirurgicaDetalleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  solicitudOid: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  genseripsOid: number;

  @IsIn(['PQX', 'NPQX', 'EXA'])
  origen: 'PQX' | 'NPQX' | 'EXA';
}

export class GuardarAuditoriaPreDto extends BoletaQuirurgicaDetalleDto {
  @IsOptional()
  @IsString()
  observacionPendiente?: string;

  @IsIn(['CUMPLE', 'NO CUMPLE'])
  cumple: 'CUMPLE' | 'NO CUMPLE';

  @IsBoolean()
  cambioCups: boolean;

  @IsOptional()
  @IsString()
  usuarioCambioCups?: string | null;
}
