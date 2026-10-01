import { UsuarioBasicoRes } from '@common/application/responses';
import { tipoEstanteTypeFactory } from '@ctypes/inn/productos';
import {
  AlmacenRes,
  EstanteRes,
  HistoricoExistenciaRes,
  VerificacionRes,
} from '@farmacia/inn-ciclico/application/responses';
import { AlmacenOrm } from '@orm/inn/productos';
import { ReporteOrm } from '@orm/inn/productos/estantes';

export const reporteOrmToHistoricoExistenciaResFactory = (data: ReporteOrm) => {
  const e = new HistoricoExistenciaRes();
  e.id = data.id;
  e.stock = data.stock;
  e.verificacion = new VerificacionRes();
  e.verificacion.id = data.verificacion.id;
  e.verificacion.fechaCreacion = data.verificacion.fechaCreacion;
  e.verificacion.observaciones = data.verificacion.observaciones;
  e.verificacion.creadoPor = new UsuarioBasicoRes();
  e.verificacion.creadoPor.cedula = data.verificacion.creadoPor.cedula;
  e.verificacion.creadoPor.nombreCompleto = data.verificacion.creadoPor.nombreCompleto;
  return e;
};

export const almacenOrmToAlmacenResFactory = (data: AlmacenOrm) => {
  const e = new AlmacenRes();
  e.id = data.id;
  e.codigo = data.codigo;
  e.nombre = data.nombre;
  e.prefijo = data.prefijo;
  if (data.estantes) {
    e.estantes = data.estantes.map(el => {
      const st = new EstanteRes();
      st.id = el.id;
      st.nombre = el.nombre;
      st.tipo = tipoEstanteTypeFactory(el.tipoCode);
      return st;
    });
  }
  return e;
};
