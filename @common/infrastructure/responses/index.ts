import { ApiProperty } from '@nestjs/swagger';
import { GcmContextCode } from '../../domain/types';

export class EntidadBasicaRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  nombre: string;
  nit?: string;
}

export class CentroRes extends EntidadBasicaRes {
  @ApiProperty()
  contextoCode: GcmContextCode;
}

export class NuevaEntidadRes {
  @ApiProperty()
  id: number;
}

export class UsuarioBasicoRes {
  @ApiProperty()
  cedula: string;
  @ApiProperty()
  nombreCompleto: string;
}

export const dataToNuevaEntidadRes = (data: any) => {
  if (data && data.id) {
    const e = new NuevaEntidadRes();
    e.id = data.id;
    return e;
  } else {
    return null;
  }
};

export const dataToUsuarioBasicoRes = (data: any) => {
  if (data && data.cedula && data.nombreCompleto) {
    const e = new UsuarioBasicoRes();
    e.cedula = data.cedula;
    e.nombreCompleto = data.nombreCompleto;
    return e;
  } else {
    return null;
  }
};

export const dataToEntidadBasicaRes = (data: any) => {
  if (data && data.id && data.codigo && data.nombre) {
    const e = new EntidadBasicaRes();
    e.id = data.id;
    e.codigo = data.codigo;
    e.nombre = data.nombre;
    return e;
  } else {
    return null;
  }
};
