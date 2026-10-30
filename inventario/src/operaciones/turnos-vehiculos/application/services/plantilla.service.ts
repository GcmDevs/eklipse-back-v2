import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { PlantillaFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EntidadEventoFlota, FormatoPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { PlantillaView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { PLANTILLA_FLOTA_REPOSITORY, PlantillaFlotaRepository } from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { AmbEventoService } from './amb-evento.service';

@Injectable()
export class PlantillaService {
  constructor(
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly eventoService: AmbEventoService,
  ) {}

  async getVigente(formato: FormatoPlantilla): Promise<PlantillaView> {
    const p = await this.plantillaRepo.findVigenteByFormato(formato);
    if (!p) throw new ResourceNotFoundError(`No hay plantilla vigente para ${formato}`);
    return {
      id: p.getId.getValor,
      formato: p.getFormato,
      version: p.getVersion,
      vigente: p.getVigente,
      estructura: p.getEstructura as unknown as Record<string, unknown>,
      creadoPorId: p.getCreadoPorId.getValor,
      createdAt: p.getCreatedAt,
    };
  }

  async listVersiones(formato: FormatoPlantilla): Promise<PlantillaView[]> {
    return this.plantillaRepo.findVersionesByFormato(formato);
  }

  async crearVersion(formato: FormatoPlantilla, estructura: PlantillaEstructuraJson): Promise<PlantillaView> {
    const usuario = getUser();
    return this.txManager.transactional(async () => {
      const max = await this.plantillaRepo.findMaxVersion(formato);
      const vigente = await this.plantillaRepo.findVigenteByFormato(formato);
      if (vigente) {
        vigente.desactivar();
        await this.plantillaRepo.update(vigente);
      }
      const nueva = PlantillaFlota.createNuevaVersion(formato, max + 1, estructura, usuario.id);
      const saved = await this.plantillaRepo.save(nueva);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.AMBULANCIA,
        entidadId: saved.getId.getValor,
        tipoEvento: 'PLANTILLA_NUEVA_VERSION',
        usuarioId: usuario.id,
      });
      return {
        id: saved.getId.getValor,
        formato: saved.getFormato,
        version: saved.getVersion,
        vigente: saved.getVigente,
        estructura: saved.getEstructura as unknown as Record<string, unknown>,
        creadoPorId: saved.getCreadoPorId.getValor,
        createdAt: saved.getCreatedAt,
      };
    });
  }

  parseFormato(raw: string): FormatoPlantilla {
    if (!Object.values(FormatoPlantilla).includes(raw as FormatoPlantilla)) {
      throw new BadInputError(`Formato inválido: ${raw}`);
    }
    return raw as FormatoPlantilla;
  }
}
