import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MedicamentoInput, TIPOS_PRODUCTO_INVIMA } from '../domain/invima.models';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export class GuardarMedicamentoDto implements MedicamentoInput {
  @IsOptional()
  @IsIn(TIPOS_PRODUCTO_INVIMA)
  tipo?: MedicamentoInput['tipo'];
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) codigoDeclarado?: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(240) nombre: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(24)
  @Matches(/^(?:\d{1,12}\s*-\s*\d{1,8})?$/, {
    message: 'El CUM debe tener formato expediente-consecutivo.',
  })
  cum?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(100) registroSanitario?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(240) laboratorio?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(120) concentracion?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(160) formaFarmaceutica?: string;
  @Transform(trim) @IsOptional() @IsString() @MaxLength(1000) presentacion?: string;
  @IsOptional() @IsInt() @Min(1) version?: number;
}
export class PaginaCandidatoDto {
  @IsIn(['vigentes', 'vencidos', 'renovacion', 'otros', 'dispositivos', 'registros']) fuenteId: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) offset: number = 0;
}
export class ConfirmarCandidatoDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) clave: string;
}
