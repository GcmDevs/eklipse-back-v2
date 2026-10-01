import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { ActivoFijoOrm } from './activo-fijo.orm';
import { TipoManualCode, TipoManualType, tipoManualTypeFactory } from '../../domain/types';

@Entity('AFNDAGEAC')
export class GeneralActivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @OneToOne(() => ActivoFijoOrm)
  @JoinColumn({ name: 'AFNACTIVO', referencedColumnName: 'id' })
  activo: ActivoFijoOrm;

  @Column({ name: 'AFNACTIVO' })
  activoFijoId: number;

  @Column({ name: 'AGENUMPLA' })
  numPlaca: string;

  @Column({ name: 'AGENUMSER' })
  numSerie: string;

  @Column({ name: 'AGEMANGAR' })
  garantia: boolean;

  @Column({ name: 'AGEFEVEGA' })
  fechaVectoGarantia: Date;

  @Column({ name: 'AGEMODELO' })
  modelo: string;

  @Column({ name: 'AGETIEMPO' })
  mantenimiento: string;

  @Column({ name: 'AGENUMFAC' })
  numeroFactura: string;

  @Column({ name: 'AGEFABRIC' })
  fabricante: string;

  @Column({ name: 'AGEDISTRI' })
  distribuidor: string;

  @Column({ name: 'AGEMANUAL' })
  tipoManualCode: TipoManualCode;

  @Column({ name: 'AGEFECINS' })
  fechaInstalacion: Date;

  @Column({ name: 'AGEDETALL' })
  detalle: string;

  //AQUI CAMBIE DE TIPO marca: Date a marca: string, porque me daba error al traerla de db
  //si da conflicto entonces revertirla
  @Column({ name: 'AGEMARCAA' })
  marca: string;

  tipoManual: TipoManualType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipoManual = tipoManualTypeFactory(this.tipoManualCode);
    if (removeTypeCodes) {
      delete this.tipoManualCode;
    }
  }
}
