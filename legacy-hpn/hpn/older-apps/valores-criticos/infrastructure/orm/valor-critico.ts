import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ConductaOrm } from './conducta';
import { PacienteOrm, UsuarioOrm } from '@hpn/old/orm/general';
import { EstanciaOrm } from '@hpn/old/orm/estancia.orm';
import {
  TipoAreaCode,
  tipoAreaFactory,
  TipoAreaType,
} from '@hpn/old/valores-criticos/domain/types';

@Entity('EKHPNREPVALCRI')
export class ValorCriticoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => EstanciaOrm)
  @JoinColumn([{ name: 'HPNESTANC', referencedColumnName: 'id' }])
  estancia: EstanciaOrm;

  @Column({ name: 'HPNESTANC' })
  estanciaId: number;

  @Column({ name: 'VALCRITICO', length: 1000 })
  valorCritico: string;

  @Column({ name: 'OBSERVACION', length: 1000 })
  observaciones: string;

  @Column({ name: 'AREAREPORT' })
  areaReportanteCode: TipoAreaCode;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUASIG', referencedColumnName: 'id' }])
  usuarioAsignado: UsuarioOrm;

  @Column({ name: 'GENUSUASIG' })
  usuarioAsignadoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'CREATEDBY', referencedColumnName: 'id' }])
  createdBy: UsuarioOrm;

  @Column({ name: 'CREATEDBY' })
  createdById: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;

  @Column({ name: 'CONDUCTA', length: 1000 })
  conducta: string;

  @Column({ name: 'FECHACIERRE' })
  fechaCierre: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'AUDITADOBY', referencedColumnName: 'id' }])
  auditadoBy: UsuarioOrm;

  @Column({ name: 'AUDITADOBY' })
  auditadoById: number;

  @Column({ name: 'AUDIOBSERVA', length: 1000 })
  audiobserva: string;

  @Column({ name: 'FECHAUDI' })
  fechaAudi: Date;

  @Column({ name: 'APROBAUDI' })
  isAprobado: boolean;

  @OneToMany(() => ConductaOrm, conducta => conducta.valorCritico)
  conductas: ConductaOrm[];

  areaReportante: TipoAreaType;

  setTypes(removeTypeCodes?: boolean) {
    this.areaReportante = tipoAreaFactory(this.areaReportanteCode);

    if (removeTypeCodes) {
      delete this.areaReportanteCode;
    }
  }

  get originalColumnName() {
    return 'EKHPNREPVALCRI';
  }
}
