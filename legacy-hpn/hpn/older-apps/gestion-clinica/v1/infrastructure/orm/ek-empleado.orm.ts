import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TipoEmpleadoCode } from '../../domain/types';
import { UsuarioOrm } from '@hpn/old/orm/general';

@Entity('HPNGTCENTIDAD')
export class EkEmpleadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'DOCUMENTO' })
  documento: string;

  @Column({ name: 'TELEFONO' })
  telefono: string;

  @Column({ name: 'TIPO' })
  tipoCode: TipoEmpleadoCode;

  /** @deprecated */
  isUsuario = false;
  /** @deprecated */
  usuario: UsuarioOrm;
  /** @deprecated */
  usuarioId: number;
}
