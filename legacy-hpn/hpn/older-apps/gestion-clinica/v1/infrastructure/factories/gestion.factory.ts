import { ASIGNADA, ESTADOS_TRASLADO } from '@hpn/gestion-clinica/v1/domain/types';
import { SolicitudTrasladoOrm } from '../orm';
import { CreateGestionDto, TrasladoAmbulanciaDto } from '../../presentation/dtos';
import { GestionOrm } from '@hpn/gestion-clinica/v1/infrastructure/orm/gestion.orm';

export const dataToNewGestion = (data: CreateGestionDto, userId: number) => {
  const newGestion = new GestionOrm();
  newGestion.title = data.title;
  newGestion.content = data.content;
  newGestion.priority = data.priority;
  newGestion.patient = data.patient;
  newGestion.consecutive = data.consecutive;
  newGestion.area = data.area;
  newGestion.state = ASIGNADA.getCode();
  newGestion.updatedTimes = 0;
  // newGestion.reasignedTimes = 0;
  newGestion.createdAt = new Date();
  newGestion.createdBy = userId;
  return newGestion;
};

export const dataToNewSolicitudTraslado = (
  body: TrasladoAmbulanciaDto,
  gestion: GestionOrm,
  isTrasldoRedondo = false
) => {
  const newTraslado = new SolicitudTrasladoOrm();

  newTraslado.motivoTrasladoId = body.motTraslado.id;
  newTraslado.motivoTraslado = body.motTraslado;
  newTraslado.servicioDestinoId = body.servicioDestino.id;
  newTraslado.servicioDestino = body.servicioDestino;

  if (!isTrasldoRedondo) {
    newTraslado.centroOrigenId = body.lugarOrigenId;
    newTraslado.luagarOrigenNombre = body.lugarOrigen;
    newTraslado.deptoOrigenId = body.deptoOrigenId;
    newTraslado.municipioOrigenId = body.municipioOrigenId;
    newTraslado.direccionOrigen = body.direccionOrigen;

    newTraslado.centroDestinoId = body.lugarDestinoId;
    newTraslado.luagarDestinoNombre = body.lugarDestino;
    newTraslado.deptoDestinoId = body.deptoDestinoId;
    newTraslado.municipioDestinoId = body.municipioDestinoId;
    newTraslado.direccionDestino = body.direccionDestino;
  } else {
    newTraslado.centroOrigenId = body.lugarDestinoId;
    newTraslado.luagarOrigenNombre = body.lugarDestino;
    newTraslado.deptoOrigenId = body.deptoDestinoId;
    newTraslado.municipioOrigenId = body.municipioDestinoId;
    newTraslado.direccionOrigen = body.direccionDestino;

    newTraslado.centroDestinoId = body.lugarOrigenId;
    newTraslado.luagarDestinoNombre = body.lugarOrigen;
    newTraslado.deptoDestinoId = body.deptoOrigenId;
    newTraslado.municipioDestinoId = body.municipioOrigenId;
    newTraslado.direccionDestino = body.direccionOrigen;
  }

  newTraslado.tipoTraslado = body.tipoTraslado;
  newTraslado.traslado = body.tipo;
  newTraslado.estado = ESTADOS_TRASLADO.PENDIENTE.getCode();
  let soportes: string[] = [];
  body.tipoSoportes.forEach(sp => {
    soportes.push(sp.toString());
  });
  newTraslado.otroSoporteVital = body.otroSoporteVital;
  newTraslado.soportesVital = soportes.join('');

  newTraslado.gestionId = gestion.id;

  newTraslado.observacion = body.observaciones;

  newTraslado.epp = body.epp;

  newTraslado.fechaHoraTraslado = body.fechaHoraTraslado;

  return newTraslado;
};
