import { RolDependienteCode, RolDependienteType } from '@ctypes/gen';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AddDependenciaToUsuarioDto {
  @ApiProperty()
  @IsString()
  dependenciaId: string;

  @ApiProperty()
  @IsString()
  usuarioId: string;

  @ApiProperty()
  @IsNumber()
  rolCode: RolDependienteCode;

  usuarioIdDecrypted: number;
  dependenciaIdDecrypted: number;
}

export class RemoveDependenciaToUsuarioDto {
  @ApiProperty()
  @IsString()
  dependenciaId: string;

  @ApiProperty()
  @IsString()
  usuarioId: string;

  usuarioIdDecrypted: number;
  dependenciaIdDecrypted: number;
}

export interface AddDependenciaToUsuarioRes {
  usuario: {
    id: string;
    cedula: string;
    nombreCompleto: string;
  };
  dependencia: {
    id: string;
    codigo: string;
    nombre: string;
  };
  rol: RolDependienteType;
}
