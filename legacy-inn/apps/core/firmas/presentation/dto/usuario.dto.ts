import { IsOptional, IsString } from 'class-validator';

export class FilterUsuarioSearchDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  numeroDocumento?: string;
}
