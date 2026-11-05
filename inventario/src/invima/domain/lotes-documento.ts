import type { LoteDocumento } from './factura.models';

/** Lotes declarados en el documento; nunca sustituyen la inspección física. */
export function normalizarLotes(lotes: string[]): string[] {
  return [
    ...new Set(
      lotes
        .map(l => l.trim())
        .filter(l => l && !/^(?:N\/?A|N\.A\.?|NO APLICA|SIN LOTE|-)$/i.test(l))
    ),
  ];
}

export function extraerLotesPdf(formato: string, texto: string): string[] {
  const encontrados: string[] = [];
  const buscar = (regex: RegExp) => {
    for (const m of texto.matchAll(regex)) encontrados.push(m[1]);
  };
  // Se utilizan posiciones verificadas de cada formato, no números aislados.
  switch (formato) {
    case 'FARMALOGICA':
      buscar(/^\d[\d.]*\t([A-Z0-9][A-Z0-9._/-]*)\s*\/\s*\d{2}-[a-z]+\.?-\d{4}\t/gim);
      break;
    case 'ALFA_TRADING':
      buscar(/\$[\d,]+\t([^\s]+)\s+[\d,]+\s+\$[\d,]+/g);
      break;
    case 'MEDTRONIC':
      buscar(/^\d[\d.]*\t([^\s]+)\s+[\d.,]+\s+\d+(?:[.,]\d+)?%\t/gm);
      break;
    case 'BAXTER':
    case 'VANTIVE':
      buscar(/\t\d{2}-\d{2}-\d{2}\t([^\s]+)\t/g);
      break;
    case 'LM_INSTRUMENTS':
      buscar(/^([A-Z0-9][A-Z0-9._/-]*)\s*\n\d{2}\/\d{2}\/\d{4}(?:\s|$)/gm);
      break;
    case 'DELTA':
      buscar(/\t([^\s]+)[ \t]+\d{2}-\d{2}-\d{4}[ \t]+\$/g);
      break;
    case 'GRUPO_AFIN':
      buscar(/\t\d{2}\/\d{2}\/\d{4}\t([^\s]+)\s+\$/g);
      break;
    case 'CRUZ_VERDE':
      buscar(/\bCANTIDAD\s+[\d.,]+\s*\/\s*([^\s/]+)\s*\/\s*\d{2}-\d{2}-\d{4}/gi);
      break;
    case 'SICMAFARMA':
      buscar(/^\S+[ \t]+CJ[^\t\n]*\t\s*\d{2}-\d{2}-\d{4}\t([^\t\r\n]+)/gim);
      break;
    case 'XINETIX':
      buscar(/^([A-Z0-9][A-Z0-9._/-]*)\s+-\s+\d{4}-\d{2}-\d{2}\s+-\s+[\d.,]+/gim);
      break;
    case 'VITALIS':
      buscar(/^([A-Z0-9][A-Z0-9._/-]*)\s*\nVence:\s*\n\d{2}\.\d{2}\.\d{4}/gim);
      break;
    case 'LIFE':
      buscar(/LOTE:\s*VENCE:\s*(?:CANT:\s*)?CUM:\s*([^\s]+)\s+[\d,.]+\s+\d{2}\/\d{2}\/\d{4}/gi);
      break;
    case 'B_BRAUN':
      buscar(/Lote:\s*No\.:\s*Vence:\s*([^\s]+)\s+\d{8}/gi);
      break;
    case 'CAFAM':
      break; // La muestra no publica lotes: no usar el código de producto.
    default:
      // Evedisa, Offimedicas, Life alternativa, Seven, Surgicon y Vygon.
      for (const m of texto.matchAll(/\bLOTE(?:\s+No\.)?\s*:\s*([^\s:]+)/gi)) {
        if (/CANTIDAD\s*$/i.test(texto.slice(Math.max(0, m.index! - 24), m.index))) continue;
        if (!/^(?:VENCE|VENCIMIENTO|CANT|CUM|NO\.|CODIGO)$/i.test(m[1])) encontrados.push(m[1]);
      }
      buscar(/\bLote\s+([^\s]+)\s+Vence\b/gi);
  }
  return normalizarLotes(encontrados).filter(l => l.length <= 120);
}

