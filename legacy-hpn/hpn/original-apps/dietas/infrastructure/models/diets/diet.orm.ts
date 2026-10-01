import { Entity, JoinColumn, ManyToOne, Column, PrimaryGeneratedColumn } from 'typeorm';
import { DIE_ENT_NAMES } from './_entity-names';
import { CatalogOrm } from './catalog.orm';
import { DieEstadoOrm } from '../local';
import { ScheduleOrm } from './schedule.orm';

@Entity(DIE_ENT_NAMES.diet)
export class DimItdDietOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DieEstadoOrm, dieEstado => dieEstado.facturacion)
  @JoinColumn({ name: 'PDYDIEEST' })
  dieEstado: DieEstadoOrm;

  @Column({ name: 'PDYDIEEST' })
  dieEstadoId: number;

  @Column({ name: 'DIECONFIG' })
  compactConfig: string;

  @Column({ name: 'DIEVALOR', type: 'decimal', precision: 7, scale: 2 })
  value: number;

  @Column({ name: 'DIERECIBIDO' })
  isReceived: boolean;

  config: CatalogOrm[];
  configInTxt: string;
  schedule: ScheduleOrm;
  scheduleForHumans: string;

  generateActualConfig(
    catalogs: CatalogOrm[],
    generateValue?: boolean,
    generateConfigInTxt?: boolean
  ) {
    if (generateConfigInTxt) this.configInTxt = '';
    const codes = this.compactConfig.split('|');
    const config: CatalogOrm[] = [];
    let value = 0;
    codes.forEach(c => {
      try {
        const catalog = catalogs.filter(cl => cl.code === c)[0];
        config.push(catalog);

        if (generateValue && catalog.price) value += +catalog.price.value;
        if (generateConfigInTxt) this.configInTxt += ` ${catalog.name}`;
      } catch (error) {
        throw new Error(`No existe una oferta con codigo '${c}' en este horario`);
      }
    });
    if (generateValue) this.value = value;
    if (generateConfigInTxt) this.configInTxt = this.configInTxt.trim();
    this.config = config;
  }
}
