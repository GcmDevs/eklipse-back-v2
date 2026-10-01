import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FacturadoresOrm } from './facturadores';

@Entity(TABLE_NAMES.sln.ctegr.detalleFacturadores)
export class DetalleFacturadoresOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'FECHAASIGNACION' })
  fechaAsignacion: Date;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'ESTADO' })
  estado: number;

  @Column({ name: 'EKSLNEGRFACTUR' })
  facturadorId: number;

  @ManyToOne(() => FacturadoresOrm)
  @JoinColumn([{ name: 'EKSLNEGRFACTUR', referencedColumnName: 'id' }])
  facturador: FacturadoresOrm;
}
