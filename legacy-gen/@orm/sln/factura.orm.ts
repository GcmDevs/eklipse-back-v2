import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoFacturaCode, TipoFacturaType, tipoFacturaTypeFactory } from '@ctypes/sln';
import { TABLE_NAMES } from '@common/application/constants';
import { DetalleOrm as DetalleRadicacion, RadicacionOrm, SoporteOrm } from '@orm/crn/rdc';
import { DetalleOrm as DetalleContratoOrm } from '../gen/ctt/detalle.orm';
import { IngresoOrm } from '@orm/adn';
import { TerceroOrm, UsuarioOrm } from '@orm/gen';
import { CentroOrm } from '../adn';

@Entity(TABLE_NAMES.sln.facturas)
export class FacturaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SFATIPDOC' })
  tipoCode: TipoFacturaCode;

  @Column({ name: 'SFANUMFAC' })
  consecutivo: string;

  @Column({ name: 'SFAFECFAC' })
  fechaFacturacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}1`, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}1` })
  creadoPorId: number;

  @Column({ name: 'SFADOCANU' })
  isAnulado: boolean;

  @Column({ name: 'SFATOTFAC', scale: 2 })
  valorTotal: number;

  @OneToOne(() => DetalleRadicacion, detalle => detalle.factura)
  detalleRadicacion: DetalleRadicacion;

  @OneToMany(() => SoporteOrm, soporte => soporte.factura)
  soportesRadicacion: SoporteOrm[];

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn({ name: TABLE_NAMES.gen.ctt.detalle })
  detalleContrato: DetalleContratoOrm;

  @Column({ name: TABLE_NAMES.gen.ctt.detalle })
  detalleContratoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn({ name: TABLE_NAMES.adn.ingresos })
  ingreso: IngresoOrm;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  /** @deprecated */
  radicacion: RadicacionOrm;

  /** @deprecated */
  tercero: TerceroOrm;

  /** @deprecated */
  centro: CentroOrm;

  /** @deprecated */
  tipo: TipoFacturaType;

  /** @deprecated */
  setTypes(deleteCodes = false) {
    this.tipo = tipoFacturaTypeFactory(this.tipoCode);

    if (deleteCodes) {
      delete this.tipoCode;
    }
  }
}
