import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RSAServices } from '@common/application/services';
import { ProductoOrm } from '@inn/orm/inn';
import { LoteProductoOrm } from '../producto/lote.orm';
import { SuministroPacienteOrm } from './suministros-paciente.orm';
import { MotivoDevolucionOrm } from '@inn/orm/hcn';

@Entity('INNMSUMPA')
export class DetalleSuministroPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => SuministroPacienteOrm, remisionEntrada => remisionEntrada.detalle)
  @JoinColumn({ name: 'INNCSUMPA', referencedColumnName: 'id' })
  suministroPaciente: SuministroPacienteOrm;

  @OneToMany(() => MotivoDevolucionOrm, motivo => motivo.suministroPaciente)
  motivosDevolucion: MotivoDevolucionOrm[];

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'IDDCANTID', type: 'money', precision: 2 })
  cantidad: number;

  @Column({ name: 'ISMCANAPL', type: 'money', precision: 2 })
  cantidadAplicada: number;

  @Column({ name: 'ISMCANDEV', type: 'money', precision: 2 })
  cantidadDevuelta: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: 'INNLOTSER', referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: 'INNCSUMPA' })
  suministroPacienteId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @Column({ name: 'INNLOTSER' })
  loteId: number;

  estadoCode: 1 | 2 | 3;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
