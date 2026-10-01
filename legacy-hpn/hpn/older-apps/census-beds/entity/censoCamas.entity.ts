import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'GCVHOSCENCAM' })
export class CensoCamas {
  @ViewColumn({ name: 'HPNDEFCAM' })
  defCama: number;

  @ViewColumn({ name: 'HCACODIGO' })
  codSubgrupoCama: string;

  @ViewColumn({ name: 'HCANOMBRE' })
  subgrupoCama: string;

  @ViewColumn({ name: 'HCAESTADO' })
  estadoCama: number;

  @ViewColumn({ name: 'HGRCODIGO' })
  idArea: string;

  @ViewColumn({ name: 'HGRNOMBRE' })
  nombreArea: string;

  @ViewColumn({ name: 'HSUCODIGO' })
  codArea: string;

  @ViewColumn({ name: 'HSUNOMBRE' })
  nombreCamas: string;

  @ViewColumn({ name: 'ADNINGRESO' })
  numIngreso: string;

  @ViewColumn({ name: 'AINCONSEC' })
  numConsecutivo: string;

  @ViewColumn({ name: 'AINESTADO' })
  ingresoEstado: number;

  @ViewColumn({ name: 'GENPACIEN' })
  codPaciente: string;

  @ViewColumn({ name: 'GPADOCPAC' })
  docPaiente: string;

  @ViewColumn({ name: 'GPANOMPAC' })
  nombrePaciente: string;

  @ViewColumn({ name: 'GDENOMBRE' })
  eps: string;

  @ViewColumn({ name: 'ADNCENATE' })
  idcentro: string;

  @ViewColumn({ name: 'ACANOMBRE' })
  centro: string;
}
