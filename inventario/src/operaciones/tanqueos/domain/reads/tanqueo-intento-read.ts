import { CanalRegistro } from '../enums';
import { EstadoIntentoTanqueo } from '../enums/estados.enum';

export interface TanqueoIntentoRead {
  id: number;
  clienteUuid: string | null;
  idempotencyKey: string | null;
  usuarioId: number;
  dispositivoId: string | null;
  canalRegistro: CanalRegistro | null;
  operacion: string;
  payload: string;
  errorCodigo: string | null;
  errorMensaje: string | null;
  estado: EstadoIntentoTanqueo;
  tanqueoId: number | null;
  resueltoPorId: number | null;
  fechaResolucion: Date | null;
  fechaIntento: Date;
  createdAt: Date;
}
