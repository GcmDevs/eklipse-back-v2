import { ResponseResponsableDto } from '@core/terceros/presentation/dto/responsable.dto';
import { AreaMapper } from '@equipos/infrastructure';
import { ResponsableView } from '@orm/cor';

export class ResponsableMapper {
  static toResponse(view: ResponsableView): ResponseResponsableDto {
    return {
      id: view.responsableId,
      codigo: view.responsableCodigo,
      nombre: view.responsableNombre,
      cedula: view?.responsableCedula ?? null,

      area: view.areaId
        ? AreaMapper.toResponse({
            id: view.areaId,
            codigo: view.areaCodigo!,
            nombre: view.areaNombre!,
          })
        : null,

      departamento: view.departamentoId
        ? {
            id: view.departamentoId,
            codigo: view.departamentoCodigo!,
            nombre: view.departamentoNombre!,
          }
        : null,
    };
  }
}
