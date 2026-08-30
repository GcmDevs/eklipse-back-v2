import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SolicitudServicioTecnicoOrm } from './solicitud-servicio-tecnico.orm';
import { TABLE_NAMES } from '@common/application/constants';
import {
  AfnClaseSerTecCode,
  AfnTipoSerTecCode,
  AfnTipoSolSerTecCode,
  EstadoAfnItemSolSerTecCode,
  TipoRequerimientoContratoSolSerTecCode,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { ActivoOrm } from '../activo.orm';
import { SSTNotaOrm } from './nota.orm';
import { IngresoOrm, UsuarioOrm } from '@inn/lgc/afn/orm/gen';

@Entity(TABLE_NAMES.inn.afn.svt.items)
export class SSTItemOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TIPOSERVITECN' })
  tipoServicioTecnicoCode: AfnTipoSerTecCode;

  @Column({ name: 'CLASERVITECN' })
  claseServicioTecnicoCode: AfnClaseSerTecCode;

  @Column({ name: 'TIPOMANTENIMI' })
  tipoMantenimientoCode: AfnTipoSolSerTecCode;

  @Column({ name: TABLE_NAMES.inn.afn.svt.solicitudes })
  solicitudId: number;

  @ManyToOne(() => SolicitudServicioTecnicoOrm, solicitud => solicitud.detalle)
  @JoinColumn({ name: TABLE_NAMES.inn.afn.svt.solicitudes })
  solicitud: SolicitudServicioTecnicoOrm;

  @Column({ name: TABLE_NAMES.inn.afn.activos })
  activoId: number;

  @ManyToOne(() => ActivoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.afn.activos, referencedColumnName: 'id' }])
  activo: ActivoOrm;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: TABLE_NAMES.adn.ingresos, referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @OneToMany(() => SSTNotaOrm, notas => notas.itemSolicitud)
  notas: SSTNotaOrm[];

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoAfnItemSolSerTecCode;

  @Column({ name: 'ISFALLAINUSOCLINICO' })
  isFallaInUsoClinico: boolean;

  @Column({ name: 'ISPACIENTELESIONADO' })
  isPacienteLesionadoByEquipo: boolean;

  @Column({ name: 'FECHAAPROXREQU' })
  fechaLimReq: Date;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  atendidoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  atendidoPor: UsuarioOrm;

  @Column({ name: 'FECHAINIATEN' })
  fechaInicioAtencion: Date;

  @Column({ name: 'FECHAFINATEN' })
  fechaFinalAtencion: Date;

  @Column({ name: 'TIEMPOHORASORDIAS' })
  tiempoHorasOrDias: number;

  @Column({ name: 'FORMATOTIEMPO' })
  formatoTiempo: number;

  @Column({ name: 'FECHATENPROGRAMADA' })
  fechaAtencionProgramada: Date;

  @Column({ name: 'TIPOTAREA' })
  isTipoTarea: boolean;

  @Column({ name: 'IMG1' })
  img1Link: string;

  @Column({ name: 'IMG2' })
  img2Link: string;

  @Column({ name: 'REQUERIMIENTO' })
  requerimientoCode: TipoRequerimientoContratoSolSerTecCode;

  isAceptadaByAutor: boolean;
}
