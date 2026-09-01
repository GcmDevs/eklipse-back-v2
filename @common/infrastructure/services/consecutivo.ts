import { GCM_CONTEXTS, GcmContextType } from '../../domain/types';

/**
 * Genera consecutivos con formato factura (...000000000..)
 * @param preffix Primer parte del consecutivo
 * @param id Ultima parte del consecutivo
 * @param length Tamaño final del consecutivo
 * @returns
 */
export const generate = (preffix: string, id: number, length = 14) => {
  const zeros = length - (preffix.length + `${id}`.length);
  let zerosConcatenated = '';
  for (let i = 0; i < zeros; i++) zerosConcatenated += '0';
  return `${preffix}${zerosConcatenated}${id}`;
};

/**
 * Genera consecutivos con formato factura (...000000000..) apartir del consecutivo abreviado
 * @param consecutivo
 * @param length Tamaño final del consecutivo
 * @returns
 */
export const autocomplete = (consecutivo: string, length = 14) => {
  const filtered = consecutivo.replace(/[^ 0-9]/g, '_');
  const splitted = filtered.split('_').filter(el => el);
  const id = splitted[splitted.length - 1];
  return generate(`${consecutivo.replace(id, '')}`, +id, length).toUpperCase();
};

/** Aplica para casos en que se traen entidades de multiples DB */
export const idWithContext = (id: number, context: GcmContextType, centroId: number) => {
  switch (context) {
    case GCM_CONTEXTS.ALTACENTRO: {
        if (centroId === 1) return `CM${id}`;
        else if (centroId === 2) return `AC${id}`;
        else if (centroId === 3) return `CPS${id}`;
        else return `DEV${id}`;
    }
    case GCM_CONTEXTS.AGUACHICA: return `AGU${id}`;
    case GCM_CONTEXTS.AMMEDICAL: return `AM${id}`;
    case GCM_CONTEXTS.SANJUAN: return `SJ${id}`;
    case GCM_CONTEXTS.VALLEDUPAR: return `VDP${id}`;
    default: return `DEV${id}`;
  }
};

export const consecutivosServices = { generate, autocomplete, idWithContext };
