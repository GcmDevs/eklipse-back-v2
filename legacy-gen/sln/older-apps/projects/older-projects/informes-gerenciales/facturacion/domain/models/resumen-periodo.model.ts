export interface ResumenPeriodoModel {
  mes?: string;
  totalFacturado: number;
  facturadoEvento?: number;
  facturadoPGP: number;
  deficitPGP: number;
  registroPGP: number;
  anulacionesPosterioresTotalFacturado: number;
  anulacionesPosterioresRegistroPGP: number;
  totalRefacturado: number;
}

export interface ResumenPeriodoEntidadesModel {
  centro: string;
  facturado: number;
  refacturado: number;
  facturadoEventos: number;
  refacturadoEventos: number;
  facturadoPGP: number;
  refacturadoPGP: number;
  registroPGP: number;
  refacturadoRegistroPGP: number;
  deficitPGP: number;
  facturadoIncluyendoRegistroPGP: number;
  refacturadoIncluyendoRegistroPGP: number;
  anulacionesPosterioresTotalFacturado: number;
  anulacionesPosterioresRegistroPGP: number;
}
