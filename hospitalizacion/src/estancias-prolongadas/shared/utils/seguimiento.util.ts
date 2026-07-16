import {
  SeguimientoAccionCode,
  seguimientoAccionTypeFactory,
  SeguimientoDestinoCode,
  seguimientoDestinoTypeFactory,
  SeguimientoEstadoCode,
  seguimientoEstadoTypeFactory,
} from '@ctypes/hpn/estancias-prolongadas';
import { SeguimientoSemanaOrm } from '@orm/hpn/estancias-prolongadas';

export function mapSeguimiento(seguimiento: SeguimientoSemanaOrm) {
  return {
    ...seguimiento,
    estado: seguimientoEstadoTypeFactory(seguimiento.estadoCodigo as SeguimientoEstadoCode),
    destino: seguimiento.destinoCodigo
      ? seguimientoDestinoTypeFactory(seguimiento.destinoCodigo as SeguimientoDestinoCode)
      : null,
    accion: seguimiento.accionCodigo
      ? seguimientoAccionTypeFactory(seguimiento.accionCodigo as SeguimientoAccionCode)
      : null,
  };
}
