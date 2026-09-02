import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { IngresoOrm, PacienteOrm, ServicioIpsOrm, UsuarioOrm } from '@hpn/lgc/aud/orm/gen';
import { DiagnosticoOrm, EstanciaOrm } from '@hpn/lgc/aud/orm/temp';
import {
  ActorResponsableCode,
  ActorResponsableType,
  actorResponsableTypeFactory,
  CondicionEgresoCode,
  CondicionEgresoType,
  condicionEgresoTypeFactory,
  CriterioUCICode,
  CriterioUCIType,
  criterioUCITypeFactory,
  DestinoEgresoCode,
  DestinoEgresoType,
  destinoEgresoTypeFactory,
  EstanciaProlongadaErpUsuarioCode,
  estanciaProlongadaERPUsuarioFactory,
  EstanciaProlongadaErpUsuarioType,
  EstanciaProlongadaIpsCode,
  estanciaProlongadaIpsFactory,
  EstanciaProlongadaIpsType,
  EventoSeguridadClinicaType,
  FallaAtencionCode,
  FallaAtencionType,
  fallaAtencionTypeFactory,
  TipoHospitalizacionCode,
  TipoHospitalizacionType,
  tipoHospitalizacionTypeFactory,
  TipoIngreNacIPSCode,
  TipoIngreNacIPSType,
  tipoIngreNacIPSTypeFactory,
} from '@hpn/lgc/aud/types/hpn/auditoria';
import { CentroOrm } from '@hpn/lgc/aud/orm/adn';
import { MedicamentoTrazadorOrm } from './medicamento-trazador.orm';
import { EstudioDxOrm } from './estudio-dx.orm';
import { EstanciaInactivaOrm } from './estancia-inactiva.orm';
import { InternacionOrm } from './internacion.orm';
import { EventoSeguridadClinicaOrm } from './evento-seguridad-clinica.orm';
import { EkServicioIpsOrm } from './servicio-ips.orm';
import { EntidadBasicaRes } from '@common/infrastructure/responses';

