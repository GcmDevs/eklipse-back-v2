import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FabricanteOrm } from './fabricante.orm';
import { AgrupamientoOrm } from './agrupamiento.orm';
import { GrupoProductoOrm } from './grupo.orm';
import {
  ClaseProductoCode,
  ClaseProductoType,
  claseProductoTypeFactory,
  TipoProductoCode,
  TipoProductoType,
  tipoProductoTypeFactory,
} from '@inn/types/inn/productos';
import { ExistenciaOrm } from './existencia.orm';
import { ItemCotizadoOrm, SetOrm } from '../../central-compras';

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

@Entity('INNPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCODIGO' })
  codigo: string;

  @Column({ name: 'IPRDESCOR' })
  descripcion: string;

  @Column({ name: 'IPRDESLAR' })
  descripcionLarga: string;

  @ManyToOne(() => AgrupamientoOrm)
  @JoinColumn([{ name: 'INNAGRUPAMI', referencedColumnName: 'id' }])
  agrupamiento: AgrupamientoOrm;

  @Column({ name: 'INNAGRUPAMI' })
  agrupamientoId: number;

  @ManyToOne(() => GrupoProductoOrm)
  @JoinColumn([{ name: 'IGRCODIGO', referencedColumnName: 'id' }])
  grupo: GrupoProductoOrm;

  @Column({ name: 'IGRCODIGO' })
  grupoId: number;

  @Column({ name: 'IPRCLAPRO' })
  claseCode: ClaseProductoCode;

  @Column({ name: 'IPRTIPPRO' })
  tipoCode: TipoProductoCode;

  @Column({ name: 'IPRBLOQUEO' })
  isBloqueado: boolean;

  @Column({ name: 'IPRMARDISP' })
  marca: string;

  @Column({ name: 'IPRCUM' })
  CUM: string;

  @ManyToOne(() => FabricanteOrm)
  @JoinColumn([{ name: 'INNFABRIC', referencedColumnName: 'id' }])
  fabricante: FabricanteOrm;

  @Column({ name: 'INNFABRIC' })
  fabricanteId: number;

  @Column({ name: 'IPRCOSTPE', type: 'decimal', precision: 4 })
  precioSugerido: number;

  @OneToMany(() => ExistenciaOrm, existencia => existencia.producto)
  existencias: ExistenciaOrm[];

  @OneToMany(() => ItemCotizadoOrm, detalle => detalle.producto)
  ofertas: ItemCotizadoOrm[];

  clase: ClaseProductoType;
  tipo: TipoProductoType;
  // riesgo: RiesgoProductoType;
  // riesgoSanitario: RiesgoSanitarioProductoType;

  setTypes(removeTypeCodes?: boolean) {
    this.clase = claseProductoTypeFactory(this.claseCode, false);
    this.tipo = tipoProductoTypeFactory(this.tipoCode, false);
    // this.riesgo = riesgoProductoTypeFactory(this.riesgoCode, false);
    // this.riesgoSanitario = riesgoSanitarioProductoTypeFactory(this.riesgoSanitarioCode, false);

    if (removeTypeCodes) {
      delete this.claseCode;
      delete this.tipoCode;
      // delete this.riesgoCode;
      // delete this.riesgoSanitarioCode;
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
