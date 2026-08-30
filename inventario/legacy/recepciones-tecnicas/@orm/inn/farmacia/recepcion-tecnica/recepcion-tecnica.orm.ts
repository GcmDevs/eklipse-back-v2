import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { DetalleRecepcionTecnicaOrm } from './recepcion-tecnica.detalle.orm';
import { ComprobanteEntradaOrm } from '@inn/lgc/rct/orm/inn/documentos';
import { TABLE_NAMES } from '@common/application/constants';
import { RTCSugerenciaOrm } from './sugerencia.orm';
import { UsuarioOrm } from '@inn/lgc/rct/orm/gen';
import { CentroOrm } from '@inn/lgc/rct/orm/adn';

@Entity(TABLE_NAMES.inn.fmc.rct.recepcionesTecnicas)
export class RecepcionTecnicaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @Column({ name: 'TIPDOCUME' })
  tipoDocumentoCode: number;

  @Column({ name: 'FECHA' })
  createdAt: Date;

  @Column({ name: 'NUMFACTURA', length: 30 })
  numeroFactura: string;

  @Column({ name: 'CUMPLERECTEC' })
  noRequiereRecepTec: boolean;

  @Column({ name: 'TRANSPORTADORA' })
  transportadoraId: number;

  transportadora: RTCSugerenciaOrm;

  @ManyToOne(() => ComprobanteEntradaOrm, compEntr => compEntr.recepcionesTecnicas)
  @JoinColumn({ name: TABLE_NAMES.inn.dcm.documentos, referencedColumnName: 'id' })
  documento: ComprobanteEntradaOrm;

  @OneToMany(() => DetalleRecepcionTecnicaOrm, detalle => detalle.recepcionTecnica)
  detalle: DetalleRecepcionTecnicaOrm[];

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioId: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: TABLE_NAMES.adn.centros, referencedColumnName: 'id' }])
  centro: CentroOrm;

  @Column({ name: TABLE_NAMES.adn.centros })
  centroId: number;

  isCompleted = false;
  canBeUpdated = true;
}
