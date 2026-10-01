import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UsuarioOrm } from '@inn/orm/gen';
import { AccesorioOrm } from './accesorio.orm';
import { TipoMtoCode, TipoMtoType, tipoMtoTypeFactory } from '../../domain/types';

@Entity('GCMINNHISTMANT')
export class MantenimientoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DOCUMTECN' })
  documentoId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @Column({ name: 'FECHANEWMTO' })
  fechaNewMto: Date;

  @Column({ name: 'FECHA' })
  fechaCreacion: Date;

  @Column({ name: 'TIPOMANT' })
  tipoMantenimientoCode: TipoMtoCode;

  @Column({ name: 'NUMREPORTE' })
  numeroReporte: string;

  @Column({ name: 'VALOR' })
  valor: number;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  tipoMto: TipoMtoType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipoMto = tipoMtoTypeFactory(this.tipoMantenimientoCode);

    if (removeTypeCodes) {
      delete this.tipoMantenimientoCode;
    }
  }

  @ManyToMany(() => AccesorioOrm, mtoAccesorio => mtoAccesorio.mantenimientos)
  @JoinTable({
    name: 'GCMINNHISTMANTACCE',
    joinColumn: {
      name: 'HISTMANT',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'ACCESORIO',
      referencedColumnName: 'id',
    },
  })
  accesorios: AccesorioOrm[];
}
