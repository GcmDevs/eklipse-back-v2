import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '../seguridad';

@Entity(TABLE_NAMES.gen.medicos.index)
export class MedicoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GMECODIGO' })
  codigo: string;

  @Column({ name: 'GMENOMCOM' })
  nombre: string;

  @Column({ name: TABLE_NAMES.gen.medicos.especialidad })
  especialidadId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioId: number;
}
