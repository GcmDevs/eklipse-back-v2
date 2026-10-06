import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { DieSubgrupoOrm } from './die-sub-grupo.orm';
import {
  DieEstadoCode,
  DieEstadoType,
  MotivoDevolucionDietaCode,
  MotivoDevolucionDietaType,
  dieEstadoTypeFactory,
  motivosDevolucionDietaTypeFactory,
} from '@lgc/die/domain/types/local';
import { PacienteOrm } from './paciente.orm';
import { CamaOrm } from './cama.orm';
import { DetalleOfertaI } from '@lgc/die/infrastructure/data-transfers';
import { DimItdDietOrm } from '../diets/diet.orm';

@Entity('PDYDIEEST')
export class DieEstadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DieSubgrupoOrm, subgrupo => subgrupo.dietas)
  @JoinColumn({ name: 'PDYDIEGRU' })
  dieSubgrupo: DieSubgrupoOrm;

  @Column({ name: 'PDYDIEGRU' })
  dieSubgrupoId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn([{ name: 'HPNDEFCAM', referencedColumnName: 'id' }])
  cama: CamaOrm;

  @Column({ name: 'HPNDEFCAM' })
  camaId: number;

  @Column({ name: 'DIECONFIG' })
  combinacionCode: string;

  @Column({ name: 'DIEGRUOBS' })
  observacion: string;

  @Column({ name: 'ENAISLAMIENTO' })
  enAislamiento: boolean;

  @Column({ name: 'DIEESTADO' })
  estadoCode: DieEstadoCode;

  @Column({ name: 'DIEESTMOT' })
  motivoDevolucionCode: MotivoDevolucionDietaCode;

  @Column({ name: 'DIEESTOBS' })
  observacionDevolucion: string;

  @OneToMany(() => DimItdDietOrm, facturacion => facturacion.dieEstado)
  facturacion: DimItdDietOrm[];

  @Column({ name: 'ELIMINADO' })
  isEliminado: boolean;

  @Column({ name: 'VALDIETA', type: 'decimal', precision: 7, scale: 2 })
  valorDieta: number;

  @Column({ name: 'VALMERI', type: 'decimal', precision: 7, scale: 2 })
  valorMerienda: number;

  @Column({ name: 'VALDIEFAM', type: 'decimal', precision: 7, scale: 2 })
  valorDietaFamiliar: number;

  @Column({ name: 'RECDIETA' })
  dietaRecibida: boolean;

  @Column({ name: 'RECMERI' })
  meriendaRecibida: boolean;

  @Column({ name: 'RECDIEFAM' })
  dietaFamiliarRecibida: boolean;

  codigoContrato: string;
  estado: DieEstadoType;
  motivoDevolucion: MotivoDevolucionDietaType;

  tipos: DetalleOfertaI[];
  consistencias: DetalleOfertaI[];
  extraordinarias: DetalleOfertaI[];

  tipo: string;
  consistencia: string;
  nombreCompletoDieta = '';
  isValid = true;
  onlyExtra = false;

  soloDieta: string;
  soloMerienda: string;
  soloDietaFamiliar: string;

  dietDetails: string[] = [];

  setTypes(removeTypeCodes?: boolean) {
    this.estado = dieEstadoTypeFactory(this.estadoCode);
    this.motivoDevolucion = motivosDevolucionDietaTypeFactory(this.motivoDevolucionCode);

    if (removeTypeCodes) {
      delete this.estadoCode;
      delete this.motivoDevolucionCode;
    }
  }

  generateValues() {
    this.extraordinarias.map(d => {
      if (d.name.includes('MERIENDA')) {
        d.tipo = 'MERIENDA';
        d.consistencia = d.name.replace('MERIENDA ', '');
      } else {
        d.tipo = 'DIETA PARA FAMILIAR';
        d.consistencia = 'NORMAL';
      }
    });

    this.tipo = '';
    this.consistencia = '';

    this.tipos.forEach(t => (this.tipo += `${t.name} `));
    this.consistencias.forEach(t => (this.consistencia += `${t.name} `));

    this.tipo = this.tipo.trim();
    this.consistencia = this.consistencia.trim();
    if (this.tipo && this.consistencia) {
      this.nombreCompletoDieta = `${this.tipo} ${this.consistencia}`.trim();
    }
  }

  setIsValid() {
    const invalids = ['NADA VIA ORAL', 'NO APLICA'];

    const isValida =
      invalids.indexOf(this.tipo.trim().toUpperCase()) < 0 &&
      invalids.indexOf(this.consistencia.trim().toUpperCase()) < 0 &&
      this.nombreCompletoDieta !== '';

    const isNotValida =
      invalids.indexOf(this.tipo.trim().toUpperCase()) >= 0 ||
      invalids.indexOf(this.consistencia.trim().toUpperCase()) >= 0 ||
      this.nombreCompletoDieta === '';

    const incluyeExtraordinarias = this.extraordinarias.length > 0;

    if (!isValida) this.isValid = false;
    if (incluyeExtraordinarias) this.onlyExtra = true;

    if (isNotValida && incluyeExtraordinarias) {
      this.nombreCompletoDieta = null;
      this.tipo = null;
      this.consistencia = null;
    }
  }
}
