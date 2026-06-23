import { UsuarioOrm } from '@inn/orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PollaMundialistaOrm } from './polla-mundialista.orm';

@Entity('EKPOLMUNAPU')
export class PollaMundialistaApuestaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKPOLMUN' })
  pollaMundialistaId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @Column({ name: 'LOCALPREDI' })
  localPrediccion: number;

  @Column({ name: 'VISITAPREDI' })
  visitantePrediccion: number;

  @Column({ name: 'ISEXTERNO' })
  isExterno: boolean;

  pollaMundialista: PollaMundialistaOrm;
}
