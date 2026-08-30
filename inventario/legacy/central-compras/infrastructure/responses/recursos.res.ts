import { TipoSolicitudTypeCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ApiProperty } from '@nestjs/swagger';

export class RecursoIngresoRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  consecutivo: number;
  @ApiProperty()
  nombreCompletoPaciente: string;
}

export class RecursoTerceroRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  nombre: string;
  @ApiProperty()
  direccion: string;
  @ApiProperty()
  tel1: string;
  @ApiProperty()
  tel2: string;
}

export class RecursoProductoRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  claseCode: TipoSolicitudTypeCode;
  codigo: string;
  @ApiProperty()
  descripcion: string;
  @ApiProperty()
  precioSugerido: number;
}
