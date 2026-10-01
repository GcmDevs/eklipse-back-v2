import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { RadicacionOrm } from './radicacion.orm';
import { FacturaOrm } from './factura.orm';
import { UsuarioOrm } from './usuario.orm';

@Entity('CRNRADFACD')
export class DetalleRadicacionOrm {
  @PrimaryColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RadicacionOrm, radicacion => radicacion.detalle)
  @JoinColumn({ name: 'CRNRADFACC' })
  radicacion: RadicacionOrm;

  @OneToOne(() => FacturaOrm)
  @JoinColumn({ name: 'SLNFACTUR', referencedColumnName: 'id' })
  factura: FacturaOrm;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'CRNRADFACC' })
  radicacionId: number;

  @Column({ name: 'SLNFACTUR' })
  facturaId: number;

  get originalColumnName() {
    return 'CRNRADFACD';
  }
}
