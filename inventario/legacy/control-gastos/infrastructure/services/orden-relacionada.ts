import { DocumentoOrm } from '@inn/lgc/cgt/orm/inn/documentos/documento.orm';
import { consecutivosServices } from '@common/application/services';
import { switchConn } from '../../../../../@common/infrastructure/services';
import { GCM_CONTEXTS } from '../../../../../@common/domain/types';

export async function resolverOrdenRelacionada(tipo?: number, codigo?: string) {
  const conn = switchConn(GCM_CONTEXTS.AMMEDICAL);
  const consecutivo = codigo?.trim();
  if (!consecutivo && tipo == null) return null;
  if (!consecutivo || (tipo !== 0 && tipo !== 19 && tipo !== 24)) {
    throw new Error('Indique el tipo de orden y su consecutivo');
  }
  if (!/\d$/.test(consecutivo)) throw new Error('El consecutivo debe terminar en un numero');
  const documentos = await conn.manager.getRepository(DocumentoOrm).find({
    where: {
      tipoCode: tipo,
      consecutivo: consecutivosServices.autocomplete(consecutivo.toUpperCase()),
    },
    take: 2,
  });

  if (documentos.length > 1) {
    throw new Error('Existe mas de una orden del tipo y consecutivo indicados en este contexto');
  }
  if (!documentos.length) {
    throw new Error('No se encontró orden del tipo y consecutivo indicados en este contexto');
  }
  return { id: documentos[0].id, consecutivo: documentos[0].consecutivo };
}
