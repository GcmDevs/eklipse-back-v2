import { GestionOrm } from '@hpn/gestion-clinica/v1/infrastructure/orm/gestion.orm';
import { CreateManagementDto } from '../dtos/management.dto';
import { Estado } from '../enums/estado.enum';

export const dataToNewGestion = (data: CreateManagementDto, userId: number) => {
  const newGestion = new GestionOrm();
  newGestion.title = data.title;
  newGestion.content = data.content;
  newGestion.priority = data.priority;
  newGestion.patient = data.patient;
  newGestion.consecutive = data.consecutive;
  newGestion.area = data.area;
  newGestion.state = Estado.ASIGNADA;
  newGestion.updatedTimes = 0;
  // newGestion.reasignedTimes = 0;
  newGestion.createdAt = new Date();
  newGestion.createdBy = userId;

  return newGestion;
};
