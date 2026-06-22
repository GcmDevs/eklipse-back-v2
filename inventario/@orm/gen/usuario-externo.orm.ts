import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKGENUSUARIO')
export class UsuarioExternoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DOCUMENTO' })
  documento: string;

  @Column({ name: 'NOMCOM' })
  nombreCompleto: string;
}
