import { GCM_CONTEXTS, GcmContexts, GcmContextType } from '@common/domain/types';

export interface ClinicaSeleccionadaI {
  nombre: string;
  nit: string;
  contexto: GcmContextType;
}

export interface ProveedorI {
  nombre: string;
  nit: string;
  ciudad: string;
  direccion: string;
  telefono: string;
}

export interface AlmacenI {
  codigo: string;
  nombre: string;
}

export interface DetalleI {
  codigo: string;
  nombre: string;
  cantidad: number;
  valorUnitario: number;
  valorSubtotal: number;
}

export const clinicaSeleccionada = (contexto: GcmContexts) => {
  return contexto === GcmContexts.ALTACENTRO
    ? { nombre: '', nit: '824001041-6', contexto: GCM_CONTEXTS.ALTACENTRO }
    : contexto === GcmContexts.AGUACHICA
      ? { nombre: '', nit: '900772387-1', contexto: GCM_CONTEXTS.AGUACHICA }
      : contexto === GcmContexts.AMMEDICAL
        ? { nombre: 'AM MEDICAL S.A.S.', nit: '900106694-2', contexto: GCM_CONTEXTS.AMMEDICAL }
        : contexto === GcmContexts.SANJUAN
          ? { nombre: '', nit: '900272582-6', contexto: GCM_CONTEXTS.SANJUAN }
          : contexto === GcmContexts.VALLEDUPAR
            ? { nombre: '', nit: '892300708-1', contexto: GCM_CONTEXTS.VALLEDUPAR }
            : { nombre: '', nit: '900106694-2', contexto: GCM_CONTEXTS.ALTACENTRO };
};
