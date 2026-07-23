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

  @ApiProperty()
  lineaCode: number;

  @ApiProperty()
  unidadCode: number;

  @ApiProperty()
  vehiculoCode: number;

  @ApiProperty()
  concentracion: string;

  @ApiProperty()
  volumen: number;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  tiempoAdmin: number;

  @ApiProperty()
  uniMedTiempoAdminCode: number;

  @ApiProperty()
  fechaAplicacion: Date;

  @ApiProperty()
  viaAdministracionCode: number;

  @ApiProperty()
  laboratorio: string;

  @ApiProperty()
  cantidadAdecuar: number;

  @ApiProperty()
  lote: string;

  @ApiProperty()
  fechaVencimiento: Date;
}

export class CtMzNutricionParenteralRes {
  @ApiProperty()
  aa10Perc: number;

  @ApiProperty()
  aa15Perc: number;

  @ApiProperty()
  aaPed: number;

  @ApiProperty()
  glutamina: number;

  @ApiProperty()
  po4: number;

  @ApiProperty()
  dad50Perc: number;

  @ApiProperty()
  dad10Perc: number;

  @ApiProperty()
  tabperioK: number;

  @ApiProperty()
  tabperioNa: number;

  @ApiProperty()
  tabperioCa: number;

  @ApiProperty()
  tabperioMg: number;

  @ApiProperty()
  etPed: number;

  @ApiProperty()
  etAdu: number;

  @ApiProperty()
  vhid: number;

  @ApiProperty()
  vipPed: number;

  @ApiProperty()
  vipAdu: number;

  @ApiProperty()
  agua: number;

  @ApiProperty()
  lip20Perc: number;

  @ApiProperty()
  pesAjust: number;

  @ApiProperty()
  viaCode: number;
}

export class CtMzMedicamentoSeleccionRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ type: BasicTypeRes })
  unidad: BasicTypeRes;
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

  @ApiProperty({ required: false, type: CtMzNutricionParenteralRes })
  nutricionParenteral?: CtMzNutricionParenteralRes;

  @ApiProperty()
  notaRespuesta: string;
}

export class CtMzTypesRes {
  @ApiProperty({ type: BasicTypeRes, isArray: true })
  estados: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  lineas: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  prioridades: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  formasFarmaceuticas: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  tiemposAdministracion: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  unidades: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  vehiculos: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  vias: BasicTypeRes[];

  @ApiProperty({ type: BasicTypeRes, isArray: true })
  viasAdministracion: BasicTypeRes[];
}

export class CtMzCamaRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nombre: string;
}

export class CtMzPacienteRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  cedula: string;

  @ApiProperty()
  nombreCompleto: string;

  @ApiProperty()
  fechaNacimiento: Date;

  @ApiProperty({ type: CtMzCamaRes })
  cama: CtMzCamaRes;
}
