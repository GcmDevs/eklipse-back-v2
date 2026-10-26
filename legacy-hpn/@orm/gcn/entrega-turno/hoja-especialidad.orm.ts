import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrm } from '@orm/gen';
import { EspecialidadOrm } from '@orm/gen/medicos';

@Entity('EKHPNHOJAESPECIALIDAD')
@Index('UQ_EKHPNHOJA_INGRESO_ESPECIALIDAD', ['ingresoId', 'especialidadId'], { unique: true })
export class HojaEspecialidadOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'ADNINGRESO' }) ingresoId: number;
  @Column({ name: 'GENESPECI' }) especialidadId: number;
  @ManyToOne(() => EspecialidadOrm)
  @JoinColumn({ name: 'GENESPECI' })
  especialidad: EspecialidadOrm;
  @Column({ name: 'CONTENIDO', type: 'nvarchar', length: 'MAX' }) contenido: string;
  @Column({ name: 'ACTIVA', type: 'bit' }) activa: boolean;
  @Column({ name: 'VERSION' }) version: number;
  @Column({ name: 'CREADOPOR' }) creadoPorId: number;
  @Column({ name: 'MODIFICADOPOR', nullable: true }) modificadoPorId: number | null;
  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'MODIFICADOPOR' })
  ultimoAutor: UsuarioOrm;
  @Column({ name: 'FECHACREACION', type: 'datetime2' }) fechaCreacion: Date;
  @Column({ name: 'FECHAMODIFICACION', type: 'datetime2', nullable: true })
  fechaModificacion: Date | null;
}

@Entity('EKHPNHOJAESPECIALIDADVERSION')
@Index('UQ_EKHPNHOJAVERSION_HOJA_VERSION', ['hojaId', 'version'], { unique: true })
export class HojaEspecialidadVersionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'HOJA' }) hojaId: number;
  @ManyToOne(() => HojaEspecialidadOrm)
  @JoinColumn({ name: 'HOJA' })
  hoja: HojaEspecialidadOrm;
  @Column({ name: 'VERSION' }) version: number;
  @Column({ name: 'CONTENIDO', type: 'nvarchar', length: 'MAX' }) contenido: string;
  @Column({ name: 'GENUSUARIO' }) usuarioId: number;
  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO' })
  autor: UsuarioOrm;
  @Column({ name: 'FECHA', type: 'datetime2' }) fecha: Date;
}
