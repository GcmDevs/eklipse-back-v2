import { UsuarioOrm } from '@inn/orm/gen';
import { EstanciaOrm } from '@inn/orm/hpn';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CustomDevolucionDetalleOrm } from './detalle-devolucion.orm';
import { TipoDevolucionCode } from '@inn/docs/sumpac/domain/types';

@Entity('EKINNSUMDEVCTM')
export class CustomDevolucionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TIPO' })
  tipoCode: TipoDevolucionCode;

  @Column({ name: 'FECHAREG' })
  fecha: Date;

  @ManyToOne(() => EstanciaOrm)
  @JoinColumn([{ name: 'HPNESTANC', referencedColumnName: 'id' }])
  estancia: EstanciaOrm;

  @Column({ name: 'HPNESTANC' })
  estanciaId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO1', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'GENUSUARIO1' })
  creadoPorId: number;

  @OneToMany(() => CustomDevolucionDetalleOrm, detalle => detalle.devolucion)
  detalle: CustomDevolucionDetalleOrm[];
}
