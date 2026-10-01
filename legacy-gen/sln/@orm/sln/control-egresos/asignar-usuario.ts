import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity(TABLE_NAMES.sln.ctegr.asignar)
export class AsignarUsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO' })
  estado: number;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'ADNINGRESO' })
  numero_ingreso: number;

  @Column({ name: 'TIPOCUENTA' })
  tipoCuenta: number;

  @Column({ name: `CREADOPOR` })
  creadoPorId: number;

  @Column({ name: `USUARIOASIGNADO` })
  UsuarioAsignadoId: number;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  @Column({ name: 'FECHAREASIGNACION' })
  fechaReasignacion: Date;

  @Column({ name: `REASIGNADOA` })
  usuarioOriginalId: number;
}
