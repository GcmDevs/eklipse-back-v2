import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SOLICITUDES_RECHAZADAS_ESTADOS_CODES } from '@inn/lgc/ctc/application/constants';
import {
  prioridadTypeFactory,
  estadoTypeFactory,
  tipoTypeFactory,
  PrioridadCode,
  EstadoCode,
  TipoCode,
  PrioridadType,
  TipoType,
  EstadoType,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { DetalleSolicitudOrm } from './detalle-solicitud.orm';
import { CambioEstadoOrm } from './cambio-estado.orm';
import { DependenciaOrm, UsuarioOrm } from '@inn/lgc/ctc/orm/gen';
import { CotizacionOrm } from './cotizacion.orm';
import { CentroOrm } from '@inn/lgc/ctc/orm/adn';

@Entity('EKINNCTCSOLI')
export class SolicitudOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PRIORIDAD' })
  prioridadCode: PrioridadCode;

  @Column({ name: 'TIPO' })
  tipoCode: TipoCode;

  @Column({ name: 'JUSTIFICACION' })
  justificacion: string;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoCode;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;

  @Column({ name: 'DELETED' })
  isDeleted: boolean;

  @Column({ name: 'FINISHED' })
  isFinished: boolean;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'ADNCENATE', referencedColumnName: 'id' }])
  centro: CentroOrm;

  @Column({ name: 'GENDEPEND' })
  dependenciaId: number;

  @ManyToOne(() => DependenciaOrm)
  @JoinColumn([{ name: 'GENDEPEND', referencedColumnName: 'id' }])
  dependencia: DependenciaOrm;

  @Column({ name: 'GENDEPENDEST' })
  dependenciaDestinoId: number;

  @ManyToOne(() => DependenciaOrm)
  @JoinColumn([{ name: 'GENDEPENDEST', referencedColumnName: 'id' }])
  dependenciaDestino: DependenciaOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'ISCOTIZUNICA' })
  isCotizacionUnica: boolean;

  @Column({ name: 'ISPACAJMEN' })
  isPagoPorCajaMenor: boolean;

  @Column({ name: 'ISPACAJMENEXPRE' })
  isPagoPorCajaMenorExpress: boolean;

  @OneToMany(() => DetalleSolicitudOrm, detalle => detalle.solicitud)
  detalle: DetalleSolicitudOrm[];

  @OneToMany(() => CotizacionOrm, cotizacion => cotizacion.solicitud)
  cotizaciones: CotizacionOrm[];

  @OneToMany(() => CambioEstadoOrm, cambioEstado => cambioEstado.solicitud)
  cambiosEstado: CambioEstadoOrm[];

  tipo: TipoType;
  estado: EstadoType;
  prioridad: PrioridadType;
  keyForTables: string;

  authInSameContext = false;
  cotizacionRecomendadaAprobadaByMe = false;

  setTypes(removeTypeCodes?: boolean) {
    this.prioridad = prioridadTypeFactory(this.prioridadCode);
    this.estado = estadoTypeFactory(this.estadoCode) as any;
    this.tipo = tipoTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.prioridadCode;
      delete this.estadoCode;
      delete this.tipoCode;
    }
  }

  wasRejected() {
    return SOLICITUDES_RECHAZADAS_ESTADOS_CODES.indexOf(this.estadoCode) >= 0;
  }
}
