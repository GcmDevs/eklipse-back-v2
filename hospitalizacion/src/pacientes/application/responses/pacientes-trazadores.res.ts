import { ApiProperty } from '@nestjs/swagger';
import { DocPacHospRes, EpsRes, UbicacionRes } from './pacientes-hospitalizados.res';
import { PacTrazEncEstadoType } from '@hpn/pacientes/domain/types/pac-traz-enc-estado.type';
import { BasicTypeRes } from '@common/domain/types';

export class PacTrazPreguntaRes {
  @ApiProperty()
  categoria: string;
  @ApiProperty()
  descripcion: string;
}

export class PacTrazRespuestaRes {
  @ApiProperty()
  preguntaId: number;
  @ApiProperty()
  respuesta: boolean;
  @ApiProperty()
  observacion: string;
  @ApiProperty({ type: () => PacTrazPreguntaRes, required: false })
  pregunta: PacTrazPreguntaRes;
}

export class PacienteTrazadorRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  ingresoId: number;
  @ApiProperty()
  nombreCompleto: string;
  @ApiProperty({ type: DocPacHospRes })
  documento: DocPacHospRes;
  @ApiProperty()
  fechaNacimiento: Date;
  @ApiProperty()
  fechaIngreso: Date;
  @ApiProperty({ type: EpsRes })
  eps: EpsRes;
  @ApiProperty()
  ubicacion: UbicacionRes;
  @ApiProperty()
  identificacionPreAlta: string;
  @ApiProperty({ type: BasicTypeRes })
  estado: PacTrazEncEstadoType;
}
