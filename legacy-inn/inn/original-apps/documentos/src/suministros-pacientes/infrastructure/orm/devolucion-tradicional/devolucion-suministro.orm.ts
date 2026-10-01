import { DocumentoOrm } from '@inn/orm/inn';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrm } from '@inn/orm/gen';
import { DetalleDevSumOrm } from './reserva-suministro.orm';
import {
  MotivoDevolucionSumPacCode,
  MotivoDevolucionSumPacType,
  motivoDevolucionSumPacTypeFactory,
} from '@inn/docs/sumpac/domain/types';

@Entity('EKINNDOCDEVMED')
export class DevolucionSumPacOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'INNDOCUME', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'MOTIVO' })
  motivoCode: MotivoDevolucionSumPacCode;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @Column({ name: 'GENUSUARIO' })
  creadoPorId: number;

  @OneToMany(() => DetalleDevSumOrm, reservas => reservas.devolucion)
  detalle: DetalleDevSumOrm[];

  motivo: MotivoDevolucionSumPacType;

  setTypes(removeTypeCodes?: boolean) {
    this.motivo = motivoDevolucionSumPacTypeFactory(this.motivoCode);

    if (removeTypeCodes) {
      delete this.motivoCode;
    }
  }
}
