import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKHPNCIRHIS')
@Index('IX_CIRUGIAHISTORIAL_CONSEC', ['pcnConsec'])
export class HistorialEstadoCirugiaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'PCNCONSEC', type: 'varchar', length: 50 }) pcnConsec: string;
  @Column({ name: 'ESTADOANTERIOR', type: 'varchar', length: 50 }) estadoAnterior: string;
  @Column({ name: 'ESTADONUEVO', type: 'varchar', length: 50 }) estadoNuevo: string;
  @Column({ name: 'USUARIOID', type: 'bigint' }) usuarioId: number;
  @Column({ name: 'USUARIONOMBRE', type: 'varchar', length: 150, default: '' })
  usuarioNombre: string;
  @CreateDateColumn({ name: 'FECHAHORA', type: 'datetime' }) fechaHora: Date;
}
