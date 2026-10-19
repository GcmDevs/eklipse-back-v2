import { EstadoTanqueo, TipoCombustible } from '../enums';

export interface ResumenVehiculoRendimientoInsight {
  vehiculoId: number;
  placa?: string;
  rendimiento: number;
}

export interface ResumenCombustibleCantidadInsight {
  tipoCombustible: TipoCombustible;
  galones: number;
}

export interface ResumenPrecioCombustibleInsight {
  tipoCombustible: TipoCombustible;
  precioPromedioPorGalon: number;
}

export interface ResumenGastoVehiculoInsight {
  vehiculoId: number;
  placa?: string;
  totalGastado: number;
}

export interface ResumenTanqueosRead {
  totalFiltrado: number;
  totalValorPagado: number;
  totalCantidadCombustible: number;
  promedioRendimiento: number;
  porEstado: Record<EstadoTanqueo, number>;
  porTipoCombustible: Record<string, number>;
  costoPromedioPorKm: number | null;
  precioPromedioPorGalon: number | null;
  variacionPrecioVsPeriodoAnterior: number | null;
  consumoVehiculos: {
    mayorConsumo: ResumenVehiculoRendimientoInsight | null;
    menorConsumo: ResumenVehiculoRendimientoInsight | null;
  };
  combustibleComprado: {
    masComprado: ResumenCombustibleCantidadInsight | null;
    menosComprado: ResumenCombustibleCantidadInsight | null;
  };
  precioCombustible: {
    masCaro: ResumenPrecioCombustibleInsight | null;
    masBarato: ResumenPrecioCombustibleInsight | null;
  };
  gastoVehiculos: {
    mayorGasto: ResumenGastoVehiculoInsight | null;
    menorGasto: ResumenGastoVehiculoInsight | null;
  };
}
