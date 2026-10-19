import { ResponseProveedorDto } from '@core/terceros/presentation/dto';
import { ProveedorOrm } from '@orm/gen';

export class ProveedorMapper {
  static toResponse(orm: ProveedorOrm): ResponseProveedorDto {
    const response = new ResponseProveedorDto();
    response.id = orm.id;
    response.codigo = orm.codigo;
    response.nombre = orm.nombre;
    response.terceroId = orm.terceroId;
    response.direccion = orm.direccion;
    response.tel1 = orm.tel1;
    response.tel2 = orm.tel2;
    response.tercero = orm.tercero;
    return response;
  }
}