const meses: Record<string, number> = {
  ENE: 1,
  JAN: 1,
  ENERO: 1,
  JANUARY: 1,
  FEB: 2,
  FEBRERO: 2,
  FEBRUARY: 2,
  MAR: 3,
  MARZO: 3,
  MARCH: 3,
  ABR: 4,
  APR: 4,
  ABRIL: 4,
  APRIL: 4,
  MAY: 5,
  MAYO: 5,
  JUN: 6,
  JUNIO: 6,
  JUNE: 6,
  JUL: 7,
  JULIO: 7,
  JULY: 7,
  AGO: 8,
  AUG: 8,
  AGOSTO: 8,
  AUGUST: 8,
  SEP: 9,
  SEPT: 9,
  SEPTIEMBRE: 9,
  SEPTEMBER: 9,
  OCT: 10,
  OCTUBRE: 10,
  OCTOBER: 10,
  NOV: 11,
  NOVIEMBRE: 11,
  NOVEMBER: 11,
  DIC: 12,
  DEC: 12,
  DICIEMBRE: 12,
  DECEMBER: 12,
};

/** Normaliza la precisión publicada: un mes/año nunca se convierte en un día inventado. */
export function normalizarVencimiento(
  valor: string,
  orden: 'DMY' | 'MDY' | 'YMD' = 'DMY'
): string | null {
  const s = valor.trim().toUpperCase();
  const year = (v: string) => (v.length === 2 ? 2000 + Number(v) : Number(v));
  const iso = (y: number, m: number, d?: number): string | null => {
    if (!Number.isInteger(y) || y < 1900 || y > 9999 || !Number.isInteger(m) || m < 1 || m > 12)
      return null;
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    if (d === undefined) return ym;
    const value = `${ym}-${String(d).padStart(2, '0')}`;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
      ? value
      : null;
  };
  let m = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/);
  if (m) return iso(Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : undefined);
  m = s.match(/^(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) return iso(year(m[2]), Number(m[1]));
  m = s.match(/^(\d{1,2})[-/ ]([A-Z]+)\.?[-/ ](\d{2}|\d{4})$/);
  if (m) return iso(year(m[3]), meses[m[2]], Number(m[1]));
  m = s.match(/^([A-Z]+)\.?\s+(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) return iso(year(m[3]), meses[m[1]], Number(m[2]));
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (m)
    return orden === 'YMD'
      ? iso(year(m[1]), Number(m[2]), Number(m[3]))
      : orden === 'MDY'
      ? iso(year(m[3]), Number(m[1]), Number(m[2]))
      : iso(year(m[3]), Number(m[2]), Number(m[1]));
  if (/^\d{8}$/.test(s))
    return orden === 'YMD'
      ? iso(Number(s.slice(0, 4)), Number(s.slice(4, 6)), Number(s.slice(6, 8)))
      : orden === 'MDY'
        ? iso(Number(s.slice(4)), Number(s.slice(0, 2)), Number(s.slice(2, 4)))
        : iso(Number(s.slice(4)), Number(s.slice(2, 4)), Number(s.slice(0, 2)));
  return null;
}

/** Deduplica pares, conservando fechas contradictorias para su revisión. */
export function normalizarLotesDocumento(lotes: LoteDocumento[]): LoteDocumento[] {
  const encontrados = new Set<string>();
  const resultado: LoteDocumento[] = [];
  for (const item of lotes) {
    const lote = normalizarLotes([item.lote])[0];
    if (!lote || lote.length > 120) continue;
    const vencimiento = item.vencimiento ? normalizarVencimiento(item.vencimiento) : null;
    const key = JSON.stringify([lote, vencimiento]);
    if (!encontrados.has(key)) {
      encontrados.add(key);
      resultado.push({ lote, vencimiento });
    }
  }
  return resultado;
}

/** Compatibilidad con documentos guardados antes de extraer fechas por lote. */
export function lotesDocumentoDe(r: {
  lotesDocumento?: LoteDocumento[];
  lotesDeclarados?: string[];
}): LoteDocumento[] {
  return normalizarLotesDocumento(
    r.lotesDocumento ?? (r.lotesDeclarados || []).map(lote => ({ lote, vencimiento: null }))
  );
}

/** Fechas del lote por columnas verificadas, nunca el vencimiento de la factura o del RS. */
export function extraerLotesDocumentoPdf(
  formato: string,
  texto: string,
  lotes: string[] = extraerLotesPdf(formato, texto)
): LoteDocumento[] {
  const pares: LoteDocumento[] = [];
  const buscar = (regex: RegExp, lote = 1, fecha = 2, orden: 'DMY' | 'MDY' | 'YMD' = 'DMY') => {
    for (const m of texto.matchAll(regex))
      pares.push({ lote: m[lote], vencimiento: normalizarVencimiento(m[fecha], orden) });
  };
  switch (formato) {
    case 'FARMALOGICA':
      buscar(/^\d[\d.]*\t([A-Z0-9][A-Z0-9._/-]*)\s*\/\s*(\d{2}-[a-z]+\.?-\d{4})\t/gim);
      break;
    case 'ALFA_TRADING': {
      // La fecha precede al registro y al precio; un renglón tiene su propio lote.
      const fechas = [...texto.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)];
      const codigos = extraerLotesPdf(formato, texto);
      if (fechas.length === 1 && codigos.length === 1)
        pares.push({ lote: codigos[0], vencimiento: normalizarVencimiento(fechas[0][1]) });
      break;
    }
    case 'MEDTRONIC':
      buscar(
        /^\d[\d.]*\t([^\s]+)\s+[\d.,]+\s+\d+(?:[.,]\d+)?%\t[^\n]*\n\d+\s*\n\d+\s+(\d{2}\/\d{2}\/\d{4})\s+\d+/gm
      );
      break;
    case 'BAXTER':
    case 'VANTIVE':
      // La cabecera publica expresamente «FECHA EXPIRA AA/MM/DD».
      buscar(/\t(\d{2}-\d{2}-\d{2})\t([^\s]+)\t/g, 2, 1, 'YMD');
      break;
    case 'LM_INSTRUMENTS':
      buscar(/^([A-Z0-9][A-Z0-9._/-]*)\s*\n(\d{2}\/\d{2}\/\d{4})(?:\s|$)/gm);
      break;
    case 'DELTA':
      buscar(/\t([^\s]+)[ \t]+(\d{2}-\d{2}-\d{4})[ \t]+\$/g);
      break;
    case 'GRUPO_AFIN':
      buscar(/\t(\d{2}\/\d{2}\/\d{4})\t([^\s]+)\s+\$/g, 2, 1);
      break;
    case 'CRUZ_VERDE':
      buscar(/\bCANTIDAD\s+[\d.,]+\s*\/\s*([^\s/]+)\s*\/\s*(\d{2}-\d{2}-\d{4})/gi);
      break;
    case 'SICMAFARMA':
      buscar(/^\S+[ \t]+CJ[^\t\n]*\t\s*(\d{2}-\d{2}-\d{4})\t([^\t\r\n]+)/gim, 2, 1);
      break;
    case 'XINETIX':
      buscar(/^([A-Z0-9][A-Z0-9._/-]*)\s+-\s+(\d{4}-\d{2}-\d{2})\s+-\s+[\d.,]+/gim);
      break;
    case 'VITALIS':
      buscar(/^([A-Z0-9][A-Z0-9._/-]*)\s*\nVence:\s*\n(\d{2}\.\d{2}\.\d{4})/gim);
      break;
    case 'LIFE':
      buscar(/LOTE:\s*VENCE:\s*(?:CANT:\s*)?CUM:\s*([^\s]+)\s+[\d,.]+\s+(\d{2}\/\d{2}\/\d{4})/gi);
      break;
    case 'B_BRAUN':
      buscar(/Lote:\s*No\.:\s*Vence:\s*([^\s]+)\s+(\d{8})/gi);
      break;
    case 'OFFIMEDICAS':
      buscar(/\bLote\s+([^\s]+)\s+Vence\s+(\d{2}\/\d{2}(?:\d{2})?)(?![\d/])/gi);
      break;
    case 'EVEDISA':
      buscar(/\bLOTE:\s*([^\s]+)\s+FECHA\s+VENC:\s*(\d{8})/gi, 1, 2, 'YMD');
      break;
    case 'SEVEN_PHARMA':
      buscar(/\bLote:\s*([^\s]+)\s+Fecha\s+Vencimiento:\s*(\d{2}\/\d{2}\/\d{4})/gi);
      break;
    case 'SURGICON':
      buscar(/\bLOTE:\s*([^\s]+)\s+VENCE:\s*([A-Z]+\.?\s+\d{1,2}\/\d{2,4})/gi);
      break;
    case 'VYGON':
      buscar(/\bLote\s+No\.\s*:\s*([^\s]+)\s+Vencimiento:\s*(?:Und\s+)?(\d{2}\/\d{2}\/\d{4})/gi);
      break;
    case 'CAFAM':
      break; // El formato conocido no publica lotes ni fechas de producto.
  }
  // Mantener lotes sin fecha y los recibidos por extractores más recientes.
  for (const lote of normalizarLotes(lotes))
    if (!pares.some(p => p.lote.trim() === lote)) pares.push({ lote, vencimiento: null });
  return normalizarLotesDocumento(pares);
}
