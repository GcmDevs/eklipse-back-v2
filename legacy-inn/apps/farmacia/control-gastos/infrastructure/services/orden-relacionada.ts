import { QueryRunner } from 'typeorm';
import { DocumentoOrm } from '@orm/inn/documentos';
import { consecutivosServices } from '@common/application/services';

export async function resolverOrdenRelacionada(qr: QueryRunner, tipo?: number, codigo?: string) {
  const consecutivo = codigo?.trim();
  if (!consecutivo && tipo == null) return null;
  if (!consecutivo || (tipo !== 0 && tipo !== 19)) {
    throw new Error('Indique el tipo de orden y su consecutivo');
  }
  if (!/\d$/.test(consecutivo)) throw new Error('El consecutivo debe terminar en un numero');
  const documentos = await qr.manager.getRepository(DocumentoOrm).find({
    where: { tipoCode: tipo, consecutivo: consecutivosServices.autocomplete(consecutivo.toUpperCase()) },
    take: 2,
  });
  if (documentos.length !== 1) throw new Error('No se encontro una orden unica del tipo y consecutivo indicados en este contexto');
  return { id: documentos[0].id, consecutivo: documentos[0].consecutivo };
}
