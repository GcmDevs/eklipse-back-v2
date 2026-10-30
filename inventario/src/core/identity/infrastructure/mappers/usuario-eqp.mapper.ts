import { UsuarioConSede } from '@inn/core/identity/application/repositories';
import { UsuarioRead } from '@inn/core/identity/presentation/dto';
import { UsuarioOrm } from '@inn/orm/gen';

export class UsuarioMapper {
  static toResponse(user: UsuarioOrm): UsuarioRead {
    return {
      id: user.id,
      nombre: user.nombreCompleto,
      numeroDocumento: user.cedula,
    };
  }

  static toResponseWithSede({ usuario, sede }: UsuarioConSede): UsuarioRead {
    return {
      ...this.toResponse(usuario),
      sede,
    };
  }

  static toResponseList(users: UsuarioOrm[]): UsuarioRead[] {
    return users.map(user => this.toResponse(user));
  }

  static toResponseListWithSede(users: UsuarioConSede[]): UsuarioRead[] {
    return users.map(user => this.toResponseWithSede(user));
  }
}
