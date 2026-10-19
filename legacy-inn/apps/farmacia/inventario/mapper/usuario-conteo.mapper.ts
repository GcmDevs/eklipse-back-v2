import { UsuarioConteoOrm } from '@orm/inn/inventario';
import {
  UsuarioAsignacionSimpleResponse,
  UsuarioConteoResponse,
  UsuarioResponse,
} from '../dto/inventarios.dto';
import { UsuarioOrm } from '@orm/gen';

export class UsuarioConteoMapper {
  static toDto(entity: UsuarioConteoOrm): UsuarioConteoResponse {
    return {
      id: entity.id,
      isActive: entity.isActive,
      usuario: {
        id: entity.usuario?.id,
        nombre: entity.usuario.nombreCompleto,
      },
    };
  }

  static toDtoList(entities: UsuarioConteoOrm[]): UsuarioConteoResponse[] {
    return entities.map(e => this.toDto(e));
  }

  static responseUsuario(entity: UsuarioOrm): UsuarioResponse {
    return {
      id: entity.id,
      nombreCompleto: entity.nombreCompleto,
      cedula: entity.cedula,
    };
  }

  static responseUsuarioList(entities: UsuarioConteoOrm[]): UsuarioAsignacionSimpleResponse[] {
    return entities.map(e => ({
      id: e.id,
      nombre: e.usuario.nombreCompleto,
      cedula: e.usuario.cedula,
      asignacion: e.asignaciones.map(a => ({
        estante: a.estante.nombreEstante,
        numeroConteo: a.numeroConteo,
        fechaAsignacion: a.fechaAsignacion,
      })),
    }));
  }
}
