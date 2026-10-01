import { TABLE_NAMES } from "@common/application/constants";
import { BaseTimestampedOrm } from "@common/infrastructure/orm";
import { MotivoEjecucionExternaExcepcional, TipoEjecutorExterno } from "@equipos/domain/enums";
import { AnexoOrm, TerceroOrm, } from "@orm/cor";
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { RegistroActividadOrm } from "./registro-actividad.orm";

@Entity({ name: TABLE_NAMES.inn.eqp.actividades.ejecuciones_externas })
@Index('UQ_EKINNEQPACTREGSEJECUCIONEXTERNA_REGACT', ['registroActividadId'])
@Check('CHK_EKINNEQPACTREGSEJECUCIONEXTERNA_EMPRESA', `([TIPOEJECUTOR] <> 'EMPRESA_CON_TECNICO') OR ([EMPRESATERCEROOID] IS NOT NULL)`)
@Check('CHK_EKINNEQPACTREGSEJECUCIONEXTERNA_EXCEPCIONAL', `([ESEXCEPCIONAL] = 0) OR ([MOTIVOEXCEPCIONAL] IS NOT NULL)`)
export class EjecucionExternaOrm extends BaseTimestampedOrm {
  @OneToOne(() => RegistroActividadOrm, (reg) => reg.ejecucionExterna, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'REGACTIVIDADOID' })
  registroActividad: RegistroActividadOrm;

  @Column({ name: 'REGACTIVIDADOID', insert: false, update: false })
  registroActividadId: number;

  @Column({ name: 'TIPOEJECUTOR', type: 'nvarchar', length: 30 })
  tipoEjecutor: TipoEjecutorExterno;

  @Column({ name: 'TECNICONOMBRE', type: 'nvarchar', length: 100 })
  tecnicoNombre: string;

  @ManyToOne(() => TerceroOrm, { nullable: true })
  @JoinColumn({ name: 'TERCEROTECNICOOID' })
  terceroTecnico: TerceroOrm | null;

  @Column({ name: 'TERCEROTECNICOOID', nullable: true, insert: false, update: false })
  terceroTecnicoId: number | null;

  @ManyToOne(() => TerceroOrm, { nullable: true })
  @JoinColumn({ name: 'EMPRESATERCEROOID' })
  empresaTercero: TerceroOrm | null;

  @Column({ name: 'EMPRESATERCEROOID', nullable: true, insert: false, update: false })
  empresaTerceroId: number | null;

  @Column({ name: 'EMPRESANOMBRE', type: 'nvarchar', length: 150, nullable: true })
  empresaNombre: string | null;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 600, nullable: true })
  observaciones: string | null;

  @Column({ name: 'ESEXCEPCIONAL', type: 'bit', default: false })
  esExcepcional: boolean;

  @Column({ name: 'MOTIVOEXCEPCIONAL', type: 'nvarchar', length: 40, nullable: true })
  motivoExcepcional: MotivoEjecucionExternaExcepcional | null;

  @Column({ name: 'MOTIVOEXCEPCIONALDETALLE', type: 'nvarchar', length: 400, nullable: true })
  motivoExcepcionalDetalle: string | null;

  @Column({ name: 'FECHAEJECUCION', type: 'date', nullable: false })
  fechaEjecucion: Date;

  anexos: AnexoOrm[];
}
