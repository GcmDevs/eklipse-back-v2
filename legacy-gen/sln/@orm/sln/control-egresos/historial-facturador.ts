import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@sln/orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FacturadoresOrm } from './facturadores';

@Entity(TABLE_NAMES.sln.ctegr.historialFacturadores)
export class HistorialFacturadorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKSLNEGRFACTUR' })
  facturadorId: number;

  @ManyToOne(() => FacturadoresOrm)
  @JoinColumn([{ name: 'EKSLNEGRFACTUR', referencedColumnName: 'id' }])
  facturador: FacturadoresOrm;

  @Column({ name: 'ESTADOANTERIOR' })
  estadoAnterior: boolean;

  @Column({ name: 'ESTADONUEVO' })
  estadoNuevo: boolean;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'USUARIOCAMBIO' })
  usuarioCambioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUARIOCAMBIO', referencedColumnName: 'id' }])
  usuarioCambio: UsuarioOrm;
}
