import { EntityManager } from 'typeorm';
import { CreateRTCDto } from '../../presentation/dtos';
import {
  DetalleRecepcionTecnicaOrm,
  RecepcionTecnicaOrm,
} from '../../@orm/inn/farmacia/recepcion-tecnica';
import { DetalleComprobanteEntradaOrm, DetalleRemisionEntradaOrm } from '../../@orm/inn/documentos';
import { TIPOS_DOCUMENTO } from '../../@types/inn/documentos';
import { leerInspeccion, normalizarInspeccion } from '../../../../src/recepcion-tecnica/inspeccion';

/** Se ejecuta con el EntityManager de la transacción/contexto de la recepción. */
export async function prepararInspecciones(
  manager: EntityManager,
  payload: CreateRTCDto,
  recepcion: RecepcionTecnicaOrm,
  usuario: number
): Promise<void> {
  if (Date.now() - new Date(recepcion.createdAt).getTime() > 7 * 86400000)
    throw new Error('Esta recepción técnica está cerrada para edición.');
  const esComprobante = payload.tipoDocumentoCode === TIPOS_DOCUMENTO.COMPROBANTE_ENTRADA.getCode();
  if (
    recepcion.documentoId !== (payload.documentoId || null) ||
    recepcion.tipoDocumentoCode !== (esComprobante ? payload.tipoDocumentoCode : 3)
  )
    throw new Error('El documento no corresponde a esta recepción.');
  const anteriores = await manager
    .getRepository(DetalleRecepcionTecnicaOrm)
    .find({ where: { recepcionTecnicaId: recepcion.id }, relations: ['lotes'] });
  const repetidos = new Set<number>();
  for (const item of payload.detalle) {
    delete item.inspeccionPersistida;
    if (item.ignore) throw new Error('Los renglones heredados no se pueden modificar.');
    if (repetidos.has(item.itemDetalleId))
      throw new Error('El renglón de la recepción está repetido.');
    repetidos.add(item.itemDetalleId);
    const anterior = anteriores.find(
      p => p.itemDetalleId === item.itemDetalleId && p.productoId === item.productoId
    );
    if (item.id && item.id !== anterior?.id)
      throw new Error('El producto no pertenece a esta recepción.');
    item.id = anterior?.id;
    const guardada = leerInspeccion(anterior?.inspeccionJson);
    if (payload.documentoId) {
      const origen: any = esComprobante
        ? await manager.getRepository(DetalleComprobanteEntradaOrm).findOne({
            where: {
              id: item.itemDetalleId,
              comprobanteEntradaId: payload.documentoId,
              productoId: item.productoId,
            },
            relations: ['itemRemision', 'itemRemision.rctProducto'],
          })
        : await manager.getRepository(DetalleRemisionEntradaOrm).findOne({
            where: {
              id: item.itemDetalleId,
              remisionEntradaId: payload.documentoId,
              productoId: item.productoId,
            },
          });
      if (!origen) throw new Error('El renglón no pertenece al documento del contexto actual.');
      if (origen.itemRemision?.rctProducto)
        throw new Error('La inspección heredada de una remisión es de solo lectura.');
    } else if (item.inspeccion)
      throw new Error('La inspección requiere un comprobante o remisión existente.');
    if (item.lotes === undefined)
      item.lotes = (anterior?.lotes || []).map(l => ({
        id: l.id,
        cantidad: Number(l.cantidad),
        lote: l.lote,
        fechaVencimiento: l.fechaVencimiento,
      }));
    if (item.lotes.some(l => l.id && !anterior?.lotes?.some(a => a.id === l.id)))
      throw new Error('El lote de inspección no pertenece a este renglón.');
    const entrada = item.inspeccion || guardada;
    if (!entrada) {
      if (item.tipoProductoCode === 4)
        throw new Error('El vital no disponible requiere IUM o resolución en su inspección.');
      if (item.temperatura == null || !item.registroInvima?.trim())
        throw new Error('Complete temperatura y registro INVIMA.');
      continue; // Clientes anteriores conservan su contrato y los registros históricos.
    }
    const { inspeccion, muestreo, cumple } = normalizarInspeccion(
      entrada,
      item,
      item.lotes,
      usuario
    );
    item.inspeccionPersistida = inspeccion;
    item.nivelInspeccion = muestreo.nivel;
    item.tamanioMuestra = muestreo.muestra;
    item.cumpleRecepcionTecnica = cumple;
    if (item.tipoProductoCode === 2) {
      item.concentracion = null;
      item.UMConcentracionId = null;
      item.formaFarmaceuticaId = null;
    } else if (
      item.concentracion == null ||
      !Number.isFinite(item.concentracion) ||
      item.concentracion < 0 ||
      !item.UMConcentracionId ||
      !item.formaFarmaceuticaId
    )
      throw new Error('Complete concentración, unidad y forma farmacéutica.');
    if (item.tipoProductoCode === 4) {
      item.registroInvima = null;
      item.verifiRegSanINVIMA = false;
      item.correspFabriExpediSani = false;
    } else if (!item.registroInvima?.trim()) throw new Error('Complete el registro INVIMA.');
    if (inspeccion.cantidadFisica === 0) {
      item.cantidadErrores = 0;
      item.temperatura = null;
      item.verifiRegSanINVIMA = false;
      item.reviEtiquetaProducto = false;
      item.reviOrtografiaSellos = false;
      item.correspFabriExpediSani = false;
    } else if (item.temperatura == null || !Number.isFinite(item.temperatura))
      throw new Error('Complete la temperatura de recepción.');
  }
}
