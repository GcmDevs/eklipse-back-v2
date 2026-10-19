import {
  CreateRecepcionTecnicaRequest,
  RecepcionTecnicaProductoRequest,
} from '@inn/rft/inventario/recepcion-tecnica/presentation/requests';
import {
  RecepcionTecnicaOrm,
  RecTecProductoOrm,
} from '@inn/old/orm/gcm/inventario/recepcion-tecnica';

export const dataToRecepcionTecnica = (
  response: CreateRecepcionTecnicaRequest,
  userAuthId: number
): RecepcionTecnicaOrm => {
  const rt = new RecepcionTecnicaOrm();

  if (response.id) rt.id = response.id;
  if (!response.id) rt.createdAt = new Date();
  rt.condicionTransporte = response.condicionTransporte;
  rt.usuarioId = userAuthId;
  rt.centroId = response.centroId;
  rt.cumpleRecepcionTecnica = response.cumpleRecepcionTecnica;
  rt.laboratorio = response.laboratorio;
  rt.numeroFactura = response.numeroFactura;
  rt.numeroGuia = response.numeroGuia;
  rt.observacion = response.observacion;
  rt.tipoEmbalaje = response.tipoEmbalaje;
  rt.transportadora = response.transportadora;

  return rt;
};

export const dataToRecepcionTecnicaProducto = (
  producto: RecepcionTecnicaProductoRequest,
  recepcionTecnica: RecepcionTecnicaOrm
): RecTecProductoOrm => {
  const newProducto = new RecTecProductoOrm();
  if (producto.id) newProducto.id = producto.id;
  newProducto.cantidad = producto.cantidad;
  newProducto.concentracion = producto.concentracion;
  newProducto.unidadMedidaConcentracion = producto.unidadMedidaConcentracion;
  newProducto.cum = producto.cum;
  newProducto.estado = producto.estado;
  newProducto.fechaVencimiento = producto.fechaVencimiento;
  newProducto.formaFarmaceutica = producto.formaFarmaceutica;
  newProducto.laboratorio = producto.laboratorio;
  newProducto.lote = producto.lote;
  newProducto.productoId = producto.producto;
  newProducto.presentacion = producto.presentacion;
  newProducto.recepcionTecnica = recepcionTecnica;
  newProducto.registroInvima = producto.registroInvima;
  newProducto.estadoRegistroInvima = producto.estadoRegistroInvima;
  newProducto.temperatura = producto.temperatura;
  newProducto.unidadMedidaTemperatura = producto.unidadMedidaTemperatura;

  return newProducto;
};
