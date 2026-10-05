import { ResponseAreaDto } from '@equipos/presentation/dto';

export class ResponseDepartamentoDto {
  id: number;
  codigo: string;
  nombre: string;
}

export class ResponseResponsableDto {
  id: number;
  codigo: string;
  nombre: string;
  cedula: string | null;
  area: ResponseAreaDto | null;
  departamento: ResponseDepartamentoDto | null;
}
