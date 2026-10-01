import { Column } from 'typeorm';

export class CoordenadasEmbeddable {
  @Column({ name: 'LATITUD', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitud?: number;

  @Column({ name: 'LONGITUD', type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitud?: number;

  @Column({ name: 'PRECISIONMETROS', type: 'decimal', precision: 6, scale: 2, nullable: true })
  precisionMetros?: number;
}
