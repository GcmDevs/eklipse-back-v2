import { UsuarioOrm } from '@orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKHPNRECEPCIONTECREACTIVOS')
export class RecepcionTecnicaReactivosOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'FECHACREACION', type: 'datetime' })
  fechaCreacion: Date;

  @Column({ name: 'FECHARECEPCION', type: 'datetime' })
  fechaRecepcion: Date;

  @Column({ name: 'NOMBREPRODUCTO', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'PRESENTACION', type: 'varchar', length: 100 })
  presentacion: string;

  @Column({ name: 'MARCA', type: 'varchar', length: 100 })
  marca: string;

  @Column({ name: 'CANTIDADRECEPCIONADA', type: 'int' })
  cantidadRecepcionada: number;

  @Column({ name: 'LOTE', type: 'varchar', length: 100 })
  lote: string;

  @Column({ name: 'FECHAVENCIMIENTO', type: 'datetime' })
  fechaVencimiento: Date;

  @Column({ name: 'REGISTROINVIMA', type: 'varchar', length: 100 })
  registroInvima: string;

  @Column({ name: 'EMPAQUE', type: 'varchar', length: 100 })
  empaque: string;

  @Column({ name: 'CADENAFRIO', type: 'varchar', length: 100 })
  cadenaFrio: string;

  // @Column({ name: 'CERTIFICADOANALISIS', type: 'varchar', length: 100 })
  // certificadoAnalisis: string;

  // @Column({ name: 'INSERTOHOJASEGURIDAD', type: 'varchar', length: 100 })
  // insertoHojaSeguridad: string;

  @Column({ name: 'TEMPERATURAAMBIENTEEMBALAJE', type: 'varchar', length: 100 })
  temperaturaAmbienteEmbalaje: string;

  @Column({ name: 'REFRIGERADOSEMBALAJE', type: 'varchar', length: 100 })
  refrigeradoEmbalaje: string;

  @Column({ name: 'TEMPERATURAAMBIENTERECEPCION', type: 'varchar', length: 100 })
  temperaturaAmbienteRecepcion: string;

  @Column({ name: 'REFRIGERADORECEPCION', type: 'varchar', length: 100 })
  refrigeradoRecepcion: string;

  @Column({ name: 'OBSERVACION', type: 'varchar', length: 100 })
  observacion: string;

  @Column({ name: 'USUARIORECIBIDO', type: 'varchar', length: 100 })
  usuarioRecibido: string;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUARIORESPONSABLE', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'USUARIORESPONSABLE', type: 'int' })
  usuarioId: number;
}
