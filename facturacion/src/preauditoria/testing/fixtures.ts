import { randomUUID } from 'node:crypto';
import { ADMIN_AUTHORITY } from '../../../../@common/application/constants';
import { Actor, Auditoria, PacienteIngreso } from '../domain/modelo';
export const actorPrueba: Actor = {
  id: 7,
  nombre: 'Usuario de prueba',
  contexto: 'ALTACENTRO',
  permisos: [ADMIN_AUTHORITY],
};
export function pacientePrueba(): PacienteIngreso {
  return {
    oid: 123,
    ingreso: '1234',
    pacienteId: 42,
    nombre: 'Paciente de prueba',
    documento: '00123456',
    tipoDocumento: 'CC',
    centroId: 1,
    centro: 'Centro de prueba',
    fechaIngreso: '2026-10-01T10:00:00',
    fechaEgreso: null,
    entidadCodigo: 'EPS',
    entidad: 'Entidad de prueba',
    estadoClinico: 0,
  };
}
export function auditoriaPrueba(cambios: Partial<Auditoria> = {}): Auditoria {
  return {
    id: randomUUID(),
    contexto: 'ALTACENTRO',
    paciente: pacientePrueba(),
    valor: 1000,
    recibido: '2026-10-01T15:00:00.000Z',
    registrado: '2026-10-01T15:00:00.000Z',
    recibidoPor: 7,
    responsableId: 7,
    responsable: 'Usuario de prueba',
    asignado: '2026-10-01T16:00:00.000Z',
    iniciado: null,
    auditado: null,
    ultimaFinalizacion: null,
    entregado: null,
    primeraEntrega: null,
    estado: 'Pendiente',
    version: 1,
    actualizado: '2026-10-01T16:00:00.000Z',
    notas: '',
    facturador: '',
    hallazgos: [],
    revision: 0,
    correccion: false,
    esperaMotivo: '',
    esperaDesde: null,
    reapertura: null,
    reasignacion: null,
    correccionDesde: null,
    anulacionMotivo: '',
    prefactura: {
      sha256: 'a'.repeat(64),
      bytes: 100,
      metodo: 'automatico',
      netoDetectado: 1000,
      justificacion: '',
      identidadConfirmada: true,
    },
    ...cambios,
  };
}
