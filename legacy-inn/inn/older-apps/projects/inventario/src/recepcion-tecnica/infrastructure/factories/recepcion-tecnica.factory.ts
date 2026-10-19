import { RecepcionTecnicaOrm, RecTecProductoOrm } from '@inn/old/inn/recepcion-tecnica/orm';
import {
  DISPOSITIVO,
  NivelInspeccionTypeFactoryByChar,
} from '@inn/old/inn/recepcion-tecnica/domain/types';
import {
  NewRecTecDto,
  NewProductoRecTecDto,
  ItemProdDto,
} from '@inn/old/inn/recepcion-tecnica/presentation/dtos';
import { RecTecLoteOrm } from '../../orm/recepcion-tecnica/lote.orm';

export const dataToRecepcionTecnica = (
  response: NewRecTecDto,
  userAuthId: number,
  ordenCompraId?: number
): RecepcionTecnicaOrm => {
  const rt = new RecepcionTecnicaOrm();

  if (response.id) rt.id = response.id;
  if (!response.id) {
    rt.createdAt = new Date();
    rt.centroId = response.centroId;
  }
  /*   rt.condicionTransporte = response.condicionTransporte; */
  rt.usuarioId = userAuthId;

  rt.laboratorioId = response.laboratorio;
  rt.numeroFactura = response.numeroFactura;
  rt.numeroGuia = response.numeroGuia;
  rt.observacion = response.observacion;
  /*   rt.tipoEmbalaje = response.tipoEmbalaje; */
  rt.transportadoraId = response.transportadora;
  if (ordenCompraId) rt.ordenCompraId = ordenCompraId;

  return rt;
};

export const dataToRecepcionTecnicaProducto = (
  producto: NewProductoRecTecDto,
  recepcionTecnica: RecepcionTecnicaOrm
): RecTecProductoOrm => {
  const newProducto = new RecTecProductoOrm();
  if (producto.id) newProducto.id = producto.id;
  newProducto.cantidadRecibida = producto.cantidadEntregada;
  newProducto.estado = producto.estado;

  newProducto.concentracion = producto.concentracion;
  newProducto.unidadMedidaConcentracionId = producto.unidadMedidaConcentracion;
  newProducto.formaFarmaceuticaId = producto.formaFarmaceutica;

  newProducto.numSerie = producto.numeroSerie;
  newProducto.vidaUtil = producto.vidaUtil;

  newProducto.cum = producto.cum;
  newProducto.marca = producto.marca;
  newProducto.tipoProveedor = producto.tipoProveedor;
  newProducto.laboratorioId = producto.laboratorio;
  newProducto.productoId = producto.producto;
  newProducto.presentacionId = producto.presentacion;
  newProducto.recepcionTecnica = recepcionTecnica;
  newProducto.registroInvima = producto.registroInvima;
  newProducto.estadoRegistroInvima = producto.estadoRegistroInvima;
  newProducto.temperatura = producto.temperatura;
  newProducto.unidadMedidaTemperaturaId = producto.unidadMedidaTemperatura;
  newProducto.tipo = producto.tipoProducto;
  newProducto.riesgoId = producto.riesgoProducto;
  newProducto.tamanioMuestra = producto.tamanioMuestra;
  newProducto.cantErroresCriticos = producto.cantErrCriticos;
  newProducto.cantErroresMayores = producto.cantErrMayores;
  newProducto.cantErroresMenores = producto.cantErrMenores;
  newProducto.cumpleRecepcionTecnica = producto.cumpleRecepcionTecnica;
  newProducto.nivelInspeccionId = NivelInspeccionTypeFactoryByChar(
    producto.nivelInspeccion
  ).getCode();

  const lotes: RecTecLoteOrm[] = [];
  let cantidad = 0;

  producto.items.forEach(item => {
    const newLote = new RecTecLoteOrm();
    if (item.id) newLote.id = item.id;
    newLote.cantidad = item.cantidad;
    newLote.fechaVencimiento = item.fecha;
    newLote.lote = item.lote;

    cantidad += item.cantidad;

    lotes.push(newLote);
  });

  newProducto.cantidad = cantidad;
  newProducto.tempLotes = lotes;

  return newProducto;
};
