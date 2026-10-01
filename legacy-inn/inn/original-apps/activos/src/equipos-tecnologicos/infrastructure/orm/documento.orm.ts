import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne, ManyToOne } from 'typeorm';
import { ActivoFijoOrm } from './activo-fijo.orm';
import { UsuarioOrm } from '@inn/orm/gen';
import {
  TipoEquipoCode,
  TipoEquipoType,
  tipoEquipoTypeFactory,
} from '../../domain/types/tipo-equipo';
import { EspecificacionCompOrm } from './especificacion-comp.orm';
import { EspecificacionDispOrm } from './especificacion-disp.orm';

@Entity('GCMINNDOCUMTECN')
export class DocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AFNACTIVO' })
  activoId: number;

  @Column({ name: 'TIPO' })
  tipoCode: TipoEquipoCode;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'USUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'USUARIO', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  @Column({ name: 'UBICACION' })
  ubicacion: string;

  @Column({ name: 'ISLAPTOP' })
  isLaptop: boolean;

  @OneToOne(() => ActivoFijoOrm)
  @JoinColumn({ name: 'AFNACTIVO', referencedColumnName: 'id' })
  activo: ActivoFijoOrm;

  @OneToOne(() => EspecificacionCompOrm, espec => espec.documento)
  equipo: EspecificacionCompOrm;

  @OneToOne(() => EspecificacionDispOrm, espec => espec.documento)
  dispositivo: EspecificacionDispOrm;

  tipo: TipoEquipoType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = tipoEquipoTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
