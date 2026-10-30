import { Tanqueo, TanqueoCorreccion, TanqueoInconsistencia } from '@inn/operaciones/tanqueos/domain/entities';
import {
  CodigoInconsistencia,
  ModoValidacionUbicacion,
  OrigenTanqueo,
  SeveridadInconsistencia,
} from '@inn/operaciones/tanqueos/domain/enums';
import { EstadoInconsistencia, ResultadoInconsistencia } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import {
  evaluarInconsistenciasDatosDelTanqueo,
  isCodigoInconsistenciaDatos,
  isCodigoInconsistenciaUbicacion,
} from '@inn/operaciones/tanqueos/domain/helpers/evaluar-inconsistencias-datos-tanqueo.helper';
import { VENTANA_DUPLICADO_MINUTOS } from '@inn/operaciones/tanqueos/domain/policies/tanqueo-inconsistencias.policies';
import { TanqueoRepository } from '@inn/operaciones/tanqueos/domain/repositories';
import { EvaluacionUbicacionTanqueoResult } from '@inn/operaciones/tanqueos/domain/services/ubicacion-tanqueo.validator';
import { createInconsistencia, Inconsistencia } from '@inn/operaciones/tanqueos/domain/types';
import { Kilometraje } from '@inn/operaciones/tanqueos/domain/value-objects';
import { buildNotaCierreAutomaticoPorCorreccion } from './nota-cierre-automatico-inconsistencia.helper';

const CAMPO_POR_CODIGO: Partial<Record<CodigoInconsistencia, string>> = {
  [CodigoInconsistencia.KM_MENOR_ANT]: 'kilometraje',
  [CodigoInconsistencia.KM_SALTO]: 'kilometraje',
  [CodigoInconsistencia.CANT_COMB_CAP]: 'cantidadCombustible',
  [CodigoInconsistencia.VALOR_ALTO_INU]: 'valorTotalPagado',
  [CodigoInconsistencia.TQ_DUP]: 'tanqueo',
  [CodigoInconsistencia.UBIC_FUERA_RAD]: 'ubicacion',
  [CodigoInconsistencia.UBIC_DISCREP]: 'ubicacion',
  [CodigoInconsistencia.UBIC_NO_CONC]: 'ubicacion',
};

const CAMPO_CORRECCION_POR_NEGOCIO: Record<string, string> = {
  kilometraje: 'KILOMETRAJE',
  cantidadCombustible: 'CANTCOMBUST',
  valorTotalPagado: 'VALORPAGADO',
  tanqueo: 'FECHTANQUEO',
  ubicacion: 'ESTACIONOID',
};

const CAMPO_CORRECCION_LABEL: Record<string, string> = {
  KILOMETRAJE: 'kilometraje',
  CANTCOMBUST: 'cantidadCombustible',
  VALORPAGADO: 'valorTotalPagado',
  FECHTANQUEO: 'fechaTanqueo',
  ESTACIONOID: 'estacionServicioId',
};

export type ReevaluarAlertasDatosInput = {
  tanqueo: Tanqueo;
  tanqueoId: number;
  usuarioId: number;
  motivoCorreccion: string;
  correccionesGuardadas: TanqueoCorreccion[];
  inconsistenciasAbiertas: TanqueoInconsistencia[];
  validaOdometro: boolean;
  kmAnterior: Kilometraje | null;
  umbralSalto: number;
  capacidadTanque: number | null;
  tanqueoRepository: TanqueoRepository;
  reevaluarKm: boolean;
  reevaluarCantidad: boolean;
  reevaluarValor: boolean;
  reevaluarDuplicado: boolean;
  reevaluarUbicacion?: boolean;
  evaluacionUbicacion?: EvaluacionUbicacionTanqueoResult | null;
  modoUbicacion?: ModoValidacionUbicacion;
};

export type ReevaluarAlertasDatosResult = {
  inconsistenciasActualizadas: TanqueoInconsistencia[];
  inconsistenciasNuevas: TanqueoInconsistencia[];
  correccionesActualizadas: TanqueoCorreccion[];
};

function correccionPorCampo(
  correcciones: TanqueoCorreccion[],
  campoCorreccion: string
): TanqueoCorreccion | undefined {
  return correcciones.find(c => c.getCampo === campoCorreccion);
}

function codigosEnScope(input: ReevaluarAlertasDatosInput): Set<CodigoInconsistencia> {
  const codes = new Set<CodigoInconsistencia>();
  if (input.reevaluarKm) {
    codes.add(CodigoInconsistencia.KM_MENOR_ANT);
    codes.add(CodigoInconsistencia.KM_SALTO);
  }
  if (input.reevaluarCantidad) codes.add(CodigoInconsistencia.CANT_COMB_CAP);
  if (input.reevaluarValor) codes.add(CodigoInconsistencia.VALOR_ALTO_INU);
  if (input.reevaluarDuplicado) codes.add(CodigoInconsistencia.TQ_DUP);
  if (input.reevaluarUbicacion) {
    codes.add(CodigoInconsistencia.UBIC_FUERA_RAD);
    codes.add(CodigoInconsistencia.UBIC_DISCREP);
    codes.add(CodigoInconsistencia.UBIC_NO_CONC);
  }
  return codes;
}

