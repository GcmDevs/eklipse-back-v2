import { BadInputError } from '@common/domain/errors';
import { ClasificacionUso, TipoActivo } from '../enums';
import { MAX_KILOMETRAJE } from './tanqueo-estacion.policies';

const CAMPOS_TIPO_ACTIVO = ['anioModelo', 'clasificacionUso'] as const;
type CampoTipoActivo = (typeof CAMPOS_TIPO_ACTIVO)[number];

const POLITICA_TIPO_ACTIVO: Record<
  TipoActivo,
  {
    camposRequeridos: readonly CampoTipoActivo[];
    clasificacionesUso: readonly ClasificacionUso[];
  }
> = {
  [TipoActivo.VEHICULO]: {
    camposRequeridos: ['anioModelo', 'clasificacionUso'],
    clasificacionesUso: [
      ClasificacionUso.CARGA,
      ClasificacionUso.PRESIDENCIA,
      ClasificacionUso.UNIDAD_MOVIL,
      ClasificacionUso.MICROBUS,
      ClasificacionUso.AMBULANCIA,
      ClasificacionUso.MOTO,
    ],
  },
  [TipoActivo.MAQUINA]: {
    camposRequeridos: [],
    clasificacionesUso: [ClasificacionUso.MAQUINA, ClasificacionUso.PLANTA],
  },
};

const LABELS_CAMPO_TIPO_ACTIVO: Record<CampoTipoActivo, string> = {
  anioModelo: 'El año modelo',
  clasificacionUso: 'La clasificación de uso',
};

const TIPO_ACTIVO_POR_CLASIFICACION_USO: Record<ClasificacionUso, TipoActivo> = Object.fromEntries(
  Object.entries(POLITICA_TIPO_ACTIVO).flatMap(([tipoActivo, politica]) =>
    politica.clasificacionesUso.map(clasificacion => [clasificacion, tipoActivo])
  )
) as Record<ClasificacionUso, TipoActivo>;

export function validateCapacidadCombustible(capacidad: number | null | undefined): void {
  if (capacidad !== undefined && capacidad !== null && capacidad < 0) {
    throw new BadInputError('La capacidad de almacenamiento de combustible no puede ser negativa');
  }
}

export function validateKilometraje(kilometraje: number | null | undefined): void {
  if (kilometraje === undefined || kilometraje === null) return;

  if (!Number.isInteger(kilometraje) || kilometraje < 0 || kilometraje > MAX_KILOMETRAJE) {
    throw new BadInputError(
      `El kilometraje actual debe ser un entero entre 0 y ${MAX_KILOMETRAJE}`
    );
  }
}

export function validateAnioModelo(anioModelo: number | null | undefined): void {
  if (anioModelo === undefined || anioModelo === null) return;

  const anioMaximo = new Date().getFullYear() + 1;
  if (anioModelo < 1900 || anioModelo > anioMaximo) {
    throw new BadInputError(`El año modelo debe estar entre 1900 y ${anioMaximo}`);
  }
}

export function validateCamposRequeridosPorTipo(
  tipoActivo: TipoActivo,
  valores: Partial<Record<CampoTipoActivo, unknown>>
): void {
  const politica = POLITICA_TIPO_ACTIVO[tipoActivo];
  if (!politica) {
    throw new BadInputError(`No hay política de campos para el tipo ${tipoActivo}`);
  }

  for (const campo of politica.camposRequeridos) {
    const valor = valores[campo];
    if (valor === undefined || valor === null || valor === '') {
      throw new BadInputError(
        `${LABELS_CAMPO_TIPO_ACTIVO[campo]} es obligatorio para el tipo ${tipoActivo}`
      );
    }
  }

  const clasificacionUso = valores.clasificacionUso as ClasificacionUso | null | undefined;
  if (clasificacionUso == null || clasificacionUso === ('' as ClasificacionUso)) return;

  const tipoEsperado = TIPO_ACTIVO_POR_CLASIFICACION_USO[clasificacionUso];
  if (!tipoEsperado) {
    throw new BadInputError(
      `No hay tipo de activo configurado para la clasificación de uso ${clasificacionUso}`
    );
  }
  if (tipoEsperado !== tipoActivo) {
    throw new BadInputError(
      `La clasificación de uso ${clasificacionUso} solo aplica al tipo ${tipoEsperado}`
    );
  }
}
