import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SolicitudServicioTecnicoOrm } from './solicitud-servicio-tecnico.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { SSTItemOrm } from './item.orm';
import { UsuarioOrm } from '@inn/lgc/afn/orm/gen';
import { EstadoAfnItemSolSerTecCode } from '@inn/lgc/afn/types/inn/activos-fijos';

@Entity(TABLE_NAMES.inn.afn.svt.notas)
export class SSTNotaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: TABLE_NAMES.inn.afn.svt.solicitudes })
  solicitudId: number;

  @ManyToOne(() => SolicitudServicioTecnicoOrm, solicitud => solicitud.notas)
  @JoinColumn({ name: TABLE_NAMES.inn.afn.svt.solicitudes })
  solicitud: SolicitudServicioTecnicoOrm;

  @Column({ name: TABLE_NAMES.inn.afn.svt.items })
  itemSolicitudId: number;

  @ManyToOne(() => SSTItemOrm, item => item.notas)
  @JoinColumn({ name: TABLE_NAMES.inn.afn.svt.items })
  itemSolicitud: SSTItemOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  creadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'NOTA' })
  nota: string;

  @Column({ name: 'VISTO' })
  isVisto: boolean;

  @Column({ name: TABLE_NAMES.inn.afn.svt.notas, nullable: true })
  notaRelacionadaId: number;

  @ManyToOne(() => SSTNotaOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.afn.svt.notas, referencedColumnName: 'id' }])
  notaRelacionada: SSTNotaOrm;

  @Column({ name: 'APROBADO', nullable: true })
  isAprobado: boolean;

  @Column({ name: 'NOTAPRINCIPAL', nullable: true })
  isNotaPrincipal: boolean;

  @Column({ name: 'ESTADO', nullable: true })
  estadoCode: EstadoAfnItemSolSerTecCode;

  @Column({ name: 'IMG1' })
  img1Link: string;

  @Column({ name: 'IMG2' })
  img2Link: string;
}
