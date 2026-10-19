import { PaisOrm } from '@orm/shared-bd';

export class PaisMapper {
  static toResponse(pais: PaisOrm) {
    if (!pais) return null;

    return {
      id: pais.id,
      codigo: pais.codigo,
      nombre: pais.nombre,
    };
  }

  static toResponseList(paises: PaisOrm[]) {
    if (!paises?.length) return [];
    return paises.map(this.toResponse);
  }
}
