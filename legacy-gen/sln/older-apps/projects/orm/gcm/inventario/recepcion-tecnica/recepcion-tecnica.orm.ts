import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { RecTecProductoOrm } from './producto.orm';
import { UsuarioOrm } from '@sln/old/orm/dim/general';
import { RecTecSugerenciaOrm } from './sugerencia.orm';

@Entity('GCMRECTEC')
export class RecepcionTecnicaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @Column({ name: 'FECHA' })
  createdAt: Date;

  @Column({ name: 'LABORATORIO' })
  laboratorio: number;

  @Column({ name: 'NUMFACTURA', length: 30 })
  numeroFactura: string;

  @Column({ name: 'NUMGUIA', length: 30 })
  numeroGuia: string;

  @Column({ name: 'TRANSPORTADORA' })
  transportadora: number;

  @Column({ name: 'OBSERVACION', length: 300 })
  observacion: string;

  @Column({ name: 'CONDTRANSPORTE' })
  condicionTransporte: number;

  @Column({ name: 'CUMPLERECTEC' })
  cumpleRecepcionTecnica: boolean;

  @Column({ name: 'EMBALAJE' })
  tipoEmbalaje: number;

  // RELACIONES
  @OneToMany(() => RecTecProductoOrm, productos => productos.recepcionTecnica)
  productos: RecTecProductoOrm[];

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @ManyToOne(() => RecTecSugerenciaOrm)
  @JoinColumn([{ name: 'LABORATORIO', referencedColumnName: 'id' }])
  laboratorioIJ: RecTecSugerenciaOrm;

  @ManyToOne(() => RecTecSugerenciaOrm)
  @JoinColumn([{ name: 'TRANSPORTADORA', referencedColumnName: 'id' }])
  transportadoraIJ: RecTecSugerenciaOrm;

  canBeUpdated?: boolean;
}
