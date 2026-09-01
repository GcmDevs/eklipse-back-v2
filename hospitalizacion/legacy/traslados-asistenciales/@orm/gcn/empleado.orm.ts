import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('GCMHPNUSUARIO')
export class EmpleadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DOCUMENTO' })
  documento: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'TIPOUSUARIO' })
  tipoEmpleadoCode: number;

  @Column({ name: 'CREADOPOR' })
  creadoPorId: number;

  @Column({ name: 'FECHA' })
  fechaCreacion: Date;

  @Column({ name: 'CENTRO' })
  centroId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  asigVehiculoId: number;

  isUsuario = false;
}
