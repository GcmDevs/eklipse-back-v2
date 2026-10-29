import { In } from 'typeorm';
import { GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { DocumentoOrm } from '@inn/lgc/cgt/orm/inn/documentos/documento.orm';
import { ControlGastoOrm } from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos';

/** The references live in the clinic; the attached purchasing documents belong to AMMEDICAL. */
export async function cargarDocumentosRelacionados(gastos: ControlGastoOrm[]) {
  const ids = [
    ...new Set(
      gastos.flatMap(gasto => [
        ...(gasto.archivos || []).map(archivo => archivo.documentoId),
        ...(gasto.ordenRelacionadaId ? [gasto.ordenRelacionadaId] : []),
      ])
    ),
  ];
  if (!ids.length) return;
  const documentos = await switchConn(GCM_CONTEXTS.AMMEDICAL)
    .getRepository(DocumentoOrm)
    .find({ where: { id: In(ids) } });
  const porId = new Map(documentos.map(documento => [documento.id, documento]));
  for (const gasto of gastos) {
    for (const archivo of gasto.archivos || [])
      archivo.documento = porId.get(archivo.documentoId) ?? null;
    if (gasto.ordenRelacionadaId)
      gasto.ordenRelacionada = porId.get(gasto.ordenRelacionadaId) ?? null;
  }
}
