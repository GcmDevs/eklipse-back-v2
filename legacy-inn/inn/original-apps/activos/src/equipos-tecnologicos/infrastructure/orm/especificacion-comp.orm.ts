import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import {
  ClaseMouseType,
  ClasePcCode,
  ClasePcType,
  clasePcTypeFactory,
  SistemaOperativoCode,
  SistemaOperativoType,
  sistemaOperativoTypeFactory,
  TipoDiscoDuroCode,
  TipoDiscoDuroConectorCode,
  TipoDiscoDuroConectorType,
  tipoDiscoDuroConectorTypeFactory,
  TipoDiscoDuroType,
  tipoDiscoDuroTypeFactory,
  TipoEntradaConectorCode,
  TipoEntradaConectorType,
  tipoEntradaConectorTypeFactory,
} from '../../domain/types';
import { DocumentoOrm } from './documento.orm';

@Entity('GCMINNESPECCOMP')
export class EspecificacionCompOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CPUMARCA' })
  cpuMarca: string;

  @Column({ name: 'CPUMODELO' })
  cpuModelo: string;

  @Column({ name: 'CPUSERIE' })
  cpuSerie: string;

  @Column({ name: 'CPUPROCE' })
  cpuProcesador: string;

  @Column({ name: 'CPUVELOCIPROCE' })
  velocidad: string;

  @Column({ name: 'CPURAM' })
  cpuRam: string;

  @Column({ name: 'CPUDISCOCONEC' })
  conector: TipoDiscoDuroConectorCode;

  @Column({ name: 'CPUDISCODURO' })
  discoDuro: TipoDiscoDuroCode;

  @Column({ name: 'SISTEMAOPERATIVO' })
  sistemaOperativoCode: SistemaOperativoCode;

  @Column({ name: 'CPUDVD' })
  unidadDvd: boolean;

  /* MONITOR */

  @Column({ name: 'MONMARCA' })
  monitorMarca: string;

  @Column({ name: 'MONMODELO' })
  monitorModelo: string;

  @Column({ name: 'MONSERIE' })
  monitorSerie: string;

  /* TECLADO */

  @Column({ name: 'TECLADOTIPO' })
  tecladoTipoCode: TipoEntradaConectorCode;

  /* MOUSE */
  @Column({ name: 'MOUSETIPO' })
  mouseTipoCode: TipoEntradaConectorCode;

  @Column({ name: 'RED' })
  red: boolean;

  @Column({ name: 'DIRECIP' })
  direccionIp: string;

  @Column({ name: 'CLASELAPTOP' })
  claseLaptopCode: ClasePcCode;

  @Column({ name: 'DOCUMTECN' })
  documentoId: number;

  @OneToOne(() => DocumentoOrm, doc => doc.equipo)
  @JoinColumn({ name: 'DOCUMTECN', referencedColumnName: 'id' })
  documento: DocumentoOrm;

  tipoDiscoDuro: TipoDiscoDuroType;
  conenctor: TipoDiscoDuroConectorType;
  tecladoTipoConector: TipoEntradaConectorType;
  mouseTipoConector: TipoEntradaConectorType;
  mouseClase: ClaseMouseType;
  sistemaOperativo: SistemaOperativoType;
  claseLaptop: ClasePcType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipoDiscoDuro = tipoDiscoDuroTypeFactory(this.discoDuro);
    this.conenctor = tipoDiscoDuroConectorTypeFactory(this.conector);
    this.tecladoTipoConector = tipoEntradaConectorTypeFactory(this.tecladoTipoCode);
    this.mouseTipoConector = tipoEntradaConectorTypeFactory(this.mouseTipoCode);
    this.sistemaOperativo = sistemaOperativoTypeFactory(this.sistemaOperativoCode);
    this.claseLaptop = clasePcTypeFactory(this.claseLaptopCode);
    if (removeTypeCodes) {
      delete this.discoDuro;
      delete this.tecladoTipoCode;
      delete this.mouseTipoCode;
      delete this.sistemaOperativoCode;
      delete this.claseLaptopCode;
    }
  }
}
