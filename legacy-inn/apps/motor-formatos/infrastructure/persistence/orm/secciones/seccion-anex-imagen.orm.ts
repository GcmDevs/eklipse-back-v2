import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

export class DefinicionSeccionAnexImagenOrm {
  key: string;
  orden: number;
  etiqueta?: string;
}

export class ConfigSeccionAnexImagenesOrm {
  imagenes: DefinicionSeccionAnexImagenOrm[];
  observacionGeneral?: string;
}

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.secciones.config_imgs_slots })
@Unique('UQ_EKFMTSECCONFIGIMGSSLOTS_NOMBRE', ['nombre'])
export class SeccionAnexoImagenesOrm extends BaseOrm {
  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'CANTSLOTS', type: 'smallint' })
  cantidadSlots: number;

  @Column({ type: 'simple-json', name: 'DEFINICION' })
  definicion: ConfigSeccionAnexImagenesOrm;
}
