import { nivelInspeccionTypeFactoryByChar } from '@inn/farmacia/domain/types/rec-tec';
import { RTCLoteOrm, RTCProductoOrm, RecepcionTecnicaOrm } from '../orm';
import { CreateRTCDto, RTCProductoDto } from '@inn/farmacia/presentation/dtos';

export const dataToRecepcionTecnica = (
  response: CreateRTCDto,
  userAuthId: number,
  documentoId?: number
): RecepcionTecnicaOrm => {
  const rt = new RecepcionTecnicaOrm();
  if (response.id) rt.id = response.id;

  if (!response.id) {
    rt.createdAt = new Date();
    rt.centroId = response.ekCentroId;
  }

  rt.usuarioId = userAuthId;

  rt.numeroFactura = response.codigoFactura ? response.codigoFactura.trim() : null;
  rt.transportadoraId = response.transportadoraId;
  if (documentoId) rt.documentoId = documentoId;
  if (response.tipoDocumentoCode) rt.tipoDocumentoCode = response.tipoDocumentoCode;

  return rt;
};

export const dataToRecepcionTecnicaProducto = (
  producto: RTCProductoDto,
  recepcionTecnica: RecepcionTecnicaOrm
): RTCProductoOrm => {
  const newProducto = new RTCProductoOrm();
  if (producto.id) newProducto.id = producto.id;
  newProducto.estadoEmbalajeCode = producto.estadoEmbalajeCode;
  newProducto.itemDetalleId = producto.itemDetalleId;

  newProducto.concentracion = producto.concentracion;
  newProducto.UMConcentracionId = producto.UMConcentracionId;

  newProducto.formaFarmaceuticaId = producto.formaFarmaceuticaId;

  newProducto.numeroSerie = producto.numeroSerie ? producto.numeroSerie.trim() : null;
  newProducto.vidaUtilId = producto.vidaUtilId;

  newProducto.cum = producto.cum;
  newProducto.marca = producto.marca;

  newProducto.laboratorioId = producto.laboratorioId;
  newProducto.productoId = producto.productoId;
  newProducto.presentacionId = producto.presentacionId;
  newProducto.recepcionTecnicaId = recepcionTecnica.id;
  newProducto.registroInvima = producto.registroInvima;
  newProducto.temperatura = producto.temperatura;
  newProducto.UMTemperaturaCode = producto.UMTemperaturaCode;
  newProducto.tipoProductoCode = producto.tipoProductoCode;
  newProducto.tipoRiesgoCode = producto.riesgoProductoCode;
  newProducto.tamanioMuestra = producto.tamanioMuestra;
  newProducto.cantErroresCriticos = producto.cantidadErrores;
  newProducto.verifiRegSanINVIMA = producto.verifiRegSanINVIMA;
  newProducto.reviEtiquetaProducto = producto.reviEtiquetaProducto;
  newProducto.reviOrtografiaSellos = producto.reviOrtografiaSellos;
  newProducto.correspFabriExpediSani = producto.correspFabriExpediSani;
  newProducto.cumpleRecepcionTecnica = producto.cumpleRecepcionTecnica;
  newProducto.nivelInspeccionCode = nivelInspeccionTypeFactoryByChar(
    producto.nivelInspeccion
  ).getCode();
  newProducto.observacion = producto.observacion ? producto.observacion.trim() : null;

  const lotes: RTCLoteOrm[] = [];

  if (producto && producto.lotes) {
    producto.lotes.forEach(item => {
      const newLote = new RTCLoteOrm();
      if (item.id) newLote.id = item.id;
      newLote.cantidad = item.cantidad;
      newLote.fechaVencimiento = item.fechaVencimiento;
      newLote.lote = item.lote.trim();

      lotes.push(newLote);
    });
  }

  newProducto.tempLotes = lotes;

  return newProducto;
};
