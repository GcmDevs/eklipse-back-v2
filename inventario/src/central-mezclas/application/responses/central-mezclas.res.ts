import { BasicTypeRes } from '@common/domain/types';
import { ApiProperty } from '@nestjs/swagger';

export class CtMzUsuarioExternoRes {
  @ApiProperty()
  documento: string;

  @ApiProperty()
  nombreCompleto: string;
}

export class CtMzUsuarioResponsableRes {
  @ApiProperty()
  documento: string;

  @ApiProperty()
  nombreCompleto: string;

  @ApiProperty()
  observacion: string;
}

export class CtMzPacienteExternoRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombreCompleto: string;

  @ApiProperty()
  numeroDocumento: string;

  @ApiProperty()
  fechaNacimiento: Date;

  @ApiProperty()
  cama: string;
}

export class CtMzSeleccionRes {
  @ApiProperty()
  nombre: string;

  @ApiProperty({ type: BasicTypeRes })
  linea: BasicTypeRes;

  @ApiProperty({ type: BasicTypeRes })
  unidad: BasicTypeRes;

  @ApiProperty({ type: BasicTypeRes })
  vehiculo: BasicTypeRes;

  @ApiProperty()
  concentracion: string;

  @ApiProperty()
  volumen: number;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  tiempoAdmin: number;

  @ApiProperty({ type: BasicTypeRes })
  uniMedTiempoAdmin: BasicTypeRes;

  @ApiProperty()
  fechaAplicacion: Date;

  @ApiProperty({ type: BasicTypeRes })
  viaAdministracion: BasicTypeRes;
}

export class CtMzSolicitudRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fechaCreacion: Date;

  @ApiProperty({ type: BasicTypeRes })
  linea: BasicTypeRes;

  @ApiProperty({ type: BasicTypeRes })
  estado: BasicTypeRes;

  @ApiProperty({ type: BasicTypeRes })
  prioridad: BasicTypeRes;

  @ApiProperty({ type: CtMzUsuarioExternoRes })
  usuarioExterno: CtMzUsuarioExternoRes;

  @ApiProperty({ type: CtMzUsuarioResponsableRes })
  usuarioResponsable: CtMzUsuarioResponsableRes;

  @ApiProperty({ type: CtMzPacienteExternoRes })
  pacienteExterno: CtMzPacienteExternoRes;

  @ApiProperty({ type: CtMzSeleccionRes, isArray: true })
  seleccion: CtMzSeleccionRes[];
}

export class CtMzTypesRes {
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  estados: BasicTypeRes[];
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  lineas: BasicTypeRes[];
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  prioridades: BasicTypeRes[];
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  tiemposAdministracion: BasicTypeRes[];
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  unidades: BasicTypeRes[];
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  vehiculos: BasicTypeRes[];
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  viasAdministracion: BasicTypeRes[];
}
