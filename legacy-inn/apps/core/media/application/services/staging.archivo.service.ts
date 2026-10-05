import { STORAGE_TEMPORARILY } from '@common/application/file-locations';
import { MimeTypes } from '@common/domain/enums';
import { FindThrowOptions } from '@common/domain/types';
import { getUser } from '@common/infrastructure/services';
import { ArchivoAlmacenado } from '@core/media/domain/entities/archivo-almacenado.entity';
import {
  ARCHIVO_ALMDO_REPOSITORY,
  ArchivoAlmacenadoRepository,
} from '@core/media/domain/repositories';
import {
  ArchivoCommitted,
  ArchivoStreamRes,
  PayloadArchivo,
  PoliticaMimeStaging,
  RestriccionMimeStaging,
  SaveArchivoOptions,
} from '@core/media/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { getCategoriaByMime } from '../factories/mime-categoria-factory';
import { StorageStrategyFactory } from '../factories/storage-strategy.factory';
import { ForbiddenAccessError, ResourceNotFoundError, BadInputError } from '@common/domain/errors';

@Injectable()
export class StagingFileService {
  constructor(
    @Inject(ARCHIVO_ALMDO_REPOSITORY)
    private readonly archivoAlmdoRepository: ArchivoAlmacenadoRepository,
    private readonly storageStrategyFactory: StorageStrategyFactory
  ) {}

  public async uploadMany(archivos: Express.Multer.File[]): Promise<SaveArchivoOptions[]> {
    return Promise.all(archivos.map(arc => this.upload(arc)));
  }

  public async upload(archivo: Express.Multer.File): Promise<SaveArchivoOptions> {
    const archivoStaging = await this.saveToStaging(archivo);
    return {
      id: archivoStaging.getId.getValor,
      nombreOriginal: archivoStaging.getNombreOriginal,
    };
  }

  public async getArchivoStream(id: number): Promise<ArchivoStreamRes> {
    const archivo = await this.findById(id, { throwIfNotFound: true });
    if (archivo.getIsTemporal) {
      throw new ForbiddenAccessError('Archivo en staging, aún no confirmado');
    }

    try {
      await fs.promises.access(archivo.getRutaArchivo, fs.constants.R_OK);
    } catch {
      throw new ResourceNotFoundError(
        `Archivo registrado en DB pero no encontrado en disco: ${id}`
      );
    }
    return { stream: fs.createReadStream(archivo.getRutaArchivo), archivo };
  }

  public async commit(
    payload: PayloadArchivo,
    restrictionMime: RestriccionMimeStaging,
    flat = false
  ): Promise<ArchivoAlmacenado> {
    const { archivoId } = payload;
    const archivo = await this.archivoAlmdoRepository.findById(archivoId);

    if (!archivo) {
      throw new ResourceNotFoundError(`Archivo no encontrado: ${archivoId}. Vuelva a subirlo.`);
    }

    if (archivo.getIsUsado) {
      throw new BadInputError(`Archivo ya utilizado: ${archivoId}`);
    }

    this.validateMimePermitido(archivo, restrictionMime);
    const { archivo: result } = await this.commitArchivo(archivo, payload, flat);
    return result;
  }

  public async commitMany(
    payloads: PayloadArchivo[],
    restrictionMime: RestriccionMimeStaging,
    flat = false
  ): Promise<ArchivoAlmacenado[]> {
    const archivosIds = payloads.map(p => p.archivoId);
    const archivos = await this.archivoAlmdoRepository.findByIds(archivosIds);

    if (archivos.length !== archivosIds.length) {
      const foundIds = new Set(archivos.map(arc => arc.getId.getValor));
      const noFounds = archivosIds.filter(id => !foundIds.has(id));
      throw new ResourceNotFoundError(
        `Archivos no encontrados: ${noFounds.join(', ')}. Vuelva a subirlos.`
      );
    }

    const archivosMap = new Map(archivos.map(arc => [arc.getId.getValor, arc]));
    const pares = payloads.map(payload => ({
      archivo: archivosMap.get(payload.archivoId)!,
      payload,
    }));

    const alreadyUsados = pares.filter(({ archivo }) => archivo.getIsUsado);
    if (alreadyUsados.length) {
      throw new BadInputError(
        `Archivos ya utilizados: ${alreadyUsados.map(({ archivo }) => archivo.getId.getValor).join(', ')}`
      );
    }

    for (const { archivo } of pares) {
      this.validateMimePermitido(archivo, restrictionMime);
    }

    const results: ArchivoAlmacenado[] = [];
    const committed: { rutaOrigen: string; destino: string; archivoId: number }[] = [];

    for (const { archivo, payload } of pares) {
      try {
        const {
          archivo: result,
          destino,
          rutaOrigen,
        } = await this.commitArchivo(archivo, payload, flat);
        results.push(result);
        committed.push({ rutaOrigen, destino, archivoId: archivo.getId.getValor });
      } catch (error) {
        await Promise.allSettled(
          committed.map(async ({ rutaOrigen, destino, archivoId }) => {
            await fs.promises.rename(destino, rutaOrigen).catch(() => null);
            await this.archivoAlmdoRepository
              .revertToStaging(archivoId, rutaOrigen)
              .catch(() => null);
          })
        );
        throw error;
      }
    }

    return results;
  }

