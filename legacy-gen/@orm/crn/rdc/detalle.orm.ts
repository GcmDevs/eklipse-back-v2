import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { RadicacionOrm } from './radicacion.orm';
import { UsuarioOrm } from '../../gen/usuario.orm';
import { FacturaOrm } from '../../sln/factura.orm';

@Entity(TABLE_NAMES.crn.rdc.detalle)
export class DetalleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @OneToOne(() => FacturaOrm, factura => factura.detalleRadicacion)
  @JoinColumn([{ name: TABLE_NAMES.sln.facturas, referencedColumnName: 'id' }])
  factura: FacturaOrm;

  @Column({ name: TABLE_NAMES.sln.facturas })
  facturaId: number;

  @ManyToOne(() => RadicacionOrm)
  @JoinColumn([{ name: TABLE_NAMES.crn.rdc.radicaciones, referencedColumnName: 'id' }])
  radicacion: RadicacionOrm;

  @Column({ name: TABLE_NAMES.crn.rdc.radicaciones })
  radicacionId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioId: number;
}
