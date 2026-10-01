import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { OfertaSaveDto } from './oferta-save.dto';

export class GuardarOfertasDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  proveedorId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfertaSaveDto)
  ofertas: OfertaSaveDto[];
}
