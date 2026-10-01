import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UsuarioOrm } from './usuario.orm';
import { DependenciaOrm } from './dependencia.orm';
import {
  RolDependienteCode,
  RolDependienteType,
  rolDependienteTypeFactory,
} from '@ctypes/gen/dependencias/rol-dependiente';

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

  rol?: RolDependienteType;

  setTypes(removeTypeCodes?: boolean) {
    this.rol = rolDependienteTypeFactory(this.rolCode);

    if (removeTypeCodes) {
      delete this.rolCode;
    }
  }
}
