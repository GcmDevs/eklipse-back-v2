import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MedicamentoOrm } from './medicamento.orm';
import { SolicitudOrm } from './solicitud.orm';
import {
  ViaAdministracionCode,
  TiempoAdminCode,
  VehiculoCode,
} from '@inn/types/inn/central-mezclas';

@Entity('EKINNCTMZMEDSEL')
export class MedicamentoSeleccionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTMZMED' })
  medicamentoId: number;

  @ManyToOne(() => MedicamentoOrm, medicamento => medicamento.selecciones)
  @JoinColumn({ name: 'EKINNCTMZMED', referencedColumnName: 'id' })
  medicamento: MedicamentoOrm;

  @Column({ name: 'EKINNCTMZSOLI' })
  solicitudId: number;

  @ManyToOne(() => SolicitudOrm, solicitud => solicitud.seleccion)
  @JoinColumn({ name: 'EKINNCTMZSOLI', referencedColumnName: 'id' })
  solicitud: SolicitudOrm;

  @Column({ name: 'VEHICULO' })
  vehiculoCode: VehiculoCode;

  @Column({ name: 'CONCENTRACION', length: 100 })
  concentracion: string;

  @Column({ name: 'VOLUMEN', type: 'decimal', precision: 7, scale: 2 })
  volumen: number;

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 7, scale: 2 })
  cantidad: number;

  @Column({ name: 'TIEMPOADMIN' })
  tiempoAdmin: number;

  @Column({ name: 'UNIDMEDTIEM' })
  uniMedTiempoAdminCode: TiempoAdminCode;

  @Column({ name: 'VIADMINI' })
  viaAdministracionCode: ViaAdministracionCode;

  @Column({ name: 'FECHAPLIC', type: 'timestamp' })
  fechaAplicacion: Date;

  @Column({ name: 'LABORATORIO', length: 100, nullable: true })
  laboratorio: string;

  @Column({ name: 'CANTIDADECUAR', type: 'decimal', precision: 9, scale: 2, nullable: true })
  cantidadAdecuar: number;

  @Column({ name: 'LOTE', length: 100, nullable: true })
  lote: string;

  @Column({ name: 'FECHAVENCI', type: 'date', nullable: true })
  fechaVencimiento: Date;
}
