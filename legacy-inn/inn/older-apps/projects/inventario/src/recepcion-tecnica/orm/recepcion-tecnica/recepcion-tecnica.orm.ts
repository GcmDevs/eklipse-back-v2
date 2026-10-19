import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { RecTecProductoOrm } from './producto.orm';
import { UsuarioOrm } from '../general/usuario.orm';
import { CentroOSRD, SugerenciaOSRD } from '../shared-db';
import { InnDocumentoOrm } from '@inn/old/inn/orm/dim';

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

  @Column({ name: 'INNDOCUME' })
  ordenCompraId: number;

  @ManyToOne(() => InnDocumentoOrm)
  @JoinColumn([{ name: 'INNDOCUME', referencedColumnName: 'id' }])
  ordenCompra: InnDocumentoOrm;

  @Column({ name: 'LABORATORIO' })
  laboratorioId: number;

  @Column({ name: 'NUMFACTURA', length: 30 })
  numeroFactura: string;

  @Column({ name: 'NUMGUIA', length: 30 })
  numeroGuia: string;

  @Column({ name: 'TRANSPORTADORA' })
  transportadoraId: number;

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

  laboratorio?: SugerenciaOSRD;
  transportadora?: SugerenciaOSRD;
  centro?: CentroOSRD;
  canBeUpdated?: boolean;
}
