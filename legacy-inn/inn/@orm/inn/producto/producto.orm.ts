import { RSAServices } from '@common/application/services';
import {
  ClaseProductoCode,
  ClaseProductoType,
  RiesgoProductoCode,
  RiesgoProductoType,
  RiesgoSanitarioProductoCode,
  RiesgoSanitarioProductoType,
  TipoProductoCode,
  TipoProductoType,
  claseProductoTypeFactory,
  riesgoProductoTypeFactory,
  riesgoSanitarioProductoTypeFactory,
  tipoProductoTypeFactory,
} from '@inn/ek-types/inn/productos';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GrupoProductoOrm } from './grupo.orm';
import { AgrupamientoProductoOrm } from './agrupamiento.orm';
import { ItemCotizadoOrm, SetOrm } from '@inn/ctc/ctpfb/infrastructure/orm';
import { EstanteAlmacenOrm } from './estante.orm';
import { TABLE_NAMES } from '@inn/orm/table-names';

export interface ExistenciaActualI {
  cantidad: number;
  cantidadByAuditor?: number;
  vencimientoMasCercano: Date;
  isVencimientoProximo: boolean;
  stockMinimo?: number;
  stockMaximo?: number;
  costoPromedio?: number;
  puntoReposicion?: number;
  /** @deprecated Implicito */
  productoId?: number;
  /** @deprecated Implicito */
  agrupamientoId?: number;
  /** @deprecated Reemplazar por "cantidad" */
  existenciaActual?: number;
}

@Entity(TABLE_NAMES.inn.productos)
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCODIGO' })
  codigo: string;

  nombre: string;

  /** @deprecated Reemplazar "descripcion" por "nombre" */
  @Column({ name: 'IPRDESCOR' })
  descripcion: string;

  @ManyToOne(() => AgrupamientoProductoOrm)
  @JoinColumn([{ name: 'INNAGRUPAMI', referencedColumnName: 'id' }])
  agrupamiento: AgrupamientoProductoOrm;

  @Column({ name: 'INNAGRUPAMI' })
  agrupamientoId: number;

  @ManyToOne(() => GrupoProductoOrm)
  @JoinColumn([{ name: 'IGRCODIGO', referencedColumnName: 'id' }])
  grupo: GrupoProductoOrm;

  @Column({ name: 'IGRCODIGO' })
  grupoId: number;

  @OneToMany(() => ItemCotizadoOrm, detalle => detalle.producto)
  ofertas: ItemCotizadoOrm[];

  @Column({ name: 'IPRCLAPRO' })
  claseCode: ClaseProductoCode;

  @Column({ name: 'IPRTIPPRO' })
  tipoCode: TipoProductoCode;

  @Column({ name: 'IPRCLSRIEPRO' })
  riesgoCode: RiesgoProductoCode;

  @Column({ name: 'IPRCLARIESAN' })
  riesgoSanitarioCode: RiesgoSanitarioProductoCode;

  @Column({ name: 'IPRBLOQUEO' })
  isBloqueado: boolean;

  @Column({ name: 'IPRMARDISP' })
  marca: string;

  @Column({ name: 'IPRCUM' })
  CUM: string;

  @Column({ name: 'IPRCOSTPE', type: 'decimal', precision: 4 })
  precioSugerido: number;

  @ManyToMany(() => EstanteAlmacenOrm, producto => producto.productos)
  estantes: EstanteAlmacenOrm[];

  clase: ClaseProductoType;
  tipo: TipoProductoType;
  riesgo: RiesgoProductoType;
  riesgoSanitario: RiesgoSanitarioProductoType;

  setTypes(removeTypeCodes?: boolean) {
    this.clase = claseProductoTypeFactory(this.claseCode);
    this.tipo = tipoProductoTypeFactory(this.tipoCode);
    this.riesgo = riesgoProductoTypeFactory(this.riesgoCode);
    this.riesgoSanitario = riesgoSanitarioProductoTypeFactory(this.riesgoSanitarioCode);

    if (removeTypeCodes) {
      delete this.claseCode;
      delete this.tipoCode;
      delete this.riesgoCode;
      delete this.riesgoSanitarioCode;
    }
  }

  @ManyToMany(() => SetOrm, set => set.productos)
  sets: SetOrm[];

  existenciaActual?: ExistenciaActualI;
  codigoAgrupamiento?: string;
  nombreAgrupamiento?: string;

  /** @deprecated Reemplazar por objeto existenciaActual */
  cantidad?: number;
}
