import { MedioIngresoCode, MedioIngresoType, medioIngresoTypeFactory } from '@sln/c-types/adn';
import { PacienteOrm } from '@sln/orm/gen';
import { EstanciaOrm } from '@sln/orm/hpn';
import { HojaProductoOrm } from '@sln/orm/sln';
import { DetalleContratoOrm, ServicioIpsOrm } from '@sln/pfgp/infrastructure/orm';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @Column({ name: 'GENDETCON' })
  detalleContratoId: number;

  @Column({ name: 'AINURGCON' })
  ingresoPorCode: MedioIngresoCode;

  @Column({ name: 'AINFECING' })
  fechaIngreso: Date;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @OneToMany(() => EstanciaOrm, estancia => estancia.ingreso)
  estancias: EstanciaOrm[];

  @OneToMany(() => HojaProductoOrm, hojasServicio => hojasServicio.ingreso)
  hojasProducto: HojaProductoOrm[];

  servicios: ServicioIpsOrm[] = [];

  nombreContrato: string;
  codigoContrato: string;

  ingresoPor: MedioIngresoType;

  setTypes(removeTypeCodes?: boolean) {
    this.ingresoPor = medioIngresoTypeFactory(this.ingresoPorCode);

    if (removeTypeCodes) {
      delete this.ingresoPorCode;
    }
  }
}
