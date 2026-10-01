import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EntidadOrm } from './entidad.orm';
import { MotivoTrasladoOrm } from './mot-traslado.orm';
import { EmpleadoOrm } from './empleado.orm';
import { AsignacionVehiculoOrm } from './asignacion-vehiculo.orm';
import { NotaOrm } from './nota.orm';
import { ServicioOrm } from './servicio-destino.orm';
import { SignoVitalOrm } from './signo-vital.orm';
import { EkEmpleadoOrm } from './ek-empleado.orm';
import { EstadoTrasladoTypeCode } from '@ctypes/gcn';
import { MunicipioOrm, DepartamentoOrm, UsuarioOrm } from '@orm/gen';
import { GestionOrm } from './gestion.orm';
import { UsuarioModel } from '@gestion-clinica/gestiones/domain/models';

@Entity({ name: 'GCMHPNSOLITRASLADO' })
export class SolicitudTrasladoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => EntidadOrm)
  @JoinColumn([{ name: 'CENTRORIGEN', referencedColumnName: 'id' }])
  centroOrigen: EntidadOrm;

  @Column({ name: 'CENTRORIGEN' })
  centroOrigenId: number;

  @Column({ name: 'LUGARORIGEN' })
  luagarOrigenNombre: string;

  @Column({ name: 'DIRECORIGEN' })
  direccionOrigen: string;

  @ManyToOne(() => MunicipioOrm)
  @JoinColumn([{ name: 'MUNIORIGEN', referencedColumnName: 'id' }])
  municipioOrigen: MunicipioOrm;

  @Column({ name: 'MUNIORIGEN' })
  municipioOrigenId: number;

  @ManyToOne(() => DepartamentoOrm)
  @JoinColumn([{ name: 'DEPTORIGEN', referencedColumnName: 'id' }])
  deptoOrigen: DepartamentoOrm;

  @Column({ name: 'DEPTORIGEN' })
  deptoOrigenId: number;

  @ManyToOne(() => EntidadOrm)
  @JoinColumn([{ name: 'CENTRODESTINO', referencedColumnName: 'id' }])
  centroDestino: EntidadOrm;

  @Column({ name: 'CENTRODESTINO' })
  centroDestinoId: number;

  @Column({ name: 'LUGARDESTINO' })
  luagarDestinoNombre: string;

  @Column({ name: 'DIRECDESTINO' })
  direccionDestino: string;

  @ManyToOne(() => MunicipioOrm)
  @JoinColumn([{ name: 'MUNIDESTINO', referencedColumnName: 'id' }])
  municipioDestino: MunicipioOrm;

  @Column({ name: 'MUNIDESTINO' })
  municipioDestinoId: number;

  @ManyToOne(() => DepartamentoOrm)
  @JoinColumn([{ name: 'DEPTODESTINO', referencedColumnName: 'id' }])
  deptoDestino: DepartamentoOrm;

  @Column({ name: 'DEPTODESTINO' })
  deptoDestinoId: number;

  @Column({ name: 'TIPOTRASLADO' })
  tipoTraslado: number;

  @Column({ name: 'TRASLADO' })
  traslado: number;

  @Column({ name: 'SOPORTESVITAL' })
  soportesVital: string;

  @Column({ name: 'OBSERVA' })
  observacion: string;

  @Column({ name: 'EPP' })
  epp: boolean;

  @OneToOne(() => GestionOrm, gestion => gestion.solicitudAmbulancia)
  @JoinColumn([{ name: 'HPNGESTI', referencedColumnName: 'id' }])
  gestion: GestionOrm;

  @Column({ name: 'HPNGESTI' })
  gestionId: number;

  @ManyToOne(() => MotivoTrasladoOrm)
  @JoinColumn([{ name: 'MOTTRASLADO', referencedColumnName: 'id' }])
  motivoTraslado: MotivoTrasladoOrm;

  @Column({ name: 'SERVDESTINO' })
  servicioDestinoId: number;

  @ManyToOne(() => ServicioOrm)
  @JoinColumn([{ name: 'SERVDESTINO', referencedColumnName: 'id' }])
  servicioDestino: ServicioOrm;

  @Column({ name: 'MOTTRASLADO' })
  motivoTrasladoId: number;

  @Column({ name: 'NOMACOMP' })
  nombreAcompanante: string;

  @Column({ name: 'DOCTACOMP' })
  documentoAcompanante: string;

  @Column({ name: 'MEDICO' })
  medicoId: number;

  @ManyToOne(() => EkEmpleadoOrm)
  @JoinColumn([{ name: 'MEDICO', referencedColumnName: 'id' }])
  medico: EkEmpleadoOrm;

  @Column({ name: 'OBSERVACION' })
  observacionCompletado: string;

  @Column({ name: 'ISDELETE' })
  isReasignate: boolean;

  @Column({ name: 'ESTADO' })
  estado: EstadoTrasladoTypeCode;

  @Column({ name: 'GESTIASIGVEHI' })
  asigVehiculoId: number;

  @ManyToOne(() => AsignacionVehiculoOrm)
  @JoinColumn([{ name: 'GESTIASIGVEHI', referencedColumnName: 'id' }])
  asigVehiculo: AsignacionVehiculoOrm;

  @Column({ name: 'FECHORATRANSLADO', type: 'datetime' })
  fechaHoraTraslado: Date;

  @Column({ name: 'FECFINTRANSLAUX', type: 'datetime' })
  fechaFinTraslado: Date;

  @Column({ name: 'FECINICIALTRANSLAUX', type: 'datetime' })
  fechaInicioTraslado: Date;

  @Column({ name: 'SIGNOVITAL' })
  signoVitalId: number;

  @ManyToOne(() => SignoVitalOrm)
  @JoinColumn([{ name: 'SIGNOVITAL', referencedColumnName: 'id' }])
  signoVital: SignoVitalOrm;

  @Column({ name: 'FINALIZADOPOR' })
  finalizadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'FINALIZADOPOR', referencedColumnName: 'id' }])
  finalizadoPor: UsuarioOrm;

  @Column({ name: 'FINALIZADOPORCENTRO' })
  finalizadoPorCentro: number;

  @Column({ name: 'RECIBIDOPOR' })
  recibidoPorId: number;

  @ManyToOne(() => EkEmpleadoOrm)
  @JoinColumn([{ name: 'RECIBIDOPOR', referencedColumnName: 'id' }])
  recibidoPor: EkEmpleadoOrm;

  @Column({ name: 'FINALIZADOBSERVA' })
  finalizadObservacion: string;

  @Column({ name: 'INSTITNIT' })
  nitInstitucion: string;

  @Column({ name: 'INSTITNOMBRE' })
  nombreInstitucion: string;

  @Column({ name: 'CANCELADOPOR' })
  canceladoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'CANCELADOPOR', referencedColumnName: 'id' }])
  canceladoPor: UsuarioOrm;

  @Column({ name: 'CANCELADOPORCENTRO' })
  canceladoPorCentro: number;

  @Column({ name: 'CANCOBSERVA' })
  cancObservacion: string;

  @Column({ name: 'CANCFECHA' })
  fechaCancelacion: Date;

  empleados: EmpleadoOrm[] = [];

  auxiliar: UsuarioModel;

  conductor: UsuarioModel;

  vehiculo: string;

  centros: EntidadOrm[] = [];

  @OneToMany(() => NotaOrm, obs => obs.solicitud)
  observaciones: NotaOrm[];
}
