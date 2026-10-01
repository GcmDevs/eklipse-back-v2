import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CamaOrm } from './cama.orm';
import { UsuarioOrm } from './general';
import { EstadoCamaCode, MotivoBloqueoCode } from '../types';

@Entity('EKHPNRESERCAM')
export class SolicitudReferenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'VARENTITYOID' })
  solicitudId: number;

  @Column({ name: 'ORIGENSOLICI' })
  origenSolicitudCode: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn([{ name: 'HPNDEFCAM', referencedColumnName: 'id' }])
  cama: CamaOrm;

  @Column({ name: 'HPNDEFCAM' })
  CamaId: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'CREATEDBY', referencedColumnName: 'id' }])
  createdBy: UsuarioOrm;

  @Column({ name: 'CREATEDBY' })
  createdById: number;

  @Column({ name: 'ANULADAAT' })
  anuladaAt: Date;

  @Column({ name: 'ANULADABY' })
  anuladaById: number;

  @Column({ name: 'ORIGINALESTADO' })
  estadoOriginalCode: EstadoCamaCode;

  @Column({ name: 'ORIGINALBLOPOR' })
  motivoBloqueoOriginalCode: MotivoBloqueoCode;

  @Column({ name: 'MOTIVANULA' })
  motivoAnulacion: number;

  @Column({ name: 'ACTIVA' })
  isActiva: boolean;

  @Column({ name: 'ANULAOBSERVACION' })
  anulacionObservacion: string;

  @Column({ name: 'TIPOAISLAMIENTOS' })
  tipoAislamiento: string;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  setTypes(removeTypeCodes?: boolean) {}

  get originalColumnName() {
    return 'EKHPNRESERCAM';
  }
}
