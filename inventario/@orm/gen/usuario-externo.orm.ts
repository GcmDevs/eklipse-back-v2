import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('GENUSUEXT')
export class UsuarioExternoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DOCUMENTO' })
  cedula: string;

  @Column({ name: 'NOMCOM' })
  nombreCompleto: string;
}
