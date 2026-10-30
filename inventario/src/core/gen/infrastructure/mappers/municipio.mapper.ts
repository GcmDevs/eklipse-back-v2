import { MunicipioRead } from '@inn/core/gen/presentation/dto';
import { MunicipioOrm } from '@inn/orm/shared-bd';

export class MunicipioMapper {
  static toView(orm: MunicipioOrm): MunicipioRead {
    return {
      id: orm.id,
      codigo: orm.codigo,
      nombre: orm.nombre,
      departamentoId: orm.departamento?.id,
      departamentoNombre: orm.departamento?.nombre,
    };
  }
}
