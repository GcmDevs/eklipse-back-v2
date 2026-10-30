import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ClaseProductoCode,
  ClaseProductoType,
  claseProductoTypeFactory,
} from '@inn/lgc/cgt/types/inn/productos/clases.type';
import {
  RiesgoProductoCode,
  RiesgoProductoType,
  riesgoProductoTypeFactory,
} from '@inn/lgc/cgt/types/inn/productos/riesgos.type';
import {
  RiesgoSanitarioProductoCode,
  RiesgoSanitarioProductoType,
  riesgoSanitarioProductoTypeFactory,
} from '@inn/lgc/cgt/types/inn/productos/riesgos-sanitarios.type';
import {
  TipoProductoCode,
  TipoProductoType,
  tipoProductoTypeFactory,
} from '@inn/lgc/cgt/types/inn/productos/tipos.type';
import { AgrupamientoOrm } from '@inn/lgc/cgt/orm/inn/productos/agrupamiento.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { GrupoProductoOrm } from '@inn/lgc/cgt/orm/inn/productos/grupo.orm';
import { EstanteOrm } from '@inn/lgc/cgt/orm/inn/productos/estantes/estante.orm';
import { ExistenciaOrm } from '@inn/lgc/cgt/orm/inn/productos/existencia.orm';
import { FabricanteOrm } from '@inn/lgc/cgt/orm/inn/productos/fabricante.orm';

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

@Entity(TABLE_NAMES.inn.pdt.productos)
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
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.agrupamientos, referencedColumnName: 'id' }])
  agrupamiento: AgrupamientoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.agrupamientos })
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

  @ManyToOne(() => FabricanteOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.fabricantes, referencedColumnName: 'id' }])
  fabricante: FabricanteOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.fabricantes })
  fabricanteId: number;

  @Column({ name: 'IPRCOSTPE', type: 'decimal', precision: 4 })
  precioSugerido: number;

  @ManyToMany(() => EstanteOrm, estante => estante.productos)
  estantes: EstanteOrm[];

  @OneToMany(() => ExistenciaOrm, existencia => existencia.producto)
  existencias: ExistenciaOrm[];

  clase: ClaseProductoType;
  tipo: TipoProductoType;
  riesgo: RiesgoProductoType;
  riesgoSanitario: RiesgoSanitarioProductoType;

  setTypes(removeTypeCodes?: boolean) {
    this.clase = claseProductoTypeFactory(this.claseCode, false);
    this.tipo = tipoProductoTypeFactory(this.tipoCode, false);
    this.riesgo = riesgoProductoTypeFactory(this.riesgoCode, false);
    this.riesgoSanitario = riesgoSanitarioProductoTypeFactory(this.riesgoSanitarioCode, false);

    if (removeTypeCodes) {
      delete this.claseCode;
      delete this.tipoCode;
      delete this.riesgoCode;
      delete this.riesgoSanitarioCode;
    }
  }

  existenciaActual?: ExistenciaActualI;
  codigoAgrupamiento?: string;
  nombreAgrupamiento?: string;

  /** @deprecated Reemplazar por objeto existenciaActual */
  cantidad?: number;
}
