import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import {
  RolDependienteCode,
  RolDependienteType,
  rolDependienteTypeFactory,
} from '@inn/lgc/ctc/types/gen/dependencias';
import { DependenciaOrm, UsuarioOrm } from '@inn/lgc/ctc/orm/gen';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.gen.usu.dependencias)
export class UsuarioDependenciaOrm {
  @JoinColumn({ name: TABLE_NAMES.gen.usu.usuarios })
  @PrimaryColumn({ name: TABLE_NAMES.gen.usu.usuarios, type: 'int' })
  @ManyToOne(() => UsuarioOrm, usuario => usuario.dependencias)
  usuario: UsuarioOrm;

  @JoinColumn({ name: TABLE_NAMES.gen.dependencias })
  @PrimaryColumn({ name: TABLE_NAMES.gen.dependencias, type: 'int' })
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
