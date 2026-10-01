import { RecepcionTecnicaOrm, RecTecProductoOrm } from './recepcion-tecnica';
import { RecTecSugerenciaOrm } from './recepcion-tecnica/sugerencia.orm';
import { OrdenSuministroRecibidaModificadaOrm } from './suministros';

export const GCM_INVENTARIO_ENTITIES = [
  RecepcionTecnicaOrm,
  RecTecProductoOrm,
  RecTecSugerenciaOrm,
  OrdenSuministroRecibidaModificadaOrm,
];
