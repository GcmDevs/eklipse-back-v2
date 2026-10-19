import { EntidadTipoAnexo } from '@common/domain/enums';
import { Inject, Injectable } from '@nestjs/common';
import { AnexoItemDto } from '@core/media/presentation/dto';
import { ANEXO_REPOSITORY, AnexoRepository } from '@core/media/domain/repositories';
import { Anexo } from '@core/media/domain/entities';

@Injectable()
export class AnexosService {
  constructor(
    @Inject(ANEXO_REPOSITORY)
    private readonly anexoRepository: AnexoRepository
  ) {}

  public async saveMany(data: {
    anexosInline: AnexoItemDto[];
    entidadTipo: EntidadTipoAnexo;
    entidadId: number;
    add?: boolean;
  }): Promise<void> {
    const add = data.add ?? false;
    let existentes: number = null;
    if (add) {
      existentes = await this.anexoRepository.countByEntidad(data.entidadTipo, data.entidadId);
    }

    const anexoEntities = data.anexosInline.map((a, idx) =>
      Anexo.create({
        entidadTipo: data.entidadTipo,
        entidadId: data.entidadId,
        archivoId: a.archivoId,
        nombre: a.nombre,
        observaciones: a.observaciones,
        orden: add ? existentes + a.orden : idx,
      })
    );
    void (await this.anexoRepository.saveMany(anexoEntities));
  }

  public async countByEntidad(entidadTipo: EntidadTipoAnexo, entidadId: number): Promise<number> {
    return await this.anexoRepository.countByEntidad(entidadTipo, entidadId);
  }
}