export async function reevaluarAlertasDatosTrasCorreccion(
  input: ReevaluarAlertasDatosInput
): Promise<ReevaluarAlertasDatosResult> {
  const scope = codigosEnScope(input);
  if (!scope.size) {
    return {
      inconsistenciasActualizadas: [],
      inconsistenciasNuevas: [],
      correccionesActualizadas: [],
    };
  }

  const hasDatosScope =
    input.reevaluarKm ||
    input.reevaluarCantidad ||
    input.reevaluarValor ||
    input.reevaluarDuplicado;

  const esperadas: Inconsistencia[] = [];

  if (hasDatosScope) {
    const { promedio, muestra } = await input.tanqueoRepository.getPromedioValorPorActivo(
      input.tanqueo.getActivoId.getValor
    );
    const duplicado =
      input.reevaluarDuplicado &&
      input.tanqueo.getOrigen === OrigenTanqueo.ESTACION &&
      input.tanqueo.getValorTotalPagado != null &&
      (await input.tanqueoRepository.existsDuplicadoSospechoso({
        activoId: input.tanqueo.getActivoId.getValor,
        valorPagado: input.tanqueo.getValorTotalPagado.getMonto,
        fechaTanqueo: input.tanqueo.getFechaTanqueo,
        ventanaMinutos: VENTANA_DUPLICADO_MINUTOS,
        excludeTanqueoId: input.tanqueoId,
      }));

    const esperadasDatos = evaluarInconsistenciasDatosDelTanqueo(input.tanqueo, {
      validaOdometro: input.reevaluarKm ? input.validaOdometro : false,
      kmAnterior: input.reevaluarKm ? input.kmAnterior : null,
      umbralSalto: input.umbralSalto,
      capacidadTanque: input.capacidadTanque,
      promedioValor: promedio,
      muestraValor: muestra,
      duplicadoSospechoso: duplicado,
    }).filter(inc => scope.has(inc.codigo));

    esperadas.push(...esperadasDatos);
  }

  if (
    input.reevaluarUbicacion &&
    input.evaluacionUbicacion?.codigoInconsistencia &&
    input.modoUbicacion === ModoValidacionUbicacion.ACTIVE
  ) {
    esperadas.push(
      createInconsistencia(
        input.evaluacionUbicacion.codigoInconsistencia,
        SeveridadInconsistencia.ADVERTENCIA,
        input.evaluacionUbicacion.mensajeInconsistencia ??
          input.evaluacionUbicacion.codigoInconsistencia,
        'ubicacion'
      )
    );
  }

  const esperadasPorCodigo = new Map<CodigoInconsistencia, Inconsistencia>();
  for (const inc of esperadas) {
    esperadasPorCodigo.set(inc.codigo, inc);
  }

  const inconsistenciasActualizadas: TanqueoInconsistencia[] = [];
  const correccionesActualizadas: TanqueoCorreccion[] = [];

  for (const abierta of input.inconsistenciasAbiertas) {
    const esDatoOUbicacion =
      isCodigoInconsistenciaDatos(abierta.getCodigo) ||
      isCodigoInconsistenciaUbicacion(abierta.getCodigo);
    if (!esDatoOUbicacion) continue;
    if (!scope.has(abierta.getCodigo)) continue;
    if (esperadasPorCodigo.has(abierta.getCodigo)) continue;

    const campoNegocio = CAMPO_POR_CODIGO[abierta.getCodigo] ?? abierta.getCampo ?? 'dato';
    const campoCorr = CAMPO_CORRECCION_POR_NEGOCIO[campoNegocio] ?? 'KILOMETRAJE';
    const corr = correccionPorCampo(input.correccionesGuardadas, campoCorr);
    const correccionId = corr?.getId.getValor;
    if (!correccionId) continue;

    abierta.close({
      resueltoPorUsuarioId: input.usuarioId,
      resultado: ResultadoInconsistencia.CORREGIDA,
      notaResolucion: buildNotaCierreAutomaticoPorCorreccion(
        correccionId,
        CAMPO_CORRECCION_LABEL[campoCorr] ?? campoNegocio,
        input.motivoCorreccion
      ),
      contactoRealizado: false,
      tieneCorreccionLigada: true,
    });
    inconsistenciasActualizadas.push(abierta);

    if (corr) {
      correccionesActualizadas.push(
        TanqueoCorreccion.rebuild(
          corr.getId.getValor,
          corr.getTanqueoId.getValor,
          corr.getCampo,
          corr.getValorAnterior,
          corr.getValorNuevo,
          corr.getMotivo,
          abierta.getId.getValor,
          corr.getUsuarioId.getValor,
          corr.getCreatedAt
        )
      );
    }
  }

  const inconsistenciasNuevas: TanqueoInconsistencia[] = [];
  for (const [codigo, inc] of esperadasPorCodigo) {
    const yaAbierta = input.inconsistenciasAbiertas.some(
      a => a.getCodigo === codigo && a.getEstadoInconsistencia === EstadoInconsistencia.ABIERTA
    );
    if (yaAbierta) continue;
    inconsistenciasNuevas.push(
      TanqueoInconsistencia.create(input.tanqueoId, codigo, inc.severidad, inc.campo ?? undefined)
    );
  }

  return {
    inconsistenciasActualizadas,
    inconsistenciasNuevas,
    correccionesActualizadas,
  };
}
