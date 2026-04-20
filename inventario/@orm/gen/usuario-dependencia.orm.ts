import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { RolDependienteCode } from '@inn/types/gen/dependencias';
import { DependenciaOrm } from './dependencia.orm';
import { UsuarioOrm } from './usuario.orm';

@Entity('EKGENUSUARIODEPEND')
export class UsuarioDependenciaOrm {
  @JoinColumn({ name: 'GENUSUARIO' })
  @PrimaryColumn({ name: 'GENUSUARIO', type: 'int' })
  @ManyToOne(() => UsuarioOrm, usuario => usuario.dependencias)
  usuario: UsuarioOrm;

  @JoinColumn({ name: 'GENDEPEND' })
  @PrimaryColumn({ name: 'GENDEPEND', type: 'int' })
  @ManyToOne(() => DependenciaOrm, dependencia => dependencia.usuarios)
  dependencia: DependenciaOrm;

  @Column({ name: 'FUNCION' })
  rolCode: RolDependienteCode;
}
