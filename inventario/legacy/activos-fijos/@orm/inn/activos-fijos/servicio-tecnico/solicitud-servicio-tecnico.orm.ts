import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@inn/lgc/afn/orm/gen/usuario.orm';
import { CentroOrm } from '@inn/lgc/afn/orm/adn';
import { DependenciaOrm } from '@inn/lgc/afn/orm/gen';
import { SSTItemOrm } from './item.orm';
import { SSTNotaOrm } from './nota.orm';
import { PrioridadCode } from '@inn/lgc/afn/types/gen';

@Entity(TABLE_NAMES.inn.afn.svt.solicitudes)
export class SolicitudServicioTecnicoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: TABLE_NAMES.adn.centros })
  centroId: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: TABLE_NAMES.adn.centros, referencedColumnName: 'id' }])
  centro: CentroOrm;

  @Column({ name: TABLE_NAMES.gen.dependencias })
  dependenciaId: number;

  @ManyToOne(() => DependenciaOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.dependencias, referencedColumnName: 'id' }])
  dependencia: DependenciaOrm;

  @Column({ name: 'DESCRIUBI' })
  ubicacion: string;

  @Column({ name: 'PRIORIDAD' })
  prioridadCode: PrioridadCode;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  creadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @OneToMany(() => SSTItemOrm, detalle => detalle.solicitud)
  detalle: SSTItemOrm[];

  @OneToMany(() => SSTNotaOrm, notas => notas.solicitud)
  notas: SSTNotaOrm[];
}
