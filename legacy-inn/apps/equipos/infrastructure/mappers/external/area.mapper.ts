import { ResponseAreaDto } from '@equipos/presentation/dto/external';
import { AreaServicioOrm } from '@orm/gen';

export class AreaMapper {
  public static toResponse(area: AreaServicioOrm): ResponseAreaDto {
    return {
      id: area.id,
      codigo: area.codigo,
      nombre: area.nombre,
    } as ResponseAreaDto;
  }
}
