import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { _PrivSecUserOrm } from './user.orm';
import { CtmType } from '../../domain/types';

export type RolDependenciaCode = 1 | 2 | 3 | 4 | 5;

export class RolDependenciaType extends CtmType<RolDependenciaCode> {}

const DIRECTOR = new RolDependenciaType(1, 'DIRECTOR');
const SUBDIRECTOR = new RolDependenciaType(2, 'SUBDIRECTOR');
const COORDINADOR = new RolDependenciaType(3, 'COORDINADOR');
const LIDER = new RolDependenciaType(4, 'LIDER');
const COLABORADOR = new RolDependenciaType(5, 'COLABORADOR');

export function rolDependenciaTypeFactory(code: RolDependenciaCode): RolDependenciaType {
  switch (code) {
    case 1:
      return DIRECTOR;
    case 2:
      return SUBDIRECTOR;
    case 3:
      return COORDINADOR;
    case 4:
      return LIDER;
    case 5:
      return COLABORADOR;
  }
}

export const ROL_DEPENDIENTES = { DIRECTOR, SUBDIRECTOR, COORDINADOR, LIDER, COLABORADOR };

export const ROL_DEPENDIENTES_VALUES = [DIRECTOR, SUBDIRECTOR, COORDINADOR, LIDER, COLABORADOR];

@Entity({ name: 'GENDEPEND' })
export class _PrivSecDependenceOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDPCODIGO' })
  code: string;

  @Column({ name: 'GDPNOMBRE' })
  name: string;

  @ManyToMany(() => _PrivSecUserOrm, user => user.dependences)
  users: _PrivSecUserOrm[];

  role?: RolDependenciaType;
}
