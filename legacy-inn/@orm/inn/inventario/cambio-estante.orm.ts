import { UsuarioOrm } from '@orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstanteInventarioOrm } from './estantes-inventario.orm';

@Entity('EKINNCAMBIOESTANTE')
export class CambioEstanteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PRODUCTOESTANTEID', type: 'int' })
  productoEstanteId: number;

  @Column({ name: 'ESTANTEORIGENID', type: 'int' })
  estanteOrigenId: number;

  @Column({ name: 'ESTANTEDESTINOID', type: 'int' })
  estanteDestinoId: number;

  @Column({ name: 'FECHACAMBIO', type: 'datetime', default: () => 'GETDATE()' })
  fechaCambio: Date;

  @Column({ name: 'USUARIOCAMBIOID', type: 'int' })
  usuarioCambioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'USUARIOCAMBIOID', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @ManyToOne(() => EstanteInventarioOrm)
  @JoinColumn({ name: 'ESTANTEORIGENID', referencedColumnName: 'id' })
  estanteOrigen: EstanteInventarioOrm;

  @ManyToOne(() => EstanteInventarioOrm)
  @JoinColumn({ name: 'ESTANTEDESTINOID', referencedColumnName: 'id' })
  estanteDestino: EstanteInventarioOrm;
}
