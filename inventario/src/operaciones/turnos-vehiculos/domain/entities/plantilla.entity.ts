import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { FormatoPlantilla } from '../enums';
import { PlantillaEstructuraJson } from '../types';

export class PlantillaFlota {
  private constructor(
    private readonly id: Id,
    private formato: FormatoPlantilla,
    private version: number,
    private vigente: boolean,
    private estructura: PlantillaEstructuraJson,
    private creadoPorId: Id,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createNuevaVersion(
    formato: FormatoPlantilla,
    version: number,
    estructura: PlantillaEstructuraJson,
    creadoPorId: number,
  ): PlantillaFlota {
    const now = new Date();
    PlantillaFlota.validateEstructura(estructura);
    return new PlantillaFlota(
      new Id(),
      formato,
      version,
      true,
      estructura,
      new Id(creadoPorId),
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    formato: FormatoPlantilla,
    version: number,
    vigente: boolean,
    estructura: PlantillaEstructuraJson,
    creadoPorId: number,
    createdAt: Date,
    updatedAt: Date,
  ): PlantillaFlota {
    return new PlantillaFlota(
      new Id(id),
      formato,
      version,
      vigente,
      estructura,
      new Id(creadoPorId),
      createdAt,
      updatedAt,
    );
  }

  static validateEstructura(estructura: PlantillaEstructuraJson): void {
    const keys = new Set<string>();
    for (const cat of estructura.categorias ?? []) {
      for (const item of cat.items ?? []) {
        if (!item.key) throw new BadInputError('Cada ítem debe tener key');
        if (keys.has(item.key)) throw new BadInputError(`Key duplicada: ${item.key}`);
        keys.add(item.key);
      }
    }
  }

  desactivar(): void {
    this.vigente = false;
    this.updatedAt = new Date();
  }

  get getId(): Id { return this.id; }
  get getFormato(): FormatoPlantilla { return this.formato; }
  get getVersion(): number { return this.version; }
  get getVigente(): boolean { return this.vigente; }
  get getEstructura(): PlantillaEstructuraJson { return this.estructura; }
  get getCreadoPorId(): Id { return this.creadoPorId; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
