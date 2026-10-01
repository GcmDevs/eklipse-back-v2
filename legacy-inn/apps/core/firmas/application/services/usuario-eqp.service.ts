import { BadInputError, ResourceNotFoundError } from "@common/domain/errors";
import { FindThrowOptions } from "@common/domain/types";
import { Inject, Injectable } from "@nestjs/common";
import { UsuarioOrm } from "@orm/gen";
import { USUARIO_REPOSITORY, UsuarioEqpRepository } from "../repositories";

@Injectable()
export class UsuarioEqpService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioEqpRepository,
  ) { }

  async findSuggestions(nombre?: string, numeroDocumento?: string): Promise<any[]> {
    if (!nombre && !numeroDocumento)
      throw new BadInputError('Debe haber almenos un parametro de busqueda')
    return await this.usuarioRepository.findSuggestions(nombre, numeroDocumento);
  }


  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<UsuarioOrm | null> {
    const usuarioFound = await this.usuarioRepository.findById(id);
    if (!usuarioFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Usuario con id: ${id} no encontrado`);
    }

    return usuarioFound;
  }
}