@Entity(TABLE_NAMES.hpn.auditoria.index)
export class AuditoriaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: TABLE_NAMES.adn.ingresos, referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.pct.pacientes, referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: TABLE_NAMES.hpn.estancias.index })
  estanciaId: number;

  @ManyToOne(() => EstanciaOrm)
  @JoinColumn([{ name: TABLE_NAMES.hpn.estancias.index, referencedColumnName: 'id' }])
  estancia: EstanciaOrm;

  @Column({ name: 'ISESTANCIAINACTIVA' })
  isEstanciaInactiva: boolean;

  @Column({ name: 'MOTINGNACIPS' })
  motivoIngresoNacidoEnInstitucionCode: TipoIngreNacIPSCode;

  // INICIO NUEVOS
  @Column({ name: 'FALLATENCION' })
  fallaAtencionCode: FallaAtencionCode;

  @Column({ name: 'EVENSEGUCLIN' })
  isEventoSeguridadClinica: boolean;

  @Column({ name: 'GENDIAGNOS1' })
  diagnostico1Id: number;

  @ManyToOne(() => DiagnosticoOrm)
  @JoinColumn([{ name: 'GENDIAGNOS1', referencedColumnName: 'id' }])
  diagnostico1: DiagnosticoOrm;

  @Column({ name: 'GENDIAGNOS2' })
  diagnostico2Id: number;

  @ManyToOne(() => DiagnosticoOrm)
  @JoinColumn([{ name: 'GENDIAGNOS2', referencedColumnName: 'id' }])
  diagnostico2: DiagnosticoOrm;

  @Column({ name: 'GENDIAGNOS3' })
  diagnostico3Id: number;

  @ManyToOne(() => DiagnosticoOrm)
  @JoinColumn([{ name: 'GENDIAGNOS3', referencedColumnName: 'id' }])
  diagnostico3: DiagnosticoOrm;

  @Column({ name: 'GENSERIPS1' })
  servicio1Id: number;

  @ManyToOne(() => ServicioIpsOrm)
  @JoinColumn([{ name: 'GENSERIPS1', referencedColumnName: 'id' }])
  servicio1: ServicioIpsOrm;

  @Column({ name: 'GENSERIPS2' })
  servicio2Id: number;

  @ManyToOne(() => ServicioIpsOrm)
  @JoinColumn([{ name: 'GENSERIPS2', referencedColumnName: 'id' }])
  servicio2: ServicioIpsOrm;

  @Column({ name: 'GENSERIPS3' })
  servicio3Id: number;

  @ManyToOne(() => ServicioIpsOrm)
  @JoinColumn([{ name: 'GENSERIPS3', referencedColumnName: 'id' }])
  servicio3: ServicioIpsOrm;

  @Column({ name: 'EKGENSERIPS1' })
  ekGenserips1Id: number;

  @ManyToOne(() => EkServicioIpsOrm)
  @JoinColumn([{ name: 'EKGENSERIPS1', referencedColumnName: 'id' }])
  ekGenserips1: EkServicioIpsOrm;

  @Column({ name: 'EKGENSERIPS2' })
  ekGenserips2Id: number;

  @ManyToOne(() => EkServicioIpsOrm)
  @JoinColumn([{ name: 'EKGENSERIPS2', referencedColumnName: 'id' }])
  ekGenserips2: EkServicioIpsOrm;

  @Column({ name: 'EKGENSERIPS3' })
  ekGenserips3Id: number;

  @ManyToOne(() => EkServicioIpsOrm)
  @JoinColumn([{ name: 'EKGENSERIPS3', referencedColumnName: 'id' }])
  ekGenserips3: EkServicioIpsOrm;

  @Column({ name: 'EKGENSERIPS4' })
  ekGenserips4Id: number;

  @ManyToOne(() => EkServicioIpsOrm)
  @JoinColumn([{ name: 'EKGENSERIPS4', referencedColumnName: 'id' }])
  ekGenserips4: EkServicioIpsOrm;

  @Column({ name: 'TIPOHOSPITALIZACION' })
  tipoHospitalizacionCode: TipoHospitalizacionCode;

  @Column({ name: 'RESUMENCLINTERV' })
  resumenClinicoGestionIntervencion: string;

  @Column({ name: 'DESTINOEGRESO' })
  destinoEgresoCode: DestinoEgresoCode;

  @Column({ name: 'CONDICIONEGRESO' })
  condicionEgresoCode: CondicionEgresoCode;

  @OneToMany(() => MedicamentoTrazadorOrm, medicamentoTrazador => medicamentoTrazador.auditoria)
  medicamentosTrazadores: MedicamentoTrazadorOrm[];

  @OneToMany(() => InternacionOrm, internacion => internacion.auditoria)
  internaciones: InternacionOrm[];

  @OneToMany(() => EstanciaInactivaOrm, estanciaInactiva => estanciaInactiva.auditoria)
  estanciasInactivas: EstanciaInactivaOrm[];

  @OneToMany(() => EventoSeguridadClinicaOrm, evSegCli => evSegCli.auditoria)
  eventosSeguridadClinica: EventoSeguridadClinicaOrm[];

  @OneToMany(() => EstudioDxOrm, estudioDx => estudioDx.auditoria)
  estudiosDx: EstudioDxOrm[];

  @Column({ name: 'OBSSOLICIDX' })
  estudiosDxObservacion: string;

  @Column({ name: 'DIASESTANCIADX' })
  diasEstanciaDx: number;

  // FIN NUEVOS
  @Column({ name: 'EDADGESTMADR' })
  edadGestacionalMadre: number;

  @Column({ name: 'PESRECNACIDO', precision: 7, scale: 2 })
  pesoRecienNacido: number;

  @Column({ name: 'CRITERIUCI' })
  criterioUCICode: CriterioUCICode;

  @Column({ name: 'FECHANOVEGRESOS' })
  fechaNovedadEgresos: Date;

  @Column({ name: 'FECHASOLUCINOVE' })
  fechaSolucionNovedad: Date;

  @Column({ name: 'ACTORESPONSABLE' })
  actorResponsableCode: ActorResponsableCode;

  @Column({ name: 'CAUSESTANCPROLERPUSU' })
  causaEstanciaProlongadaErpUsuarioCode: EstanciaProlongadaErpUsuarioCode;

  @Column({ name: 'CAUSESTANCPROLERPUSU2' })
  causaEstanciaProlongadaErpUsuario2Code: EstanciaProlongadaErpUsuarioCode;

  @Column({ name: 'CAUSESTANCPROLERPUSU3' })
  causaEstanciaProlongadaErpUsuario3Code: EstanciaProlongadaErpUsuarioCode;

  @Column({ name: 'CAUSESTANCPROLIPS' })
  causaEstanciaProlongadaIpsCode: EstanciaProlongadaIpsCode;

  @Column({ name: 'CAUSESTANCPROLIPS2' })
  causaEstanciaProlongadaIps2Code: EstanciaProlongadaIpsCode;

  @Column({ name: 'CAUSESTANCPROLIPS3' })
  causaEstanciaProlongadaIps3Code: EstanciaProlongadaIpsCode;

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;

  motivoIngresoNacidoEnInstitucion: TipoIngreNacIPSType;
  criterioUCI: CriterioUCIType;
  fallaAtencion: FallaAtencionType;
  tipoHospitalizacion: TipoHospitalizacionType;
  actorResponsable: ActorResponsableType;

  causaEstanciaProlongadaErpUsuario: EstanciaProlongadaErpUsuarioType;
  causaEstanciaProlongadaErpUsuario2: EstanciaProlongadaErpUsuarioType;
  causaEstanciaProlongadaErpUsuario3: EstanciaProlongadaErpUsuarioType;

  causaEstanciaProlongadaIps: EstanciaProlongadaIpsType;
  causaEstanciaProlongadaIps2: EstanciaProlongadaIpsType;
  causaEstanciaProlongadaIps3: EstanciaProlongadaIpsType;

  condicionEgreso: CondicionEgresoType;
  destinoEgreso: DestinoEgresoType;

  evenSegCliClasificacionEvento1: EventoSeguridadClinicaType;

  contrato: EntidadBasicaRes;
  centro: CentroOrm;
  cama: EntidadBasicaRes;
  detalleContrato: EntidadBasicaRes;

  usuarioDocumento: string;

  nextAuditoriaIsEstanciaInactiva = false;
  fechaLimiteAuditoriaIsEstanciaInactiva: Date;

  setTypes(removeCodes: boolean) {
    if (this.motivoIngresoNacidoEnInstitucionCode) {
      this.motivoIngresoNacidoEnInstitucion = tipoIngreNacIPSTypeFactory(
        this.motivoIngresoNacidoEnInstitucionCode
      );
    }

    if (this.causaEstanciaProlongadaErpUsuarioCode) {
      this.causaEstanciaProlongadaErpUsuario = estanciaProlongadaERPUsuarioFactory(
        this.causaEstanciaProlongadaErpUsuarioCode
      );
    }

    if (this.causaEstanciaProlongadaErpUsuario2Code) {
      this.causaEstanciaProlongadaErpUsuario2 = estanciaProlongadaERPUsuarioFactory(
        this.causaEstanciaProlongadaErpUsuario2Code
      );
    }

    if (this.causaEstanciaProlongadaErpUsuario3Code) {
      this.causaEstanciaProlongadaErpUsuario3 = estanciaProlongadaERPUsuarioFactory(
        this.causaEstanciaProlongadaErpUsuario3Code
      );
    }

    if (this.causaEstanciaProlongadaIpsCode) {
      this.causaEstanciaProlongadaIps = estanciaProlongadaIpsFactory(
        this.causaEstanciaProlongadaIpsCode
      );
    }

    if (this.causaEstanciaProlongadaIps2Code) {
      this.causaEstanciaProlongadaIps2 = estanciaProlongadaIpsFactory(
        this.causaEstanciaProlongadaIps2Code
      );
    }

    if (this.causaEstanciaProlongadaIps3Code) {
      this.causaEstanciaProlongadaIps3 = estanciaProlongadaIpsFactory(
        this.causaEstanciaProlongadaIps3Code
      );
    }

    if (this.condicionEgresoCode) {
      this.condicionEgreso = condicionEgresoTypeFactory(this.condicionEgresoCode);
    }

    if (this.destinoEgresoCode) {
      this.destinoEgreso = destinoEgresoTypeFactory(this.destinoEgresoCode);
    }

    if (this.criterioUCICode) {
      this.criterioUCI = criterioUCITypeFactory(this.criterioUCICode);
    }

    if (this.fallaAtencionCode) {
      this.fallaAtencion = fallaAtencionTypeFactory(this.fallaAtencionCode);
    }

    if (this.tipoHospitalizacionCode) {
      this.tipoHospitalizacion = tipoHospitalizacionTypeFactory(this.tipoHospitalizacionCode);
    }

    if (this.actorResponsableCode) {
      this.actorResponsable = actorResponsableTypeFactory(this.actorResponsableCode);
    }

    if (removeCodes) {
      delete this.motivoIngresoNacidoEnInstitucionCode;
      delete this.criterioUCICode;
      delete this.fallaAtencionCode;
      delete this.tipoHospitalizacionCode;
      delete this.actorResponsable;
    }
  }
}
