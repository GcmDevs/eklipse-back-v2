import { PlantillaFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { FormatoPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { PlantillaView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { AmbPlantillaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-plantilla.orm';

export class PlantillaFlotaMapper {
  static toDomain(orm: AmbPlantillaOrm): PlantillaFlota {
    return PlantillaFlota.rebuild(
      orm.id,
      orm.formato as FormatoPlantilla,
      orm.version,
      orm.vigente,
      orm.estructura as unknown as PlantillaEstructuraJson,
      orm.creadoPorId,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: PlantillaFlota): AmbPlantillaOrm {
    const orm = new AmbPlantillaOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.formato = domain.getFormato;
    orm.version = domain.getVersion;
    orm.vigente = domain.getVigente;
    orm.estructura = domain.getEstructura as unknown as Record<string, unknown>;
    orm.creadoPorId = domain.getCreadoPorId.getValor;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: AmbPlantillaOrm): PlantillaView {
    return {
      id: orm.id,
      formato: orm.formato,
      version: orm.version,
      vigente: orm.vigente,
      estructura: orm.estructura,
      creadoPorId: orm.creadoPorId,
      createdAt: orm.createdAt,
    };
  }
}
