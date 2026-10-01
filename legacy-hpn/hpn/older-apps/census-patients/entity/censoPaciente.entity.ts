import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'GCVHOSCENPAC' })
export class CensoPacientes {
  @ViewColumn({ name: 'HPNESTANC' })
  numEstancia: number;

  @ViewColumn({ name: 'ADNINGRESO' })
  numIngreso: string;

  @ViewColumn({ name: 'AINCONSEC' })
  numConsecutivo: string;

  @ViewColumn({ name: 'AINFECING' })
  fechaIngreso: Date;

  @ViewColumn({ name: 'AINURGCON' })
  ainurgcon: number;

  @ViewColumn({ name: 'AINCAUING' })
  aincaing: number;

  @ViewColumn({ name: 'GENPRESAL' })
  genpresal: number;

  @ViewColumn({ name: 'PRECODIGO' })
  precodigo: string;

  @ViewColumn({ name: 'PRENOMBRE' })
  prenombre: string;

  @ViewColumn({ name: 'HESFECSAL' })
  fechaSalida: Date;

  @ViewColumn({ name: 'AINDIAEST' })
  diasEstancia: number;

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

  @ViewColumn({ name: 'GCMHOSCAN' })
  gcmjoscan: number;

  @ViewColumn({ name: 'GCMUNCUIN' })
  gcmuncuin: number;

  @ViewColumn({ name: 'GCMUCICAN' })
  gcmuncucican: number;

  @ViewColumn({ name: 'GENARESER' })
  genareser: number;

  @ViewColumn({ name: 'GASCODIGO' })
  gascodigo: number;

  @ViewColumn({ name: 'GASNOMBRE' })
  gasnombre: number;

  @ViewColumn({ name: 'GENPACIEN' })
  codPaciente: string;

  @ViewColumn({ name: 'GPADOCPAC' })
  docPaiente: string;

  @ViewColumn({ name: 'GPANOMPAC' })
  nombrePaciente: string;

  @ViewColumn({ name: 'GPAEDAPAC' })
  edadPaciente: number;

  @ViewColumn({ name: 'GPASEXPAC' })
  sexoPaciente: number;

  @ViewColumn({ name: 'GPAESTPAC' })
  estratoPaciente: string;

  @ViewColumn({ name: 'GPATIPAFI' })
  tipoafiliado: number;

  @ViewColumn({ name: 'GPADIRECC' })
  direccionPaciente: string;

  @ViewColumn({ name: 'GPATELEFO' })
  telefonoPaciente: string;

  @ViewColumn({ name: 'GPAMUNPAC' })
  municipioPaciente: string;

  @ViewColumn({ name: 'AINACONOM' })
  acompañante: string;

  @ViewColumn({ name: 'AINACOTEL' })
  telefonoAcompañante: string;

  @ViewColumn({ name: 'AINACUNOM' })
  acudiente: string;

  @ViewColumn({ name: 'AINACUTEL' })
  telefonoAcuendiente: string;

  @ViewColumn({ name: 'AINACUPAR' })
  parentezco: string;

  @ViewColumn({ name: 'GENDIAGNO' })
  idDiagnostico: number;

  @ViewColumn({ name: 'DIACODIGO' })
  codDiagnostico: number;

  @ViewColumn({ name: 'DIANOMBRE' })
  nombreDiagnostico: string;

  @ViewColumn({ name: 'GENDETCON' })
  gendetcon: number;

  @ViewColumn({ name: 'GDECODIGO' })
  codEps: number;

  @ViewColumn({ name: 'GDENOMBRE' })
  eps: string;

  @ViewColumn({ name: 'ADNCENATE' })
  idcentro: string;

  @ViewColumn({ name: 'ACANOMBRE' })
  centro: string;
}
