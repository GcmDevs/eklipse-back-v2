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
  registroSanitarioRevisado?: boolean;
  etiquetaConforme: boolean;
  sellosConformes: boolean;
  fabricanteConforme: boolean;
  erroresCriticos: number;
  motivosRechazo: ('CUM' | 'INVIMA')[];
}
export type FisicoBorradorRecepcion = Omit<
  FisicoRecepcion,
  'cantidadAveria' | 'cantidadNoSolicitada' | 'erroresCriticos'
> & {
  cantidadAveria: number | null;
  cantidadNoSolicitada: number | null;
  erroresCriticos: number | null;
};
export interface BorradorRecepcion {
  fisico: FisicoBorradorRecepcion;
  decision: DecisionRecepcion;
  justificacion: string;
  fecha: string;
  usuarioId: number;
  usuarioNombre: string;
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
    registroSanitarioRevisado: false,
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
/** Field paths match the reception payload so clients can locate invalid inputs. */
export class ErrorValidacionRecepcion extends Error {
  readonly campos: Record<string, string>;
  constructor(message: string, campos: string[] | Record<string, string>) {
    super(message);
    this.name = 'ErrorValidacionRecepcion';
    this.campos = Array.isArray(campos)
      ? Object.fromEntries(campos.map(campo => [campo, message]))
      : campos;
  }
}
function cantidadValida(cantidad: number, campo: string, positiva = false) {
  try {
    validarCantidad(cantidad, positiva);
  } catch (error) {
    throw new ErrorValidacionRecepcion(error.message, [campo]);
  }
}
export function validarCaptura(f: FisicoRecepcion) {
  if (f.registroSanitarioRevisado !== undefined && typeof f.registroSanitarioRevisado !== 'boolean')
    throw new ErrorValidacionRecepcion(
      'La revisión del registro sanitario debe ser un valor booleano.',
      ['fisico.registroSanitarioRevisado']
    );
  if (f.cantidad !== null) cantidadValida(f.cantidad, 'fisico.cantidad');
  cantidadValida(f.cantidadAveria, 'fisico.cantidadAveria');
  cantidadValida(f.cantidadNoSolicitada, 'fisico.cantidadNoSolicitada');
  if (f.cantidad !== null && (f.cantidadAveria > f.cantidad || f.cantidadNoSolicitada > f.cantidad))
    throw new ErrorValidacionRecepcion('Las novedades no pueden superar lo recibido físicamente.', [
      ...(f.cantidadAveria > f.cantidad ? ['fisico.cantidadAveria'] : []),
      ...(f.cantidadNoSolicitada > f.cantidad ? ['fisico.cantidadNoSolicitada'] : []),
    ]);
  if (
    f.motivosRechazo.some(m => !['CUM', 'INVIMA'].includes(m)) ||
    new Set(f.motivosRechazo).size !== f.motivosRechazo.length
  )
    throw new ErrorValidacionRecepcion('Motivos de rechazo inválidos.', ['fisico.motivosRechazo']);
  if (f.tipo === 'VITAL_NO_DISPONIBLE' && f.motivosRechazo.length)
    throw new ErrorValidacionRecepcion('CUM e INVIMA no aplican al vital no disponible.', [
      'fisico.motivosRechazo',
    ]);
  f.lotes.forEach((l, index) => {
    if (l.cantidad !== null) cantidadValida(l.cantidad, `fisico.lotes.${index}.cantidad`, true);
  });
  if (!Number.isInteger(f.erroresCriticos) || f.erroresCriticos < 0)
    throw new ErrorValidacionRecepcion('Los errores críticos deben ser enteros no negativos.', [
      'fisico.erroresCriticos',
    ]);
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
  if (f.cantidad === null)
    throw new ErrorValidacionRecepcion('Digite la cantidad física recibida.', ['fisico.cantidad']);
  if (f.cantidad === 0) {
    if (decision !== 'NO_RECIBIDO' || f.lotes.length || f.cantidadAveria || f.cantidadNoSolicitada)
      throw new ErrorValidacionRecepcion(
        'Con cero unidades seleccione No recibido y retire los lotes/novedades físicas.',
        [
          ...(decision !== 'NO_RECIBIDO' ? ['decision'] : []),
          ...(f.lotes.length ? ['fisico.lotes'] : []),
          ...(f.cantidadAveria ? ['fisico.cantidadAveria'] : []),
          ...(f.cantidadNoSolicitada ? ['fisico.cantidadNoSolicitada'] : []),
        ]
      );
    if (factura.cantidad == null && !justificacion.trim())
      throw new ErrorValidacionRecepcion(
        'Justifique la cantidad facturada ausente del documento antiguo.',
        ['justificacion']
      );
    return;
  }
  if (decision === 'NO_RECIBIDO')
    throw new ErrorValidacionRecepcion('No recibido requiere cantidad física cero.', ['decision']);
  if (!f.descripcion.trim() || f.tipo === 'SIN_CLASIFICAR')
    throw new ErrorValidacionRecepcion('Identifique y clasifique el producto físico.', [
      ...(!f.descripcion.trim() ? ['fisico.descripcion'] : []),
      ...(f.tipo === 'SIN_CLASIFICAR' ? ['fisico.tipo'] : []),
    ]);
  if (!f.estadoEmpaque || !f.riesgo.trim() || !f.marca.trim() || f.temperatura === null)
    throw new ErrorValidacionRecepcion(
      'Complete riesgo, marca, temperatura y estado del empaque.',
      {
        ...(!f.riesgo.trim() ? { 'fisico.riesgo': 'Seleccione la clasificación de riesgo.' } : {}),
        ...(!f.marca.trim() ? { 'fisico.marca': 'Digite la marca del producto.' } : {}),
        ...(f.temperatura === null
          ? { 'fisico.temperatura': 'Digite la temperatura recibida.' }
          : {}),
        ...(!f.estadoEmpaque
          ? { 'fisico.estadoEmpaque': 'Seleccione el estado del empaque.' }
          : {}),
      }
    );
  if (requiereConcentracion(f.tipo) && (!f.concentracion.trim() || !f.unidadConcentracion.trim()))
    throw new ErrorValidacionRecepcion('Complete concentración y unidad de medida.', {
      ...(!f.concentracion.trim()
        ? { 'fisico.concentracion': 'Digite la concentración del producto.' }
        : {}),
      ...(!f.unidadConcentracion.trim()
        ? { 'fisico.unidadConcentracion': 'Seleccione la unidad de medida.' }
        : {}),
    });
  const vital = f.tipo === 'VITAL_NO_DISPONIBLE';
  if (vital && !f.ium.trim() && !f.numeroResolucion.trim())
    throw new ErrorValidacionRecepcion('El vital no disponible requiere IUM o resolución.', [
      'fisico.ium',
      'fisico.numeroResolucion',
    ]);
  const nombres = new Set<string>();
  let total = 0;
  for (const [index, l] of f.lotes.entries()) {
    const cantidadAusente = l.cantidad === null;
    const nombreInvalido = !l.lote.trim() || nombres.has(codigo(l.lote));
    const fechaInvalida =
      !/^\d{4}-\d{2}-\d{2}$/.test(l.vencimiento) ||
      !Number.isFinite(new Date(l.vencimiento).getTime()) ||
      new Date(l.vencimiento).toISOString().slice(0, 10) !== l.vencimiento;
    if (cantidadAusente || nombreInvalido || fechaInvalida)
      throw new ErrorValidacionRecepcion(
        'Complete los lotes, sin duplicar nombres y con fecha válida.',
        {
          ...(cantidadAusente
            ? { [`fisico.lotes.${index}.cantidad`]: 'Digite la cantidad del lote.' }
            : {}),
          ...(nombreInvalido
            ? {
                [`fisico.lotes.${index}.lote`]: !l.lote.trim()
                  ? 'Digite el lote recibido.'
                  : 'El nombre del lote ya está registrado.',
              }
            : {}),
          ...(fechaInvalida
            ? { [`fisico.lotes.${index}.vencimiento`]: 'Digite una fecha de vencimiento válida.' }
            : {}),
        }
      );
    nombres.add(codigo(l.lote));
    total = redondearCantidad(total + l.cantidad);
  }
  if (total !== f.cantidad)
    throw new ErrorValidacionRecepcion(
      'La suma de los lotes debe coincidir con la cantidad física digitada.',
      ['fisico.lotes']
    );
  const c = compararRecepcion(factura, f);
  const diferencias = [c.cum, c.registro, c.tipo].some(v => v === 'DIFIERE' || v === 'SIN_DATO');
  const excepcion = !vital && !['EXACTA', 'CONFIRMADA'].includes(oficial);
  if ((diferencias || factura.cantidad == null || excepcion) && !justificacion.trim())
    throw new ErrorValidacionRecepcion(
      'Justifique las diferencias, datos ausentes o la consulta oficial no concluyente.',
      ['justificacion']
    );
  if (decision === 'ACEPTADO') {
    if (!vital && oficial === 'PENDIENTE')
      throw new ErrorValidacionRecepcion('Consulte el producto facturado antes de aceptarlo.', [
        'verificacionFactura',
      ]);
    if (f.motivosRechazo.length)
      throw new ErrorValidacionRecepcion(
        'Un producto aceptado no puede tener motivos de rechazo.',
        ['decision', 'fisico.motivosRechazo']
      );
    if (
      !f.etiquetaConforme ||
      !f.sellosConformes ||
      // Missing in legacy receipts: preserve their previously recorded decisions.
      (!vital && f.registroSanitarioRevisado === false) ||
      (!vital && !f.fabricanteConforme) ||
      f.estadoEmpaque === 'DETERIORADO' ||
      !calcularMuestreo(f.cantidad, f.erroresCriticos).cumple
    )
      throw new ErrorValidacionRecepcion(
        'Los controles físicos o el muestreo no cumplen. Registre rechazo.',
        [
          ...(!f.etiquetaConforme ? ['fisico.etiquetaConforme'] : []),
          ...(!f.sellosConformes ? ['fisico.sellosConformes'] : []),
          ...(!vital && f.registroSanitarioRevisado === false
            ? ['fisico.registroSanitarioRevisado']
            : []),
          ...(!vital && !f.fabricanteConforme ? ['fisico.fabricanteConforme'] : []),
          ...(f.estadoEmpaque === 'DETERIORADO' ? ['fisico.estadoEmpaque'] : []),
          ...(!calcularMuestreo(f.cantidad, f.erroresCriticos).cumple
            ? ['fisico.erroresCriticos']
            : []),
        ]
      );
  } else if (decision === 'RECHAZADO' && !f.motivosRechazo.length && !justificacion.trim())
    throw new ErrorValidacionRecepcion('Indique el motivo u observación del rechazo.', [
      'justificacion',
    ]);
}
