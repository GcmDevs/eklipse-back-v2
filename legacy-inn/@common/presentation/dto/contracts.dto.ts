import { MimeTypes } from '@common/domain/enums';

export class BaseDto {
  id: number;
}

export class ResponseArchivoDto {
  nombreArchivo: string;
  tipoMime: MimeTypes;
  url: string;
}

export class ResponseMinimalEntityDto {
  id: number;
  nombre: string;
}

export class UsuarioEjecucionDto {
  usuario: {
    id: number;
    nombre: string;
  };
}
