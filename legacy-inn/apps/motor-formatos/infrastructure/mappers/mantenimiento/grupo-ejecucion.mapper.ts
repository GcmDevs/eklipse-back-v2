import { GrupoEjecucionMantRead } from 'apps/motor-formatos/application/read';
import { GrupoEjecucionMantOrm } from '../../persistence';

export class GrupoEjecucionMantMapper {
  static toView(orm: GrupoEjecucionMantOrm): GrupoEjecucionMantRead {
    const view = new GrupoEjecucionMantRead();
    view.id = orm.id;
    view.nombre = orm.nombre;
    return view;
  }

  static toViewList(ormList: GrupoEjecucionMantOrm[]): GrupoEjecucionMantRead[] {
    return ormList.map(this.toView);
  }
}
