import { GcmContextType } from '@common/domain/types';

export interface PDTExistenciaActualI {
  codigoAgrupamiento: string;
  nombreAgrupamiento: string;
  almacenId: number;
  almacenNombre: string;
  costoPromedio: number;
  stockMinimo: number;
  stockMaximo: number;
  puntoReposicion: number;
  existenciaActual: number;
  valorTotal: number;
  context: GcmContextType;
  detalle: PDTExistenciaActualI[];
}
export interface PDTExistenciaActualGI {
  codigoAgrupamiento: string;
  nombreAgrupamiento: string;
  existenciaActual: number;
  data: PDTExistenciaActualI[];
}
