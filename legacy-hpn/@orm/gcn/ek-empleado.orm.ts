import { TipoEmpleadoCode } from '@ctypes/gcn';
import { UsuarioOrm } from '@orm/gen';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('HPNGTCENTIDAD')
export class EkEmpleadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'DOCUMENTO' })
  documento: string;

  @Column({ name: 'TIPO' })
  tipoCode: TipoEmpleadoCode;

  /** @deprecated */
  isUsuario = false;
  /** @deprecated */
  usuario: UsuarioOrm;
  /** @deprecated */
  usuarioId: number;
}
