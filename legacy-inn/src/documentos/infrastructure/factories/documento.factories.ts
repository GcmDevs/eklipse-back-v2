import { DocumentoOrm } from '@orm/inn/documentos';
import { EstadoDocumentoCode, TipoDocumentoCode } from '@ctypes/inn/documentos';

export const dataToDocumentoOrm = (payload: {
  consecutivo: string;
  tipo: TipoDocumentoCode;
  estado: EstadoDocumentoCode;
  creadoPorId: number;
  optimisticLockField: number;
  objectType: number;
}) => {
  const newDocumento = new DocumentoOrm();

  newDocumento.fecha = new Date();
  newDocumento.consecutivo = payload.consecutivo;
  newDocumento.tipoCode = payload.tipo;
  newDocumento.estadoCode = payload.estado;
  newDocumento.creadoPorId = payload.creadoPorId;
  newDocumento.fechaCreacion = new Date();
  newDocumento.optimisticLockField = payload.optimisticLockField;
  newDocumento.objectType = payload.objectType;

  return newDocumento;
};
