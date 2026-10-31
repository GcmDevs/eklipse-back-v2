import { TipoProductoInvima } from './invima.models';
import { RenglonFactura } from './factura.models';
import {
  calcularMuestreo,
  validarCantidad,
  redondearCantidad,
} from '../../recepcion-tecnica/inspeccion';

export type DecisionRecepcion = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'NO_RECIBIDO';
export interface FisicoRecepcion {
  tipo: TipoProductoInvima;
  descripcion: string;
  cantidad: number | null;
  codigoDeclarado: string;
  registroSanitario: string;
  ium: string;
  numeroResolucion: string;
  lotes: { cantidad: number | null; lote: string; vencimiento: string }[];
  cantidadAveria: number;
  cantidadNoSolicitada: number;
  estadoEmpaque: 'BUENO' | 'ACEPTABLE' | 'DETERIORADO' | '';
  riesgo: string;
  marca: string;
  concentracion: string;
  unidadConcentracion: string;
  temperatura: number | null;
  unidadTemperatura: 'C' | 'F' | 'K';
  laboratorio: string;
  presentacion: string;
  formaFarmaceutica: string;
  etiquetaConforme: boolean;
  sellosConformes: boolean;
  fabricanteConforme: boolean;
  erroresCriticos: number;
  motivosRechazo: ('CUM' | 'INVIMA')[];
}
export const requiereConcentracion = (tipo: TipoProductoInvima) =>
  ['MEDICAMENTO', 'REACTIVO_DIAGNOSTICO', 'REACTIVOS_IN_VITRO', 'VITAL_NO_DISPONIBLE'].includes(
    tipo
  );
