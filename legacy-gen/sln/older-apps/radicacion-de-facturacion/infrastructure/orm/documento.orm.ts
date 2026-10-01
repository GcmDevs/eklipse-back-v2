import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrm } from './usuario.orm';

@Entity('CRNDOCUME')
export class DocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CDCONSEC' })
  consecutivo: number;

  @Column({ name: 'CDTIPDOC' })
  tipoCode: number;

  @Column({ name: 'CDFECDOC' })
  fecha: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO1', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'GENUSUARIO1' })
  creadoPorId: number;

  @Column({ name: 'CDFECCRE' })
  fechaCreacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO2', referencedColumnName: 'id' }])
  confirmadoPor: UsuarioOrm;

  @Column({ name: 'GENUSUARIO2' })
  confirmadoPorId: number;

  @Column({ name: 'CDFECCON' })
  fechaConfirmacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO3', referencedColumnName: 'id' }])
  anuladoPor: UsuarioOrm;

  @Column({ name: 'GENUSUARIO3' })
  anuladoPorId: number;

  @Column({ name: 'CDFECANU' })
  fechaAnulacion: Date;

  get originalColumnName() {
    return 'CRNDOCUME';
  }
}
