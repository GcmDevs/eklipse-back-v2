import { Column } from 'typeorm';

export class UbicacionInicialEmbeddable {
  @Column({ name: 'LATITUD', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitud?: number | null;

  @Column({ name: 'LONGITUD', type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitud?: number | null;

  @Column({ name: 'PRECISIONMETROS', type: 'decimal', precision: 6, scale: 2, nullable: true })
  precisionMetros?: number | null;

  @Column({ name: 'FECHACAPTURA', type: 'datetime2', nullable: true })
  fechaCaptura?: Date | null;
}

