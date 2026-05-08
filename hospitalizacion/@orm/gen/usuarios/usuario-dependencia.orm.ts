import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { RolDependienteCode } from '@ctypes/gen/dependencias';
import { DependenciaOrm } from '../dependencia.orm';
import { UsuarioOrm } from './usuario.orm';

@Entity('EKGENUSUARIODEPEND')
export class UsuarioDependenciaOrm {
  @JoinColumn({ name: 'GENUSUARIO' })
  @PrimaryColumn({ name: 'GENUSUARIO' })
  @ManyToOne(() => UsuarioOrm, usuario => usuario.dependencias)
  usuario: UsuarioOrm;

  @JoinColumn({ name: 'GENDEPEND' })
  @PrimaryColumn({ name: 'GENDEPEND' })
  @ManyToOne(() => DependenciaOrm, dependencia => dependencia.usuarios)
  dependencia: DependenciaOrm;

  @Column({ name: 'FUNCION' })
  rolCode: RolDependienteCode;
}
