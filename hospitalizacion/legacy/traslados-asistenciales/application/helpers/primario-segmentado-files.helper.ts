import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { basename, extname, resolve, sep } from 'path';
import { LGC_TAS_LOCATIONS } from '../constants';

export type PrimarioSegmentadoArchivoDirectorio = keyof typeof LGC_TAS_LOCATIONS;
export type PrimarioSegmentadoArchivoTipo = 'MAPA' | 'EVIDENCIA' | 'FIRMA';

const resolveDirectorio = (directorio: PrimarioSegmentadoArchivoDirectorio): string =>
  resolve(process.cwd(), '..', LGC_TAS_LOCATIONS[directorio]);

const resolveArchivo = (
  directorio: PrimarioSegmentadoArchivoDirectorio,
  nombre: string
): string => {
  if (!nombre || basename(nombre) !== nombre) {
    throw new Error('El nombre del archivo que se desea eliminar no es valido');
  }

  const raiz = resolveDirectorio(directorio);
  const archivo = resolve(raiz, nombre);
  if (!archivo.startsWith(`${raiz}${sep}`)) {
    throw new Error('No se permite eliminar archivos fuera del modulo de traslados');
  }
  return archivo;
};

export const primarioSegmentadoFileName =
  (tipo: PrimarioSegmentadoArchivoTipo) =>
  (
    req: any,
    file: Express.Multer.File,
    callback: (error: Error, filename?: string) => void
  ): void => {
    const trasladoId = Number(req?.params?.trasladoId);
    if (!Number.isInteger(trasladoId) || trasladoId <= 0) {
      callback(new Error('No fue posible identificar el traslado del archivo'));
      return;
    }

    const extensionOriginal = extname(file.originalname).toLowerCase();
    const extension = /^\.[a-z0-9]{1,10}$/.test(extensionOriginal) ? extensionOriginal : '';
    callback(null, `PRI_${trasladoId}_${tipo}_${randomUUID()}${extension}`);
  };

export const deletePrimarioSegmentadoFile = async (
  directorio: PrimarioSegmentadoArchivoDirectorio,
  nombre?: string
): Promise<void> => {
  if (!nombre) return;
  try {
    await fs.unlink(resolveArchivo(directorio, nombre));
  } catch (error: any) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
};

export const deletePrimarioSegmentadoFiles = async (
  directorio: PrimarioSegmentadoArchivoDirectorio,
  nombres: Array<string | null | undefined>
): Promise<void> => {
  const unicos = [...new Set(nombres.filter((nombre): nombre is string => !!nombre))];
  const resultados = await Promise.allSettled(
    unicos.map(nombre => deletePrimarioSegmentadoFile(directorio, nombre))
  );
  const errores = resultados.filter(resultado => resultado.status === 'rejected');
  if (errores.length) {
    throw new Error(`No fue posible eliminar ${errores.length} archivo(s) del traslado primario`);
  }
};
