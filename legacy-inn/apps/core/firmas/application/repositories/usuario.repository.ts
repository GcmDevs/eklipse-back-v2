import { UsuarioOrm } from '@orm/gen';

export interface UsuarioEqpRepository {
  updateFirma(usuarioId: number, archivoId: number): Promise<UsuarioOrm | null>;
  findById(id: number): Promise<UsuarioOrm | null>;
  findSuggestions(nombre?: string, numeroDocumento?: string): Promise<UsuarioOrm[]>;
}
