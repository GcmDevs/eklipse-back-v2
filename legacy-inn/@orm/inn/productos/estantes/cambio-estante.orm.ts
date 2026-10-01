import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstanteOrm } from './estante.orm';

@Entity(TABLE_NAMES.inn.pdt.stt.cambioEstante)
export class CambioEstanteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: `INNPRODUC1` })
  productoId: number;

  @ManyToOne(() => EstanteOrm)
  @JoinColumn([{ name: `EKINNESTANT1`, referencedColumnName: 'id' }])
  estanteOrigen: EstanteOrm;

  @Column({ name: `EKINNESTANT1` })
  estanteOrigenId: number;

  @ManyToOne(() => EstanteOrm)
  @JoinColumn([{ name: `EKINNESTANT2`, referencedColumnName: 'id' }])
  estanteDestino: EstanteOrm;

  @Column({ name: `EKINNESTANT2` })
  estanteDestinoId: number;

  @Column({ name: 'FECHACREACI' })
  fechaCambio: Date;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  creadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;
}
