import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Entity,
  Index,
} from 'typeorm';

import { UsuarioOrm } from '@inn/orm/gen';
import { CentroOrm } from '@inn/orm/adn';

@Entity('EKINNSOLPEBORR')
export class SolicitudPedidoBorradorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENUSUARIO1' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO1', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'SEDE' })
  sedeId: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'SEDE', referencedColumnName: 'id' }])
  sede: CentroOrm;

  @Column({ name: 'CONTEXTO', length: 50 })
  contexto: string;

  @Column({ name: 'DATOSJSON', type: 'nvarchar', length: 'MAX' })
  datosJson: string;

  @Column({ name: 'FECHACREAC' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAACTUALIZACION' })
  fechaActualizacion: Date;
}
