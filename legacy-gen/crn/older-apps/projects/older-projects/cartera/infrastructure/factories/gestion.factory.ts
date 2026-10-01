import { GestionModel } from '@crn/rft/cartera/application/models';
import { GestionResponse } from '../data-transfers';
import { CreateGestionDto } from '@crn/rft/cartera/presentation/dtos';
import { GestionOrm } from '../orm';

export const dataToGestionModel = (_: GestionResponse): GestionModel => {
  return {
    id: _.OID,
    usuario: {
      id: _.GENUSUARIO,
      cedula: _.USUNOMBRE,
      nombreCompleto: _.USUDESCRI,
    },
    createdAt: new Date(_.FECHA),
    tercero: {
      id: _.GENTERCER,
      nombre: _.TERNOMCOM.trim(),
      telefono: _.TELEFTERC,
      representante: {
        nombreCompleto: _.RESPTERC,
      },
    },
    motivoLlamada: _.MOTLLAMAD,
    observacion: _.OBSERVACION,
    fechaConciliacion: _.FECHCONCI ? new Date(_.FECHCONCI) : null,
    tipoConciliacion: _.TIPCONCI,
  };
};

export const dataToGestionOrm = (gestionDto: CreateGestionDto, authId: number): GestionOrm => {
  let fechaConciliacionActualizada: Date | null = null;

  if (gestionDto.fechaConciliacion) {
    const fechaConciliacion = new Date(gestionDto.fechaConciliacion).getTime();
    fechaConciliacionActualizada = new Date(fechaConciliacion + 36000000);
  }

  const gestion = new GestionOrm();

  gestion.createdAt = new Date();
  gestion.createdBy = authId;
  gestion.idTercero = gestionDto.idTercero;
  gestion.telefonoTercero = gestionDto.telefonoTercero;
  gestion.nombreRepresentanteTercero = gestionDto.nombreRepresentanteTercero;
  gestion.motivoLlamada = gestionDto.motivoLlamada;
  gestion.observacion = gestionDto.observacion;
  gestion.fechaConciliacion = fechaConciliacionActualizada;
  gestion.tipoConciliacion = gestionDto.tipoConciliacion;

  return gestion;
};
