import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ComprobanteEntradaOrm } from './comprobante-entrada/comprobante-entrada.orm';
import { RemisionEntradaOrm } from './remision-entrada/remision-entrada.orm';
import { UsuarioOrm } from './usuario.orm';

@Entity('INNDOCUME')
export class DocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IDTIPDOC' })
  tipoCode: number;

  @Column({ name: 'IDESTADO' })
  estadoCode: number;

  @Column({ name: 'IDCONSEC' })
  consecutivo: string;

  @Column({ name: 'IDFECDOC' })
  fecha: Date;

  @Column({ name: 'GENUSUARIO2' })
  creadoPorId: number;

  @ManyToOne(() => ComprobanteEntradaOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  comprobanteEntrada: ComprobanteEntradaOrm;

  @ManyToOne(() => RemisionEntradaOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  remisionEntrada: RemisionEntradaOrm;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO2', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'IDFECCRE' })
  fechaCreacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO3', referencedColumnName: 'id' }])
  confirmadoPor: UsuarioOrm;

  @Column({ name: 'IDFECCON' })
  fechaConfirmacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO4', referencedColumnName: 'id' }])
  anuladoPor: UsuarioOrm;

  @Column({ name: 'IDFECANU' })
  fechaAnulacion: Date;
}