export function fisicoVacio(tipo: TipoProductoInvima): FisicoRecepcion {
  return {
    tipo,
    descripcion: '',
    cantidad: null,
    codigoDeclarado: '',
    registroSanitario: '',
    ium: '',
    numeroResolucion: '',
    lotes: [],
    cantidadAveria: 0,
    cantidadNoSolicitada: 0,
    estadoEmpaque: '',
    riesgo: '',
    marca: '',
    concentracion: '',
    unidadConcentracion: '',
    temperatura: null,
    unidadTemperatura: 'C',
    laboratorio: '',
    presentacion: '',
    formaFarmaceutica: '',
    etiquetaConforme: false,
    sellosConformes: false,
    fabricanteConforme: false,
    erroresCriticos: 0,
    motivosRechazo: [],
  };
}
const codigo = (s: string) => (s || '').trim().toUpperCase().replace(/\s+/g, '');
const registro = (s: string) => codigo((s || '').replace(/\bINVIMA\b/gi, ''));
export function compararRecepcion(factura: RenglonFactura, fisico: FisicoRecepcion) {
  const comparacion = (a: string, b: string, normalizar: (s: string) => string) =>
    !a?.trim() || !b?.trim()
      ? 'SIN_DATO'
      : normalizar(a) === normalizar(b)
        ? 'COINCIDE'
        : 'DIFIERE';
  const aplica = fisico.tipo !== 'VITAL_NO_DISPONIBLE';
  return {
    cum: aplica
      ? comparacion(factura.codigoDeclarado, fisico.codigoDeclarado, codigo)
      : 'NO_APLICA',
    registro: aplica
      ? comparacion(factura.registroSanitario, fisico.registroSanitario, registro)
      : 'NO_APLICA',
    tipo: factura.tipo === fisico.tipo ? 'COINCIDE' : 'DIFIERE',
    faltante:
      factura.cantidad == null || fisico.cantidad == null
        ? null
        : Math.max(0, redondearCantidad(factura.cantidad - fisico.cantidad)),
    sobrante:
      factura.cantidad == null || fisico.cantidad == null
        ? null
        : Math.max(0, redondearCantidad(fisico.cantidad - factura.cantidad)),
  };
}
export function validarCaptura(f: FisicoRecepcion) {
  if (f.cantidad !== null) validarCantidad(f.cantidad);
  validarCantidad(f.cantidadAveria);
  validarCantidad(f.cantidadNoSolicitada);
  if (f.cantidad !== null && (f.cantidadAveria > f.cantidad || f.cantidadNoSolicitada > f.cantidad))
    throw new Error('Las novedades no pueden superar lo recibido físicamente.');
  if (
    f.motivosRechazo.some(m => !['CUM', 'INVIMA'].includes(m)) ||
    new Set(f.motivosRechazo).size !== f.motivosRechazo.length
  )
    throw new Error('Motivos de rechazo inválidos.');
  if (f.tipo === 'VITAL_NO_DISPONIBLE' && f.motivosRechazo.length)
    throw new Error('CUM e INVIMA no aplican al vital no disponible.');
  for (const l of f.lotes) if (l.cantidad !== null) validarCantidad(l.cantidad, true);
  if (!Number.isInteger(f.erroresCriticos) || f.erroresCriticos < 0)
    throw new Error('Los errores críticos deben ser enteros no negativos.');
}
export function validarDecision(
  factura: RenglonFactura,
  f: FisicoRecepcion,
  decision: DecisionRecepcion,
  justificacion: string,
  oficial: string
) {
  validarCaptura(f);
  if (decision === 'PENDIENTE') return;
  if (f.cantidad === null) throw new Error('Digite la cantidad física recibida.');
  if (f.cantidad === 0) {
    if (decision !== 'NO_RECIBIDO' || f.lotes.length || f.cantidadAveria || f.cantidadNoSolicitada)
      throw new Error(
        'Con cero unidades seleccione No recibido y retire los lotes/novedades físicas.'
      );
    if (factura.cantidad == null && !justificacion.trim())
      throw new Error('Justifique la cantidad facturada ausente del documento antiguo.');
    return;
  }
  if (decision === 'NO_RECIBIDO') throw new Error('No recibido requiere cantidad física cero.');
  if (!f.descripcion.trim() || f.tipo === 'SIN_CLASIFICAR')
    throw new Error('Identifique y clasifique el producto físico.');
  if (!f.estadoEmpaque || !f.riesgo.trim() || !f.marca.trim() || f.temperatura === null)
    throw new Error('Complete riesgo, marca, temperatura y estado del empaque.');
  if (requiereConcentracion(f.tipo) && (!f.concentracion.trim() || !f.unidadConcentracion.trim()))
    throw new Error('Complete concentración y unidad de medida.');
  const vital = f.tipo === 'VITAL_NO_DISPONIBLE';
  if (vital && !f.ium.trim() && !f.numeroResolucion.trim())
    throw new Error('El vital no disponible requiere IUM o resolución.');
  const nombres = new Set<string>();
  let total = 0;
  for (const l of f.lotes) {
    if (
      l.cantidad === null ||
      !l.lote.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(l.vencimiento) ||
      !Number.isFinite(new Date(l.vencimiento).getTime()) ||
      new Date(l.vencimiento).toISOString().slice(0, 10) !== l.vencimiento ||
      nombres.has(codigo(l.lote))
    )
      throw new Error('Complete los lotes, sin duplicar nombres y con fecha válida.');
    nombres.add(codigo(l.lote));
    total = redondearCantidad(total + l.cantidad);
  }
  if (total !== f.cantidad)
    throw new Error('La suma de los lotes debe coincidir con la cantidad física digitada.');
  const c = compararRecepcion(factura, f);
  const diferencias = [c.cum, c.registro, c.tipo].some(v => v === 'DIFIERE' || v === 'SIN_DATO');
  const excepcion = !vital && !['EXACTA', 'CONFIRMADA'].includes(oficial);
  if ((diferencias || factura.cantidad == null || excepcion) && !justificacion.trim())
    throw new Error(
      'Justifique las diferencias, datos ausentes o la consulta oficial no concluyente.'
    );
  if (decision === 'ACEPTADO') {
    if (!vital && oficial === 'PENDIENTE')
      throw new Error('Consulte el producto físico antes de aceptarlo.');
    if (f.motivosRechazo.length)
      throw new Error('Un producto aceptado no puede tener motivos de rechazo.');
    if (
      !f.etiquetaConforme ||
      !f.sellosConformes ||
      (!vital && !f.fabricanteConforme) ||
      f.estadoEmpaque === 'DETERIORADO' ||
      !calcularMuestreo(f.cantidad, f.erroresCriticos).cumple
    )
      throw new Error('Los controles físicos o el muestreo no cumplen. Registre rechazo.');
  } else if (decision === 'RECHAZADO' && !f.motivosRechazo.length && !justificacion.trim())
    throw new Error('Indique el motivo u observación del rechazo.');
}
