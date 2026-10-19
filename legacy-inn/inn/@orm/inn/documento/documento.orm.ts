import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  EstadoDocumentoCode,
  EstadoDocumentoType,
  TipoDocumentoCode,
  TipoDocumentoType,
  estadoDocumentoTypeFactory,
  tipoDocumentoTypeFactory,
} from '@inn/ek-types/inn/documentos';
import { UsuarioOrm } from '@inn/orm/gen';
import { SuministroPacienteOrm } from '../suministros-paciente/suministros-paciente.orm';
import { OrdenCompraOrm } from './orden-compra';

@Entity('INNDOCUME')
export class DocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IDCONSEC' })
  consecutivo: string;

  @Column({ name: 'IDFECDOC' })
  fecha: Date;

  @Column({ name: 'IDTIPDOC' })
  tipoCode: TipoDocumentoCode;

  @Column({ name: 'IDESTADO' })
  estadoCode: EstadoDocumentoCode;

  @Column({ name: 'GENUSUARIO2' })
  creadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO2', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'IDFECCRE' })
  fechaCreacion: Date;

  @Column({ name: 'GENUSUARIO3' })
  confirmadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO3', referencedColumnName: 'id' }])
  confirmadoPor: UsuarioOrm;

  @Column({ name: 'IDFECCON' })
  fechaConfirmacion: Date;

  @Column({ name: 'GENUSUARIO4' })
  anuladoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO4', referencedColumnName: 'id' }])
  anuladoPor: UsuarioOrm;

  @Column({ name: 'IDFECANU' })
  fechaAnulacion: Date;

  @Column({ name: 'OptimisticLockField' })
  optimisticLockField: number;

  @Column({ name: 'ObjectType' })
  objectType: number;

  @Column({ name: 'CTNCOMCONC' })
  unknownValue: number;

  @ManyToOne(() => SuministroPacienteOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  suministrosPaciente: SuministroPacienteOrm;

  @ManyToOne(() => OrdenCompraOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  ordenCompra: OrdenCompraOrm;

  tipo: TipoDocumentoType;
  estado: EstadoDocumentoType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = tipoDocumentoTypeFactory(this.tipoCode);
    this.estado = estadoDocumentoTypeFactory(this.estadoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
      delete this.estadoCode;
    }
  }
}
