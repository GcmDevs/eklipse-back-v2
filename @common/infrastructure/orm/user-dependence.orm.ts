import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import {
  _PrivSecDependenceOrm as _PrivSecDependenceOrm,
  RolDependenciaCode,
  RolDependenciaType,
  rolDependenciaTypeFactory,
} from './dependence.orm';
import { _PrivSecUserOrm } from './user.orm';

@Entity('EKGENUSUARIODEPEND')
export class _PrivSecUserDependenceOrm {
  @JoinColumn({ name: 'GENUSUARIO' })
  @PrimaryColumn({ name: 'GENUSUARIO', type: 'int' })
  @ManyToOne(() => _PrivSecUserOrm, user => user.dependences)
  user: _PrivSecUserOrm;

  @JoinColumn({ name: 'GENDEPEND' })
  @PrimaryColumn({ name: 'GENDEPEND', type: 'int' })
  @ManyToOne(() => _PrivSecDependenceOrm, dependence => dependence.users)
  dependence: _PrivSecDependenceOrm;

  @Column({ name: 'FUNCION' })
  roleCode: RolDependenciaCode;

  role: RolDependenciaType;

  setTypes(removeTypeCodes?: boolean) {
    this.role = rolDependenciaTypeFactory(this.roleCode);

    if (removeTypeCodes) {
      delete this.roleCode;
    }
  }
}
