import { EjecucionMantItemRead } from 'apps/motor-formatos/application/read';
import { EjecucionMantItemOrm } from '../../persistence';

export class EjecucionMantItemMapper {
  static toView(orm: EjecucionMantItemOrm): EjecucionMantItemRead {
    const view = new EjecucionMantItemRead();
    view.id = orm.id;
    view.texto = orm.texto;
    view.tipoRespuesta = orm.tipoRespuesta as any;
    view.adicional = orm.adicional ?? null;
    view.textoAyuda = orm.textoAyuda ?? null;
    return view;
  }

  static toViewList(ormList: EjecucionMantItemOrm[]): EjecucionMantItemRead[] {
    return ormList.map(this.toView);
  }
}
