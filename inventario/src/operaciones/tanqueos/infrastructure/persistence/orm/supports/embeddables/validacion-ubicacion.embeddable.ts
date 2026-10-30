import { Column } from 'typeorm';
import { ResultadoValidacionUbicacion } from '@inn/operaciones/tanqueos/domain/enums';

export class ValidacionUbicacionEmbeddable {
  @Column({
    name: 'RESULTADO',
    enum: ResultadoValidacionUbicacion,
    type: 'nvarchar',
    length: 20,
    nullable: true,
  })
  resultado?: ResultadoValidacionUbicacion | null;

  @Column({ name: 'DISTANCIAMETROS', type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanciaMetros?: number | null;

  @Column({ name: 'DISTINIMETROS', type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanciaInicialMetros?: number | null;

  @Column({ name: 'RADIOMETROS', type: 'int', nullable: true })
  radioAplicadoMetros?: number | null;

  @Column({ name: 'MOTIVONODISP', type: 'nvarchar', length: 30, nullable: true })
  motivoNoDisponible?: string | null;

  @Column({ name: 'GPSSIMULADO', type: 'bit', nullable: true })
  gpsSimulado?: boolean | null;

  @Column({ name: 'FECHA', type: 'datetime2', nullable: true })
  fechaValidacion?: Date | null;
}

