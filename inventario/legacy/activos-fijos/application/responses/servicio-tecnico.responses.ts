import {
  AfnClaseSerTecType,
  AfnTipoSerTecType,
  AfnTipoSolSerTecType,
  EstadoAfnActivoType,
  EstadoAfnItemSolSerTecType,
  TipoRequerimientoContratoSolSerTecType,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { PrioridadType } from '@inn/lgc/afn/types/gen';
import {
  EntidadBasicaRes,
  UsuarioBasicoRes,
  NuevaEntidadRes,
} from '@common/infrastructure/responses';

export class AfnActivoProductoSoliSerTecRes extends EntidadBasicaRes {}

export class AfnActivoSoliSerTecRes {
  id: number;
  codigo: string;
  placa: string;
  numeroSerie: string;
  estado: EstadoAfnActivoType;
  responsable: EntidadBasicaRes;
  producto: AfnActivoProductoSoliSerTecRes;
}

export class AfnNotaSoliSerTecRes {
  id: number;
  solicitudId: number;
  solicitudCreadoPorId: number;
  itemSolicitudId: number;
  creadoPor: UsuarioBasicoRes;
  fechaCreacion: Date;
  nota: string;
  notaRelacionada: AfnNotaSoliSerTecRes;
  img1Link: string;
  img2Link: string;
  isNotaAdicionalAllowed: boolean;
  isNotaPrincipal = false;
  isVisto: boolean;
}

export class AfnDetalleSoliSerTecRes {
  id: number;
  notasPendientesPorLeer: number;
  tipoServicioTecnico: AfnTipoSerTecType;
  claseServicioTecnico: AfnClaseSerTecType;
  tipoMantenimiento: AfnTipoSolSerTecType;
  estado: EstadoAfnItemSolSerTecType;
  activo: AfnActivoSoliSerTecRes;
  notas: AfnNotaSoliSerTecRes[];
  observacion: string;
  fechaLimReq: Date;
  atendidoPor: UsuarioBasicoRes;
  fechaInicioAtencion: Date;
  fechaFinalAtencion: Date;
  isAceptadaByAutor: boolean;
  isFallaInUsoClinico: boolean;
  isPacienteLesionadoByEquipo: boolean;
  img1Link: string;
  img2Link: string;
  tipoRequerimientoContrato: TipoRequerimientoContratoSolSerTecType;
  oportunidad: {
    fechaAtencionProgramada: Date;
    tiempoHorasOrDias: number;
    formatoTiempoCode: number;
    isFinalizada: boolean;
    progreso: number;
    fechaLimite: string;
    isTipoTarea: boolean;
  };
  paciente: {
    id: number;
    documento: string;
    nombre: string;
    ingreso: { id: number; consecutivo: string };
    planBeneficio: { id: number; codigo: string; nombre: string };
    tercero: { id: number; codigo: string; nombre: string };
  };
}

export class AfnSoliSerTecRes {
  id: number;
  prioridad: PrioridadType;
  centro: EntidadBasicaRes;
  creadoPor: UsuarioBasicoRes;
  dependencia: EntidadBasicaRes;
  fechaCreacion: Date;
  ubicacion: string;
  detalle: AfnDetalleSoliSerTecRes[];
}

export class AfnDataSoliSerTecRes {
  canAsignarCasos: boolean;
  incluyeTodosLosServiciosTecnicos: boolean;
  puedeAsignarCasos: boolean;
  puedeAtenderCasosNoAsignados: boolean;
  puedeVerTodosLosCasos: boolean;
  data: AfnSoliSerTecRes[];
}

export class CreateAfnSoliSerTecItemRes {
  id: number;
  activoId: number;
}

export class CreateAfnSoliSerTecRes extends NuevaEntidadRes {
  detalle: CreateAfnSoliSerTecItemRes[];
}
