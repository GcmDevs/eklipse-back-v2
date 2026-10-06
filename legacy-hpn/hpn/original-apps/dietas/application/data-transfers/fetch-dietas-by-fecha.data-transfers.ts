import {
  JornadaType,
  DieJorEstadoType,
  DieEstadoType,
  MotivoDevolucionDietaType,
} from '@lgc/die/domain/types/local';

export interface InfoDietaCentroDto {
  id: number;
  centro: {
    id: number;
    nombre: string;
  };
  fecha: Date;
  jornada: JornadaType;
  estado: DieJorEstadoType;
  dietas?: DietaDto[];
}

export interface DietaDto {
  id: number;
  estancia: {
    id: number;
  };
  subgrupo: {
    nombre: string;
    codigo: string;
  };
  cama: {
    codigo: string;
  };
  paciente: {
    nombreCompleto: string;
    fechaNacimiento: Date;
  };
  tipo: string;
  consistencia: string;
  createdAt: Date;
  createdBy: number;
  canBeDeleted: boolean;
  precio: number;
  dietasExtraordinarias: {
    tipo: string;
    consistencia: string;
    precio: number;
  }[];
  estado: DieEstadoType;
  incluyeMerienda: boolean | null;
  incluyeDietaFamiliar: boolean | null;
  tipoMerienda: string | null;
  observacion: string;
  motivoDevolucion: MotivoDevolucionDietaType;
  observacionDevolucion: string;
  enAislamiento: boolean | null;
}
