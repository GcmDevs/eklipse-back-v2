import { ResponseTerceroDto } from '@core/terceros/presentation/dto';
import { TerceroOrm } from '@orm/cor';

export class TerceroMapper {
  static toResponse(entity: TerceroOrm): ResponseTerceroDto {
    return {
      id: entity.id,
      nombre: entity.nombre,
      identificacion: entity.identificacion,
      correo: entity.correo,
      telefono: entity.telefono,
      direccion: entity.direccion,

      pais: entity.pais
        ? {
            id: entity.pais.id,
            nombre: entity.pais.nombre,
            codigo: entity.pais.codigo,
          }
        : undefined,

      roles: entity.roles?.map(r => r.rol) ?? [],
    };
  }

  static toResponseList(entities: TerceroOrm[]): ResponseTerceroDto[] {
    return entities.map(this.toResponse);
  }
}
