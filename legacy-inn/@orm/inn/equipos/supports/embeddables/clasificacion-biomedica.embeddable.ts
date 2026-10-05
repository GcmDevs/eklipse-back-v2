import { Riesgo } from '@equipos/domain/enums';
import { Column } from 'typeorm';

export class ClasificacionBiomedicaEmbeddable {
  @Column({ name: 'REGSANITARIO', type: 'bit', nullable: false, default: false })
  aplicaRegSanitario: boolean;

  @Column({ name: 'NUMREGSANITARIO', type: 'varchar', nullable: true })
  numeroRegSanitario?: string;

  @Column({ name: 'EXPEDREGSANITARIO', type: 'varchar', nullable: true })
  expedienteRegSanitario?: string;

  @Column({ name: 'PREVENCION', type: 'bit', nullable: false, default: false })
  prevencion: boolean;

  @Column({ name: 'DIAGNOSTICO', type: 'bit', nullable: false, default: false })
  diagnostico: boolean;

  @Column({ name: 'REHABILITACION', type: 'bit', nullable: false, default: false })
  rehabilitacion: boolean;

  @Column({ name: 'TRATMANTVIDA', type: 'bit', nullable: false, default: false })
  tratamientoMantenimientoDeVida: boolean;

  @Column({ name: 'ANASLABORATORIO', type: 'bit', nullable: false, default: false })
  analisisLaboratorio: boolean;

  @Column({ name: 'RIESGO', type: 'varchar', length: 30, nullable: false })
  riesgo: Riesgo;
}
