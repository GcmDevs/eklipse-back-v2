import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'EKHPNESTPROUSUARIO' })
export class GestorEstanciaProlongadaUsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUARIOID' })
  usuarioId: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'CARGO' })
  cargo: string;

  @Column({ name: 'NUMEROTELEFONO' })
  numeroTelefono: string;

  @Column({ name: 'CORREO' })
  correo: string;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'USUARIOCREACION' })
  usuarioCreacionId: number;

  @Column({ name: 'FECHAMODIFICACION' })
  fechaModificacion: Date;

  @Column({ name: 'USUARIOMODIFICACION' })
  usuarioModificacionId: number;

  @Column({ name: 'ESTADO' })
  estado: boolean;
}
