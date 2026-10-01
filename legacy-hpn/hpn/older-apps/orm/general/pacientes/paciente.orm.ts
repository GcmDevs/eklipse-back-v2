import {
  TipoDocumentoCode,
  GeneroCode,
  tipoDocumentoTypeFactory,
  generoTypeFactory,
  EstadoCivilCode,
  estadoCivilTypeFactory,
  TipoAfiliadoCode,
  tipoAfiliadoTypeFactory,
  CapacidadPagoCode,
  capacidadPagoTypeFactory,
  ZonaCode,
  zonaTypeFactory,
  EstadoPacienteCode,
  estadoPacienteTypeFactory,
} from '@hpn/old/types/general';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { TelefonoOrm } from './telefono.orm';
import { DireccionOrm, PaisOrm } from '../ubicacion';
import { EstratoOrm } from './estrato.orm';
import { CtmType } from '@common/domain/types';
import { DetalleContratoOrm } from '../terceros';
import { IngresoOrm } from './ingreso.orm';

@Entity('GENPACIEN')
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACTIPDOC' })
  tipoDocumentoCode: TipoDocumentoCode;

  @Column({ name: 'PACNUMDOC' })
  numeroDoc: string;

  @Column({ name: 'GPAFECEXP' })
  fechaExpDoc: Date;

  @Column({ name: 'PACEXPEDI' })
  lugarExpDoc: string;

  @Column({ name: 'PACPRINOM', length: 200 })
  primerNombre: string;

  @Column({ name: 'PACSEGNOM', length: 30, nullable: true })
  segundoNombre: string;

  @Column({ name: 'PACPRIAPE', length: 30, nullable: true })
  primerApellido: string;

  @Column({ name: 'PACSEGAPE', length: 30, nullable: true })
  segundoApellido: string;

  @Column({ name: 'GPANOMCOM' })
  nombreCompleto: string;

  @Column({ name: 'GPAEMAIL' })
  email: string;

  @Column({ name: 'GPAFECNAC' })
  fechaNacimiento: Date;

  @Column({ name: 'GPASEXPAC' })
  generoCode: GeneroCode;

  @OneToOne(() => EstratoOrm)
  @JoinColumn([{ name: 'GENESTRATO', referencedColumnName: 'id' }])
  estrato: EstratoOrm;

  @Column({ name: 'GENESTRATO' })
  estratoId: number;

  @OneToOne(() => PaisOrm)
  @JoinColumn([{ name: 'GENPAIS', referencedColumnName: 'id' }])
  pais: PaisOrm;

  @Column({ name: 'GENPAIS' })
  paisId: number;

  @OneToMany(() => DireccionOrm, direccion => direccion.paciente)
  @JoinColumn([{ name: 'GENPACIEND', referencedColumnName: 'id' }])
  direccion: DireccionOrm;

  @Column({ name: 'GENPACIEND' })
  direccionId: number;

  @OneToMany(() => TelefonoOrm, telefono => telefono.paciente)
  @JoinColumn([{ name: 'GENPACIENT', referencedColumnName: 'id' }])
  telefono: TelefonoOrm;

  @Column({ name: 'GENPACIENT' })
  telefonoId: number;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn([{ name: 'GENDETCON', referencedColumnName: 'id' }])
  detalleContrato: DetalleContratoOrm;

  @Column({ name: 'GPAESTCIV' })
  estadoCivilCode: EstadoCivilCode;

  @Column({ name: 'GPAFECING' })
  fechaIngreso: Date;

  @Column({ name: 'GPATIPAFI' })
  tipoAfiliadoCode: TipoAfiliadoCode;

  @Column({ name: 'GPACAPPAG' })
  capacidadPagoCode: CapacidadPagoCode;

  @Column({ name: 'GPAZONRES' })
  zonaCode: ZonaCode;

  @Column({ name: 'GPAESTADO' })
  estadoCode: EstadoPacienteCode;

  @OneToMany(() => IngresoOrm, ingreso => ingreso.paciente)
  ingresos: IngresoOrm[];

  tipoDocumento: CtmType<TipoDocumentoCode>;
  genero: CtmType<GeneroCode>;
  estadoCivil: CtmType<EstadoCivilCode>;
  tipoAfiliado: CtmType<TipoAfiliadoCode>;
  capacidadPago: CtmType<TipoAfiliadoCode>;
  zona: CtmType<ZonaCode>;
  estado: CtmType<EstadoPacienteCode>;

  documento: {
    numero: string;
    fechaExpedicion: Date;
    lugarExpedicion: string;
  };

  setTypes(removeTypeCodes?: boolean) {
    this.tipoDocumento = tipoDocumentoTypeFactory(this.tipoDocumentoCode);
    this.genero = generoTypeFactory(this.generoCode);
    this.estadoCivil = estadoCivilTypeFactory(this.estadoCivilCode);
    this.tipoAfiliado = tipoAfiliadoTypeFactory(this.tipoAfiliadoCode);
    this.capacidadPago = capacidadPagoTypeFactory(this.capacidadPagoCode);
    this.zona = zonaTypeFactory(this.zonaCode);
    this.estado = estadoPacienteTypeFactory(this.estadoCode);
    this.documento = {
      numero: this.numeroDoc,
      fechaExpedicion: this.fechaExpDoc,
      lugarExpedicion: this.lugarExpDoc,
    };

    if (removeTypeCodes) {
      delete this.tipoDocumentoCode;
      delete this.generoCode;
      delete this.estadoCivilCode;
      delete this.tipoAfiliadoCode;
      delete this.capacidadPagoCode;
      delete this.zonaCode;
      delete this.estadoCode;
      delete this.numeroDoc;
      delete this.lugarExpDoc;
      delete this.fechaExpDoc;
    }
  }

  justNombreCompleto() {
    this.nombreCompleto = `${this.primerNombre}${
      this.segundoNombre ? ` ${this.segundoNombre}` : ''
    } ${this.primerApellido}${this.segundoApellido ? ` ${this.segundoApellido}` : ''}`;

    delete this.primerNombre;
    delete this.primerApellido;
    delete this.segundoNombre;
    delete this.segundoApellido;
  }

  get originalColumnName() {
    return 'GENPACIEN';
  }
}