  private validateMimePermitido(
    archivo: ArchivoAlmacenado,
    restriction: RestriccionMimeStaging
  ): void {
    if (restriction === PoliticaMimeStaging.ANY) return;

    const mime = archivo.getTipoMime;
    if ('tiposMime' in restriction && restriction.tiposMime.includes(mime)) return;

    const categoria = getCategoriaByMime(mime);
    if (
      'categorias' in restriction &&
      categoria !== null &&
      restriction.categorias.includes(categoria)
    )
      return;

    const permitido =
      'tiposMime' in restriction
        ? restriction.tiposMime.join(', ')
        : restriction.categorias.join(', ');

    throw new BadInputError(
      `El archivo con id ${archivo.getId.getValor} tiene un tipo no permitido (${mime}). ` +
        `Tipos o categorías permitidas: ${permitido}`
    );
  }

  public async deprecate(archivoId: number): Promise<void> {
    const archivo = await this.archivoAlmdoRepository.findById(archivoId);
    if (!archivo) {
      throw new ResourceNotFoundError(`Archivo con id: ${archivoId} no encontrado`);
    }

    await fs.promises.rm(archivo.getRutaArchivo, { force: true });
    await this.archivoAlmdoRepository.remove(archivo.getId.getValor);
  }

  public async deprecateMany(archivosIds: number[]): Promise<PromiseSettledResult<void>[]> {
    const resultados = await Promise.allSettled(archivosIds.map(id => this.deprecate(id)));
    const faileds = resultados
      .map((r, i) => ({ r, id: archivosIds[i] }))
      .filter(({ r }) => r.status === 'rejected');

    if (faileds.length) {
      throw new Error(
        `No se pudieron deprecar los archivos: ${faileds.map(({ id }) => id).join(', ')}`
      );
    }

    return resultados;
  }

  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<ArchivoAlmacenado | null> {
    const archivo = await this.archivoAlmdoRepository.findById(id);
    if (!archivo && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Archivo con id: ${id} no encontrado`);
    }
    return archivo;
  }

  public async findByIds(ids: number[]): Promise<ArchivoAlmacenado[]> {
    return this.archivoAlmdoRepository.findByIds(ids);
  }

  private async commitArchivo(
    archivo: ArchivoAlmacenado,
    { module, ...payload }: PayloadArchivo,
    flat: boolean
  ): Promise<ArchivoCommitted> {
    const categoria = getCategoriaByMime(archivo.getTipoMime);

    if (!categoria) {
      throw new Error(`Formato no soportado: ${archivo.getTipoMime}`);
    }

    const strategy = flat
      ? this.storageStrategyFactory.getFlatStrategy()
      : this.storageStrategyFactory.getStrategy(categoria);

    if (!strategy.validateFile(archivo)) {
      throw new BadInputError(`Archivo invalido para guardar: id=${archivo.getId.getValor}`);
    }

    const destinoDir = strategy.getDestinationDir({ category: categoria, module }, archivo);

    const destino = path.join(destinoDir, archivo.getNombreAlmacenado);

    await fs.promises.mkdir(path.dirname(destino), {
      recursive: true,
    });

    let rutaOriginal = archivo.getRutaArchivo;

    const existe = await this.existsFile(rutaOriginal);
    if (!existe) {
      const encontrada = await this.searchFileInPublic(archivo.getNombreAlmacenado);

      if (!encontrada) {
        throw new BadInputError(`Archivo origen no encontrado id=${archivo.getId.getValor}`);
      }

      rutaOriginal = encontrada;
    }

    try {
      await fs.promises.rename(rutaOriginal, destino);
    } catch (error) {
      throw new BadInputError(`Error moviendo archivo id=${archivo.getId.getValor}: ${error}`);
    }

    try {
      const usuarioCarga = getUser();
      archivo.MarkAsUsado(destino, payload.contexto, payload.referenciaId, usuarioCarga.id);

      const archivoCommitted = await this.archivoAlmdoRepository.markAsUsado(archivo);

      return {
        archivo: archivoCommitted,
        destino,
        rutaOrigen: rutaOriginal,
      };
    } catch (error) {
      await fs.promises.rename(destino, rutaOriginal).catch(() => null);
      throw error;
    }
  }

  private async saveToStaging(archivo: Express.Multer.File): Promise<ArchivoAlmacenado> {
    const nombreOriginal = archivo?.originalname || 'unknown';
    const extension = path.extname(nombreOriginal).toLowerCase() || '';
    const nombreArchivoAlmdo = `${crypto.randomUUID()}${extension}`;
    const rutaArchivo = path.join(STORAGE_TEMPORARILY, nombreArchivoAlmdo);

    await fs.promises.mkdir(STORAGE_TEMPORARILY, { recursive: true });
    await fs.promises.writeFile(rutaArchivo, archivo.buffer as any);

    const archivoAlmdo = ArchivoAlmacenado.create(
      nombreOriginal,
      nombreArchivoAlmdo,
      extension,
      archivo.mimetype as MimeTypes,
      archivo.size,
      rutaArchivo
    );

    const archivoSaved = await this.archivoAlmdoRepository.save(archivoAlmdo);
    return archivoSaved;
  }

  private async existsFile(ruta: string): Promise<boolean> {
    try {
      await fs.promises.access(ruta);
      return true;
    } catch {
      return false;
    }
  }

  private async searchFileInPublic(nombre: string): Promise<string | null> {
    const root = path.join(process.cwd(), '../public');
    const existeRoot = await this.existsFile(root);

    if (!existeRoot) {
      throw new Error(`No existe carpeta public: ${root}`);
    }

    const walk = async (dir: string): Promise<string | null> => {
      const entries = await fs.promises.readdir(dir, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = await walk(full);

          if (found) return found;
        }

        if (entry.isFile() && entry.name.toLowerCase() === nombre.toLowerCase()) {
          return full;
        }
      }

      return null;
    };

    return await walk(root);
  }
}
