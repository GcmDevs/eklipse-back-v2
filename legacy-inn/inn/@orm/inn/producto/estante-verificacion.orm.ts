import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrm } from '@inn/orm/gen';
import { TABLE_NAMES } from '@inn/orm/table-names';
import { EstanteAlmacenOrm } from './estante.orm';

@Entity('EKINNESTANTVERIFI')
export class VerificacionEstanteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'OBSERVACIONES' })
  observaciones: string;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usuarios, referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: TABLE_NAMES.gen.usuarios })
  usuarioId: number;

  @ManyToOne(() => EstanteAlmacenOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.estantes, referencedColumnName: 'id' }])
  estante: EstanteAlmacenOrm;

  @Column({ name: TABLE_NAMES.inn.estantes })
  estanteId: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;
}
