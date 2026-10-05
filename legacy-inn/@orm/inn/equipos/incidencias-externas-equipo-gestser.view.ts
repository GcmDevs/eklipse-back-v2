import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'VW_GESTIONSER_GESACTIVOS_INC', synchronize: false })
export class IncidenciasExternasEquiposGestserView {
  @PrimaryColumn({ name: 'SOLICITUDOID', type: 'int' })
  solicitudId: number;

  @ViewColumn({ name: 'ADNCENATE' })
  adnCenAte: number;

  @ViewColumn({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @ViewColumn({ name: 'UBICACION' })
  ubicacion: string;

  @ViewColumn({ name: 'PRIORIDAD' })
  prioridad: number;

  @ViewColumn({ name: 'USUARIOSOLICITAOID' })
  usuarioSolicitaId: number;

  @ViewColumn({ name: 'USUARIOSOLICITADOC' })
  usuarioSolicitaDocumento: string;

  @ViewColumn({ name: 'USUARIOSOLICITANOMBRE' })
  usuarioSolicitaNombre: string;

  @ViewColumn({ name: 'DEPENDENCIAOID' })
  dependenciaId: number;

  @ViewColumn({ name: 'DEPENDENCIA' })
  dependencia: string;

  @ViewColumn({ name: 'ITEMOID' })
  itemId: number;

  @ViewColumn({ name: 'ACTIVOOID' })
  activoId: number;

  @ViewColumn({ name: 'PLACA' })
  placa: string;

  @ViewColumn({ name: 'ADNINGRESO' })
  adnIngreso: number | null;

  @ViewColumn({ name: 'OBSERVACION' })
  observacion: string;

  @ViewColumn({ name: 'TIPOSERVITECN' })
  tipoServicioTecnico: number;

  @ViewColumn({ name: 'CLASERVITECN' })
  claseServicioTecnico: number | null;

  @ViewColumn({ name: 'TIPOMANTENIMI' })
  tipoMantenimiento: number;

  @ViewColumn({ name: 'TIPOTAREA' })
  tipoTarea: number | null;

  @ViewColumn({ name: 'TIPOTAREADESC' })
  tipoTareaDescripcion: string;

  @ViewColumn({ name: 'ESTADO' })
  estado: number;

  @ViewColumn({ name: 'ESTADODESC' })
  estadoDescripcion: string;
}
