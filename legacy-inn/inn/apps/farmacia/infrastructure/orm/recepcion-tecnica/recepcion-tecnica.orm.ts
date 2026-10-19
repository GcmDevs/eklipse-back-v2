import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { RTCProductoOrm } from './producto.orm';
import { UsuarioOrm } from '../usuario.orm';
import { ComprobanteEntradaOrm } from '../comprobante-entrada/comprobante-entrada.orm';
import { CentroOrm } from '../centro.orm';
import { RTCSugerenciaOrm } from './sugerencia.orm';

@Entity('GCMRECTEC')
export class RecepcionTecnicaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @Column({ name: 'TIPDOCUME' })
  tipoDocumentoCode: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @Column({ name: 'FECHA' })
  createdAt: Date;

  @Column({ name: 'NUMFACTURA', length: 30 })
  numeroFactura: string;

  @Column({ name: 'TRANSPORTADORA' })
  transportadoraId: number;

  transportadora: RTCSugerenciaOrm;

  // RELACIONES
  @ManyToOne(() => ComprobanteEntradaOrm, compEntr => compEntr.recepcionesTecnicas)
  @JoinColumn({ name: 'INNDOCUME', referencedColumnName: 'id' })
  documento: ComprobanteEntradaOrm;

  @OneToMany(() => RTCProductoOrm, detalle => detalle.recepcionTecnica)
  detalle: RTCProductoOrm[];

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'ADNCENATE', referencedColumnName: 'id' }])
  centro: CentroOrm;

  canBeUpdated = true;
}
