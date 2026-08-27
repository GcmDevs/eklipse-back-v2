import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKHPNCIREST')
export class EstadoCirugiaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'CODIGO', type: 'varchar', length: 50, unique: true }) codigo: string;
  @Column({ name: 'NOMBRE', type: 'varchar', length: 100 }) nombre: string;
  @Column({ name: 'ORDEN', type: 'int' }) orden: number;
  @Column({ name: 'ESALTERNATIVO', type: 'bit', default: false }) esAlternativo: boolean;
  @Column({ name: 'ESEVENTO', type: 'bit', default: false }) esEvento: boolean;
  @Column({ name: 'ESTERMINAL', type: 'bit', default: false }) esTerminal: boolean;
  @Column({ name: 'ACTIVO', type: 'bit', default: true }) activo: boolean;
}
