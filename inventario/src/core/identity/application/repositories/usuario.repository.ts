import { GcmContextType } from '@common/domain/types';
import { UsuarioOrm } from '@inn/orm/gen';

export interface UsuarioConSede {
  usuario: UsuarioOrm;
  sede: string;
}

export interface UsuarioEqpRepository {
  findById(id: number): Promise<UsuarioOrm | null>;
  search(page: number, limit: number, search?: string): Promise<[UsuarioOrm[], number]>;
  searchTransversal(
    page: number,
    limit: number,
    search: string | undefined,
    contexto: GcmContextType
  ): Promise<[UsuarioConSede[], number]>;
}
