import { EntidadBasicaRes, UsuarioBasicoRes } from '@common/application/responses';
import { TipoEstanteType } from '@ctypes/inn/productos';
import { EstadoEstanteCode, EstadoEstanteType } from '@farmacia/inn-ciclico/domain/types';

export class VerificacionRes {
  id: number;
  observaciones: string | null;
  creadoPor: UsuarioBasicoRes;
  fechaCreacion: Date;
}

export class HistoricoExistenciaRes {
  id: number;
  stock: number;
  verificacion: VerificacionRes;
}

export class EstanteRes {
  id: number;
  nombre: string;
  tipo: TipoEstanteType;
}

export class AlmacenRes extends EntidadBasicaRes {
  prefijo: string;
  estantes: EstanteRes[];
}

export class ExistenciaActualRes {
  cantidad: number;
  vencimientoMasCercano: Date;
  isVencimientoProximo: boolean;
  cantidadByAuditor: number;
}

export class ProductoRes extends EntidadBasicaRes {
  existenciaActual: ExistenciaActualRes;
  isActivo: boolean;
}

export class FetchEstantesRes extends EstanteRes {
  estado: EstadoEstanteType;
  almacen: AlmacenRes;
  productos: ProductoRes[];
}

export class EstGenDifMayPercRes {
  producto: EntidadBasicaRes;
  cantReportada: number;
  cantStock: number;
  porcDiff: number;
}

export class EstGenDifMayPercContRes {
  estante: EstanteRes;
  diferenciasMayoresPercent: EstGenDifMayPercRes[];
}

export class EstGenAlmacenRes {
  almacen: EntidadBasicaRes;
  total: number;
  totalSinContar: number;
  percTotalSinContar: number;
  totalContados: number;
  percTotalContados: number;
  totalVerificados: number;
  percTotalVerificados: number;
  estantesConErrores: EstGenDifMayPercContRes[];
  estantesVerificables: EstGenDifMayPercContRes[];
}

export class EstadisticaGeneralRes {
  total: number;
  totalSinContar: number;
  percTotalSinContar: number;
  totalContados: number;
  percTotalContados: number;
  totalVerificados: number;
  percTotalVerificados: number;
  almacenes: EstGenAlmacenRes[];
}

export class EstadisticaRes {
  general: EstadisticaGeneralRes;
}

export class CumplimientoEstadisticaRes {
  porcCumplimiento: number;
  almacenes: almacenesEstadisticaRes[];
}

export class almacenesEstadisticaRes {
  id: number;
  nombre: string;
  porcEstantesVerificados: number;
  estantesContados: number;
  estantesSinContar: number;
  estantes: {
    id: number;
    nombre: string;
    frecuenciaConteo: string;
    fechaUltimaVerificacion: Date;
    porcFaltantes: number;
    porcSobrantes: number;
    responsable: UsuarioBasicoRes;
    estado: EstadoEstanteCode;
  }[];
}
export class HistoricoCambioEstante {
  id: number;
  productoId: number;
  nombreProducto: string;
  estanteOrigenId: number;
  nombreEstanteOrigen: string;
  estanteDestinoId: number;
  nombreEstanteDestino: string;
  fechaCambio: Date;
  creadoPor: UsuarioBasicoRes;
}
