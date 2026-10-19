import { UsuarioOrm } from '@orm/gen';
export class UsuarioMapper {
  static toResponse(user: UsuarioOrm) {
    return {
      id: user.id,
      nombre: user.nombreCompleto,
      numeroDocumento: user.cedula,
    };
  }

  static toResponseList(users: UsuarioOrm[]) {
    return users.map(this.toResponse);
  }
}
