import { GcmContexts } from '@common/application/constants';

export interface FacturacionTerceroMesModel {
  mes?: string;
  idCentro?: number;
  nombreCentro?: string;
  contexto?: GcmContexts;
  facturacion: FacturacionTerceroModel[];
}

export interface FacturacionTerceroModel {
  id: number;
  nombre: number;
  totalFacturas: number;
  total: number;
  totalRefacturado: number;
  totalFactRefacturadas: number;
}
