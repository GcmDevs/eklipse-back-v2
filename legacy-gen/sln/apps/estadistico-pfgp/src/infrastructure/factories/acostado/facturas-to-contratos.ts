import { EstanciaOrm } from '@sln/orm/hpn';
import { ServicioIpsOrm } from '../../orm';
import { IngresoOrm } from '@sln/orm/adn';

export interface ACOSContratoI {
  idContrato: number;
  codigoContrato: string;
  nombreContrato: string;
  cantidadIteracciones: number;
  ingresos: IngresoOrm[];
  iteracciones: ACOSIteraccionI[];
  totalFacturado: number;
  totalContratado: number;
  totalDiferencia: number;
  totalDisponibilidad: number;
  porcentajeDiferencia: number;
  porcentajeEjecutado: number;
}

export interface ACOSIteraccionI {
  consecutivoIngreso: number;
  nombreCompletoPaciente: string;
  documentoPaciente: string;
  fechaIngreso: Date;
  diasEstancia: number;
  codigoCama: string;
  nombreCama: string;
  nombreTipoIngreso: string;
  totalFacturado: number;
  servicios: ServicioIpsOrm[];
  estancias: EstanciaOrm[];
}

export interface ACOSAgrupadorI {
  id: number;
  peso: number;
  nombre: string;
  totalFacturado: number;
  totalRecuperado: number;
  cantidadIteracciones: number;
  iteracciones: ACOSIteraccionI[];
  limite: number;
  cantidadEventosContratados: number;
  diferenciaEventos: number;
  CMEFacturado: number;
  CMEContratado: number;
  totalDiferencia: number;
  porcentajeDiferencia: number;
  porcentajeEjecutado: number;
}
