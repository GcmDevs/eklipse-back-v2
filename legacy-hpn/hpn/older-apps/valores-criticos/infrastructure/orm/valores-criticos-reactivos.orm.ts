import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrm } from '@orm/gen';
import { TipoEventoCode, TipoProductoCode } from '../../domain/types';

@Entity('EKHPNREPVALCRIREACTIVOS')
export class ValoresCriticosReactivosOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'FECHACREACION', type: 'datetime' })
  fechaCreacion: Date;

  @Column({ name: 'FUENTEPUBLICACION', type: 'varchar', length: 100 })
  fuentePublicacion: string;

  @Column({ name: 'TIPOPRODUCTO' })
  tipoProducto: TipoProductoCode;

  @Column({ name: 'TIPOEVENTO' })
  tipoEvento: TipoEventoCode;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'RISARH' })
  risaRH: string;

  @Column({ name: 'ACCIONES' })
  acciones: string;

  @Column({ name: 'RELINSTITUCION' })
  relInstitucion: boolean;

  @Column({ name: 'USUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;
}
