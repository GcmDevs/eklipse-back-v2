import { AsignarUsuarioOrm } from './asignar-usuario';
import { CreatePendienteOrm } from './create-pendiente';
import { DetalleFacturadoresOrm } from './detalle-facturadores';
import { FacturadoresOrm } from './facturadores';
import { HistorialFacturadorOrm } from './historial-facturador';
import { RolFacturadorOrm } from './rol-facturador';

export * from './create-pendiente';

export const ORM_CONTROL_EGRESOS = [
  CreatePendienteOrm,
  AsignarUsuarioOrm,
  FacturadoresOrm,
  HistorialFacturadorOrm,
  RolFacturadorOrm,
  DetalleFacturadoresOrm,
];
