import { GcmContextCode } from '@common/domain/types';
import { EstadoConteoCode } from '@ctypes/inn/inventario';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CrearAsignacionConteoDto {
  @ApiProperty({ example: 12, description: 'Identificador del estante asignado.' })
  @IsNumber()
  estanteId: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 3, description: 'Numero de conteo asignado.' })
  @IsInt()
  @Min(1)
  @Max(3)
  numeroConteo: number;

  @ApiProperty({
    example: [3, 7],
    type: Number,
    isArray: true,
    description: 'Usuarios responsables del conteo.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  usuariosIds: number[];

  @ApiProperty({ example: 'GCM', description: 'Codigo de contexto de la operacion.' })
  @IsString()
  contextCode: GcmContextCode;
}

// bulk-assign-users.dto.ts
export class AsignacionDeUsuariosDto {
  @ApiProperty({ example: 4, description: 'Identificador del almacen.' })
  @IsNumber()
  almacenId: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 3, description: 'Numero de conteo asignado.' })
  @IsInt()
  @Min(1)
  @Max(3)
  numeroConteo: number;

  @ApiProperty({ type: () => AsignacionUsuarioEstante, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  assignments: AsignacionUsuarioEstante[];
}

export class AsignacionUsuarioEstante {
  @ApiProperty({ example: 12, description: 'Identificador del estante.' })
  @IsNumber()
  estanteId: number;

  @ApiProperty({ example: [3, 7], type: Number, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber()
  usuariosIds: string[];
}
export class BuscarExistenciaProductoEstanteDto {
  @ApiProperty({ example: 12, description: 'Identificador del estante.' })
  @IsNumber()
  estanteId: number;

  @ApiProperty({ example: 381, description: 'Identificador del producto.' })
  @IsNumber()
  productoId: number;
}

export class EstanteInventarioDto {
  @ApiProperty({ example: 'A-01', description: 'Nombre o codigo del estante.' })
  @IsString()
  nombreEstante: string;

  @ApiProperty({ example: 4, description: 'Identificador del almacen asociado.' })
  @IsNumber()
  almacenId: number;

  @ApiProperty({ example: 'GCM', description: 'Codigo de contexto de la operacion.' })
  @IsString()
  contextCode: GcmContextCode;
}
export class ProductoEstanteDto {
  @ApiProperty({ example: 12, description: 'Identificador del estante.' })
  @IsNumber()
  estanteId: number;

  @ApiProperty({ example: 381, description: 'Identificador del producto.' })
  @IsNumber()
  productoId: number;

  @ApiProperty({ example: 'Nivel 2 - izquierda', description: 'Ubicacion fisica del producto.' })
  @IsString()
  ubicacion: string;

  @ApiProperty({ example: 'MEDICAMENTO', description: 'Tipo o clasificacion del producto.' })
  @IsString()
  tipo: string;

  @ApiProperty({ example: 'GCM', description: 'Codigo de contexto de la operacion.' })
  @IsString()
  contextCode: GcmContextCode;
}
export class EditarProductoEstanteDto {
  @ApiProperty({ example: 381, description: 'Identificador del producto.' })
  @IsNumber()
  productoId: number;

  @ApiProperty({ example: 12, description: 'Identificador del estante.' })
  @IsNumber()
  estanteId: number;

  @ApiPropertyOptional({ example: 'Nivel 2 - izquierda', description: 'Nueva ubicacion fisica.' })
  @IsString()
  @IsOptional()
  ubicacion: string;

  @ApiPropertyOptional({ example: 'MEDICAMENTO', description: 'Nuevo tipo o clasificacion.' })
  @IsString()
  @IsOptional()
  tipo: string;

  @ApiPropertyOptional({ example: 25, description: 'Cantidad actualizada.' })
  @IsNumber()
  @IsOptional()
  cantidad: number;
}

export enum TipoTrasladoEstante {
  COMPLETA = 'COMPLETA',
  PARCIAL = 'PARCIAL',
}
export class CambioEstanteDto {
  @ApiProperty({ example: 99, description: 'Identificador del registro producto-estante.' })
  @IsNumber()
  productoEstanteId: number;

  @ApiProperty({ example: 12, description: 'Estante desde el que se traslada el producto.' })
  @IsNumber()
  estanteOrigenId: number;

  @ApiProperty({ example: 18, description: 'Estante destino del producto.' })
  @IsNumber()
  estanteDestinoId: number;

  @ApiProperty({ enum: TipoTrasladoEstante, example: TipoTrasladoEstante.PARCIAL })
  @IsEnum(TipoTrasladoEstante)
  tipoTraslado: TipoTrasladoEstante;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    description: 'Cantidad trasladada cuando el traslado es parcial.',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidad?: number;
}

export class UsuarioConteoDto {
  @ApiProperty({ example: 7, description: 'Identificador del usuario habilitado para conteo.' })
  @IsNumber()
  usuarioId: number;

  @ApiProperty({ example: 'GCM', description: 'Codigo de contexto de la operacion.' })
  @IsString()
  contextCode: GcmContextCode;
}

export interface UsuarioConteoResponse {
  id: number;
  isActive: boolean;
  usuario: {
    id: number;
    nombre: string;
    email?: string;
  };
}
export interface UsuarioResponse {
  id: number;
  nombreCompleto: string;
  cedula: string;
}

export class RegistrarConteoDto {
  @ApiProperty({ example: 99, description: 'Identificador del producto asociado al estante.' })
  @IsInt()
  @IsPositive()
  estanteProductoId: number;

  @ApiProperty({ example: 10, minimum: 0, description: 'Cantidad contada por el usuario.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cantidadContada: number;
}
export class RegistrarConteoConDetalleDto {
  @ApiProperty({
    example: 1,
    minimum: 1,
    maximum: 3,
    description: 'Numero de conteo que se registra.',
  })
  @IsInt()
  @Min(1)
  @Max(3)
  numeroConteo: number;

  @ApiPropertyOptional({ example: 2, description: 'Ciclo requerido para el tercer conteo.' })
  @IsNumber()
  @ValidateIf(o => o.numeroConteo === 3)
  cicloId: number;

  @ApiProperty({ type: () => RegistrarConteoDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegistrarConteoDto)
  items: RegistrarConteoDto[];
}
export interface ConteoInventarioResponse {
  conteoInventarioId: number;
  coincidenciaSistema: boolean;
  existenciaSistema: number;
  existenciaActual?: number;
  estado: EstadoConteoCode;
  totalConteoRealizado: number;
  numeroConteoCoincidente: number | null;
  isCerrado: boolean;
  siguienteConteoPermitido: number | null;
  puedeSeguirContando: boolean;
}
export interface DetalleConteoItem {
  id: number;
  numeroConteo: number; // 1, 2 o 3
  usuarioId: number;
  usuarioNombre?: string; // si tienes relación con usuario
  cantidadContada: number;
  coincidenciaSistema: boolean;
  observations?: string | null;
  createdAt?: Date; // si tienes columnas de fecha
}

export interface ResumenConteoInventarioResponse {
  conteoInventarioId: number | null;

  estanteProductoId: number;
  productoId: number;
  productoDescripcion?: string;
  estanteId: number;
  estanteNombre?: string;
  existenciaSistema: number;
  estado: EstadoConteoCode; // o EstadoConteoCode
  totalConteoRealizado: number;
  numeroConteoCoincidente: number | null;
  isCerrado: boolean;
  puedeSeguirContando: boolean;
  siguienteConteoPermitido: number | null;
  detalles: DetalleConteoItem[];
}
export class CrearDetalleConteoDto {
  @ApiProperty({ example: 1 })
  conteoInventarioId: number;
  @ApiProperty({ example: 99 })
  productoEstanteId: number;
  @ApiProperty({ example: 7 })
  usuarioId: number;
  @ApiProperty({ example: 1, minimum: 1, maximum: 3 })
  numeroConteo: number; // 1 | 2 | 3
  @ApiProperty({ example: 10 })
  cantidadContada: number;
  @ApiPropertyOptional({ example: 'Conteo validado.' })
  observations?: string;
  @ApiProperty({ example: 'GCM' })
  contextCode: GcmContextCode;
}

export class ConteoProductoDetalleDto {
  idConteoDetalle: number;
  numeroConteo: number; // 1, 2, 3
  cantidadContada: number;
  diferencia: number; // cantidadContada - existenciaSistema
  estadoAjuste: EstadoConteoCode; // FALTANTE / SOBRANTE / AJUSTADO
  coincidenciaSistema: boolean;
  countedAt: Date;
  usuarioId: number;
  usuarioNombre?: string; // si tienes relación con usuario
}

export class ProductoConteoAdminDto {
  estanteProductoId: number;
  productoId: number;
  codigoProducto: string;
  descripcionProducto?: string;
  existenciaSistema: number;
  // existenciaBase: number;
  estadoGlobal: EstadoConteoCode; // estado según el ÚLTIMO conteo
  isCerrado: boolean;
  totalConteoRealizado: number;
  numeroConteoCoincidente: number | null;
  fabricante?: string;
  tipo?: string;
  cicloId: number;
  ubicacion?: string;
  cantidadOficial: number;
  diferenciaUltimoConteo: number | null;
  // Para que el front pinte columnas Conteo 1, 2 y 3 fácil:
  conteo1?: ConteoProductoDetalleDto;
  conteo2?: ConteoProductoDetalleDto;
  conteo3?: ConteoProductoDetalleDto;
  // Por si quieres un array genérico también
  conteos: ConteoProductoDetalleDto[];
}

export class EstanteConteoAdminDto {
  estanteId: number;
  nombreEstante: string;
  estadoEstante: 'PENDIENTE' | 'PROGRESO' | 'COMPLETADO';
  productos: ProductoConteoAdminDto[];
}
export interface UsuarioAsignacionResponse {
  id: number;
  usuarioId: number;
  roles: number;
  isActive: boolean;
  createdAt: null;
  updatedAt: Date;
  asignaciones: Asignaciones[];
  usuario: Usuario;
}

export interface Asignaciones {
  id: number;
  usuarioId: number;
  estanteId: number;
  numeroConteo: number;
  isActivo: boolean;
  cicloId: number;
  fechaAsignacion: Date;
  updatedAt: Date;
  estante: Estante;
}

export interface Estante {
  id: number;
  nombreEstante: string;
  almacenId: number;
  estado: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usuario {
  id: number;
  cedula: string;
  nombreCompleto: string;
}

export interface UsuarioAsignacionSimpleResponse {
  id: number;
  nombre: string;
  cedula: string;
  asignacion: {
    estante: string;
    numeroConteo: number;
    fechaAsignacion: Date;
  }[];
}

export class ConteoCambioDto {
  @ApiPropertyOptional({ example: 1, description: 'Identificador del detalle de conteo.' })
  @IsInt()
  @IsOptional()
  id: number;

  @ApiPropertyOptional({ example: 99, description: 'Identificador del producto-estante.' })
  @IsInt()
  @IsOptional()
  estanteProductoId: number;

  @ApiProperty({ example: 10, minimum: 0, description: 'Valor de conteo actualizado.' })
  @IsInt()
  @Min(0)
  conteo: number;
}

export class ConteoAdminDto {
  @ApiProperty({ example: 2, description: 'Identificador del ciclo de inventario.' })
  @IsInt()
  cicloId: number;

  @ApiProperty({ type: () => ConteoCambioDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConteoCambioDto)
  items: ConteoCambioDto[];
}
export class AdminUpdateConteosDto {
  @ApiPropertyOptional({ type: () => ConteoAdminDto })
  @IsOptional()
  conteo1?: ConteoAdminDto;

  @ApiPropertyOptional({ type: () => ConteoAdminDto })
  @IsOptional()
  conteo2?: ConteoAdminDto;

  @ApiPropertyOptional({ type: () => ConteoAdminDto })
  @IsOptional()
  conteo3?: ConteoAdminDto;
}
