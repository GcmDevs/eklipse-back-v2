import { advertenciasRenglon, LoteDocumento, PaginaTexto, RenglonExtraido } from './factura.models';
import { cantidadRenglonPdf } from './proveedores-pdf.extractor';
import {
  normalizarLotes,
  normalizarLotesDocumento,
  normalizarVencimiento,
} from './lotes-documento';

export const PERFILES_PDF_202611 = [
  {
    id: 'SHERLEG',
    match: /SHERLEG LABORATORIES/,
    proveedor: 'Sherleg Laboratories S.A.S.',
    nit: '900539662',
  },
  {
    id: 'LINEAS_HOSPITALARIAS',
    match: /(?:LH S\.A\.S\.|LINEAS HOSPITALARIAS|PBX:\s*6972333[\s\S]*?\bCS\s+\d+)/,
    proveedor: 'LH S.A.S. · Líneas Hospitalarias',
    nit: '900294380',
  },
  {
    id: 'MAS_SALUD',
    match: /MASSALUDIPSLTDA|MAS SALUD I\.P\.S/,
    proveedor: 'Más Salud I.P.S. Ltda.',
    nit: '802021040',
  },
  {
    id: 'NESTLE',
    match: /NESTLE DE COLOMBIA/,
    proveedor: 'Nestlé de Colombia S.A.',
    nit: '860002130',
  },
  {
    id: 'LIVANOVA',
    match: /LIVANOVA COLOMBIA/,
    proveedor: 'LivaNova Colombia S.A.S.',
    nit: '900839128',
  },
  {
    id: 'ROPSOHN',
    match: /ROPSOHN THERAPEUTICS/,
    proveedor: 'Ropsohn Therapeutics S.A.S.',
    nit: '860029022',
  },
  {
    id: 'AMAREY',
    match: /AMAREY NOVA MEDICAL/,
    proveedor: 'Amarey Nova Medical S.A.',
    nit: '800250382',
  },
  { id: 'BIOSPIFAR', match: /BIOSPIFAR/, proveedor: 'Biospifar S.A.', nit: '830510758' },
  {
    id: 'BLAU',
    match: /BLAU FARMACEUTICA COLOMBIA/,
    proveedor: 'Blau Farmacéutica Colombia S.A.S.',
    nit: '830072817',
  },
  {
    id: 'RYAN',
    match: /LABORATORIOS RYAN DE COLOMBIA/,
    proveedor: 'Laboratorios Ryan de Colombia S.A.S.',
    nit: '860029237',
  },
  {
    id: 'FRESENIUS_KABI',
    match: /FRESENIUS KABI COLOMBIA/,
    proveedor: 'Fresenius Kabi Colombia S.A.S.',
    nit: '900402080',
  },
  {
    id: 'GE_HEALTHCARE',
    match: /GE HEALTHCARE COLOMBIA/,
    proveedor: 'GE Healthcare Colombia S.A.S.',
    nit: '900757947',
  },
  {
    id: 'INTERSURGICAL',
    match: /INTERSURGICAL S\.A\.S/,
    proveedor: 'Intersurgical S.A.S.',
    nit: '900169174',
  },
  {
    id: 'CARDIOMED',
    match: /INDUSTRIAS CARDIOMED/,
    proveedor: 'Industrias Cardiomed S.A.S.',
    nit: '800119669',
  },
  { id: 'BSN_MEDICAL', match: /BSN MEDICAL/, proveedor: 'BSN Medical Ltda.', nit: '805019723' },
  {
    id: 'ARROW_MEDICAL',
    match: /ARROW MEDICAL/,
    proveedor: 'Arrow Medical S.A.S.',
    nit: '811001723',
  },
  {
    id: 'FCV',
    match: /FUNDACION CARDIOVASCULAR DE COLOMBIA/,
    proveedor: 'Fundación Cardiovascular de Colombia',
    nit: '890212568',
  },
  {
    id: 'BECTON_DICKINSON',
    match: /BECTON DICKINSON COLOMBIA/,
    proveedor: 'Becton Dickinson Colombia Ltda.',
    nit: '860020309',
  },
  { id: 'RP_MEDICAS', match: /RP MEDICAS S\.A/, proveedor: 'RP Médicas S.A.', nit: '811019499' },
  { id: 'IMCOLMEDICA', match: /IMCOLMEDICA/, proveedor: 'Imcolmédica S.A.', nit: '860070078' },
];
type Crear = (b: string, d: string, c: string, pagina: number, formato: string) => RenglonExtraido;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
function bloques(t: string, re: RegExp) {
  const ms = [...t.matchAll(re)];
  return ms.map((m, i) => ({ m, b: t.slice(m.index!, ms[i + 1]?.index ?? t.length) }));
}
function iso(y: string, m: string, d: string) {
  const s = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s ? s : null;
}
/** Only product-table positions are eligible; payment and sanitary-register dates are excluded. */
function lotesConVencimiento(formato: string, fragmento: string, lotes: string[]): LoteDocumento[] {
  const pares: LoteDocumento[] = [];
  const buscar = (re: RegExp, orden: 'DMY' | 'MDY' | 'YMD' = 'DMY', inverso = false) => {
    for (const m of fragmento.matchAll(re)) {
      const lote = m[inverso ? 2 : 1];
      if (lotes.includes(lote))
        pares.push({ lote, vencimiento: normalizarVencimiento(m[inverso ? 1 : 2], orden) });
    }
  };
  switch (formato) {
    case 'SHERLEG':
      buscar(/^(\S+)\s*\t\s*\d{4}DM\S+\s*\t\s*F\.V\s*:\s*(\d{4}-\d{2}-\d{2})/gm, 'YMD');
      break;
    case 'MAS_SALUD':
      buscar(/\b(\S+)[ \t]+(\d{8})[ \t]+[\d.,]+[ \t]+[\d.,]+[ \t]*$/gm, 'YMD');
      break;
    case 'LIVANOVA':
      buscar(/No Lote\s*:\s*(\S+)\s+Fecha Exp\s*:\s*(\d{2}-\d{2}-\d{4})/gi);
      break;
    case 'ROPSOHN':
      buscar(/\t\d+\s+(\S+)\s+(\d{2}\/\d{2}\/\d{4})\s+[\d.,]+\t/g);
      break;
    case 'AMAREY':
      buscar(/^(\S+)\s+(\d{4}-\d{2}-\d{2})\s+\d+\s*$/gm, 'YMD');
      break;
    case 'BIOSPIFAR':
      buscar(/Lote:\s*(\S+)\s+Vcto:\s*(\d{2}\/\d{2}\/\d{4})/gi, 'MDY');
      break;
    case 'BLAU':
      buscar(/\s(\S+)\s+(\d{2}\/\d{4})\s+[\d.,]+\s+[\d.,]+/g);
      break;
    case 'RYAN':
      buscar(/Lote:\s*(\S+)\s+Fecha Venc\.:\s*(\d{2}\/\d{2}\/\d{4})/gi);
      break;
    case 'FRESENIUS_KABI':
      buscar(/(?:^|\s)(\S+)\s+(\d{4}\.\d{2}\.\d{2})\s+[\d,]+\s+\w+\t/gm, 'YMD');
      break;
    case 'GE_HEALTHCARE':
      buscar(/\t\S+\s+(\S+)\s+(\d{2}\/\d{2}\/\d{4})/g);
      break;
    case 'CARDIOMED':
      buscar(/Lote Venc\. CANT\.\s+(\S+)\s+(\d{2}\/\d{2}\/\d{4})/g);
      break;
    case 'BSN_MEDICAL':
      buscar(/Lote:\s*(\S+)\s+F\. Vto\s+(\d{2}\.\d{2}\.\d{4})/g);
      break;
    case 'ARROW_MEDICAL':
      buscar(/F\.Vence:\s*(\d{2}-\d{2}-\d{4})\s+Lt:\s*(\S+)/g, 'DMY', true);
      break;
    case 'FCV':
      buscar(/\s(\d{1,2}-[a-z]{3}-\d{4})\s+(\S+)\s+[\d.,]+\s+[\d.,]+/gi, 'DMY', true);
      break;
    case 'BECTON_DICKINSON':
      buscar(/Venc:\s*(\d{4}-\d{2}-\d{2})\s*\n([^\s]+)\t\S+\s*\t\w+\s*\t/g, 'YMD', true);
      break;
    case 'RP_MEDICAS':
      // The later “F Vto” belongs to INVIMA, not to the lot.
      buscar(/^(\S+)\s+(\d{2}\/\d{2}\/\d{4})\s+Invima\b/gm);
      break;
    // LH, Nestlé, Intersurgical and Imcolmédica do not publish product expiry in the samples.
  }
  return normalizarLotesDocumento([
    ...pares,
    ...lotes
      .filter(lote => !pares.some(p => p.lote === lote))
      .map(lote => ({ lote, vencimiento: null })),
  ]);
}
export function extraerProveedor202611(formato: string, pages: PaginaTexto[], crear: Crear) {
  if (!PERFILES_PDF_202611.some(p => p.id === formato)) return null;
  const text = pages.map(p => p.text).join('\n');
  const numeros: Record<string, RegExp> = {
    SHERLEG: /\n(\d+)\n20\d{2}-\d{2}-\d{2}\nFecha y Hora de Factura/,
    LINEAS_HOSPITALARIAS: /\b(CS\s+\d+)/,
    MAS_SALUD: /\n(\d+)\nPagina\s*:/,
    NESTLE: /FACTURA ELECTR[ÓO]NICA DE VENTA:\s*(NL\d+-\d+)/,
    LIVANOVA: /(FE\d+)\s*FACTURA ELECTRONICA/,
    ROPSOHN: /\b(FE\s*-\s*\d+)/,
    AMAREY: /\b(AFE\d+)/,
    BIOSPIFAR: /^(FEM\s*-\s*\d+)\s*$/m,
    BLAU: /\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}\s+(BFC\s+\d+)/,
    RYAN: /\b(FR-\d+)/,
    FRESENIUS_KABI: /\b(FV\d+)/,
    GE_HEALTHCARE: /VENTA No\.\s*(\d+)/,
    INTERSURGICAL: /\b(FE\s+\d+)/,
    CARDIOMED: /\n(\d+)\nVALLEDUPAR/,
    BSN_MEDICAL: /\b(FE\d+)/,
    ARROW_MEDICAL: /DE VENTA\s+(EFA\s+\d+)/,
    FCV: /FACTURA DE VENTA\s+(PHN\s+\d+)/,
    BECTON_DICKINSON: /\b(FEBD\d+)/,
    RP_MEDICAS: /No\.(FEM\d\s+\d+)/,
    IMCOLMEDICA: /No\.\s*(FVT\d+)/,
  };
  let numero = text.match(numeros[formato])?.[1].replace(/\s+/g, ' ').trim() || '';
  if (formato === 'CARDIOMED' && numero) numero = 'FEP ' + numero;
  let fecha: string | null = null;
  const dates: Partial<Record<string, RegExp>> = {
    SHERLEG: /Expedición\s+(20\d{2})-(\d{2})-(\d{2})/,
    AMAREY: /\b(20\d{2})-(\d{2})-(\d{2})\s+\d{2}:\d{2}:\d{2}-05/,
    LIVANOVA: /(20\d{2})-(\d{2})-(\d{2})\s+FECHA Y HORA DE EMISION/,
    MAS_SALUD: /F\.Factura\s+(\d{2})\/(\d{2})\/(20\d{2})/,
    RYAN: /Fecha de Emisión:\s*(\d{2})\/(\d{2})\/(20\d{2})/,
    GE_HEALTHCARE: /FECHA GENERACI[ÓO]N:\s*(\d{2})\/(\d{2})\/(20\d{2})/,
    BIOSPIFAR: /Fecha de expedición:\s*(\d{2})\/(\d{2})\/(20\d{2})/,
    RP_MEDICAS: /(\d{2})\/(\d{2})\/(20\d{2})\s+\d{2}:\d{2}:\d{2}/,
    FRESENIUS_KABI: /(\d{2})\/(\d{2})\/(20\d{2})\s+\d{2}:\d{2}:\d{2}/,
    LINEAS_HOSPITALARIAS: /(\d{2})\/(\d{2})\/(20\d{2})\s+\d{1,2}:\d{2}\s+[AP]M/,
    ROPSOHN: /(\d{2})\/(\d{2})\/(20\d{2})\s+\d{2}\/\d{2}\/20\d{2}/,
    BLAU: /(\d{2})\/(\d{2})\/(20\d{2})\s+\d{2}\/\d{2}\/20\d{2}\s+BFC/,
    BECTON_DICKINSON: /(\d{2})\/(\d{2})\/(20\d{2})\s+\d{2}\/\d{2}\/20\d{2}/,
    NESTLE: /(\d{2})\/(\d{2})\/(20\d{2})/,
    INTERSURGICAL: /(\d{1,2})\s+(\d{1,2})\s+(20\d{2})\s+\d{1,2}\s+\d{1,2}\s+20\d{2}/,
    BSN_MEDICAL: /Año\/Year\s+(\d{1,2})\s+(\d{1,2})\s+(20\d{2})/,
    IMCOLMEDICA: /Fecha de Emisión:\s*(\d{2})-(\d{2})-(20\d{2})/,
  };
  const dm = dates[formato] && text.match(dates[formato]!);
  if (dm)
    fecha = ['SHERLEG', 'AMAREY', 'LIVANOVA'].includes(formato)
      ? iso(dm[1], dm[2], dm[3])
      : iso(dm[3], dm[2], dm[1]);
  if (formato === 'ARROW_MEDICAL') {
    const m = text.match(/Fecha Validación DIAN:\s*(20\d{2})-(\d{2})-(\d{2})/);
    if (m) fecha = iso(m[1], m[2], m[3]);
  }
  if (formato === 'CARDIOMED') {
    // The footer prints month/day; the invoice table interleaves the two date columns.
    const m = text.match(
      /\b(\d{1,2})\s+(20\d{2})\s+D M A\s+20\d{2}\s+\d+\s+\d+\s+(\d{1,2})\s*\nDIA MES AÑO/
    );
    if (m) fecha = iso(m[2], m[1], m[3]);
  }
  if (formato === 'FCV') {
    const months = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    const m = text.match(/\b(\d{1,2})-([a-z]{3})-(20\d{2})/i);
    if (m) fecha = iso(m[3], String(months.indexOf(m[2].toLowerCase()) + 1), m[1]);
  }
  const renglones: RenglonExtraido[] = [];
  const advertencias: string[] = [];
  const add = (
    b: string,
    d: string,
    c: string,
    p: number,
    q: string | undefined,
    locale: 'es' | 'en' = 'en',
    lots: string[] = [],
    unit?: string,
    reg?: string
  ) => {
    const r = cantidadRenglonPdf(crear(b, clean(d), c, p, formato), q, locale, unit);
    const base = new Set(advertenciasRenglon(r));
    r.advertencias = r.advertencias.filter(a => !base.has(a));
    r.lotesDeclarados = normalizarLotes(lots);
    r.lotesDocumento = lotesConVencimiento(formato, b, r.lotesDeclarados);
    if (reg !== undefined) r.registroSanitario = reg;
    if (!c && r.registroSanitario.match(/^\d{4}(DM|RD)/)) r.tipo = 'DISPOSITIVO';
    if (
      [
        'SHERLEG',
        'LINEAS_HOSPITALARIAS',
        'LIVANOVA',
        'INTERSURGICAL',
        'CARDIOMED',
        'BSN_MEDICAL',
        'ARROW_MEDICAL',
        'FCV',
        'BECTON_DICKINSON',
        'RP_MEDICAS',
        'IMCOLMEDICA',
      ].includes(formato) &&
      r.tipo === 'SIN_CLASIFICAR'
    )
      r.tipo = 'DISPOSITIVO';
    if (formato === 'NESTLE') r.tipo = 'ALIMENTOS';
    renglones.push(r);
    return r;
  };
  for (const page of pages) {
    let t = page.text;
    switch (formato) {
      case 'SHERLEG':
        t = t.split(/FACTURA ELECTRONICA DE\s*\nVENTA\s*\n/).at(-1)!;
        for (const { m, b } of bloques(
          t,
          /^(\d+)\s*\t\s*(\d+)\s*\t\s*(.+?)\s*\t\s*(\w+)\s*\t\s*([\d,.]+)\s*\t/gm
        )) {
          const frag = b.split(/\n(?:SUBTOTAL|VALOR EN LETRAS|OBSERVACIONES)/)[0];
          const lots = [...frag.matchAll(/^(\S+)\s*\t\s*\d{4}DM\S+\s*\t\s*F\.V\s*:/gm)].map(
            x => x[1]
          );
          const regs = [...new Set([...frag.matchAll(/\b\d{4}DM\d+(?:R\d+)?/g)].map(x => x[0]))];
          const r = add(
            frag,
            m[3],
            '',
            page.num,
            m[5],
            'en',
            lots,
            m[4],
            regs.length === 1 ? regs[0] : ''
          );
          if (regs.length > 1)
            r.advertencias.push('Varios registros declarados por lote: revise la coincidencia.');
        }
        break;
      case 'LINEAS_HOSPITALARIAS':
        t = t.split(/\nDE \d+\tPAG/)[0];
        for (const { m, b } of bloques(
          t,
          /\$\s*[\d,]+\t(\d+)\s+\$\s*[\d,]+\t([A-Z0-9]+)\s+(\S+)\s+\d+%\s+\$\s*[\d,]+\t/g
        ))
          add(
            b,
            b.slice(m[0].length).split(/\s*-\s*INVIMA/)[0],
            '',
            page.num,
            m[1],
            'en',
            [m[3]],
            'UNIDAD'
          );
        break;
      case 'MAS_SALUD': {
        t = t
          .split(/CUM\s*\tDESCRIPCION[^\n]*\n/)
          .at(-1)!
          .split(/\nSUBTOTAL/)[0];
        let cursor = 0;
        for (const m of t.matchAll(
          /^([^\n]+?)[ \t]+(?:(\d{4}(?:DM|M|RD)\S+)[ \t]+)?(?:(?:19|0)[ \t]+)?([\d.,]+)[ \t]+(\S+)[ \t]+(\d{8})[ \t]+[\d.,]+[ \t]+[\d.,]+[ \t]*$/gm
        )) {
          const cols = m[1].split(/\t/);
          const d =
            t.slice(cursor, m.index).trim() +
            (cols.length > 1 ? ' ' + cols.slice(0, -1).join(' ') : '');
          add(
            t.slice(cursor, m.index! + m[0].length),
            d,
            '',
            page.num,
            m[3],
            'es',
            [m[4]],
            undefined,
            m[2] || ''
          );
          cursor = m.index! + m[0].length;
        }
        break;
      }
      case 'NESTLE':
        for (const line of t.split('\n')) {
          const m = line.match(/^0,00\t0\t[\d.,]+\t(.+?)\t\d+\s+[\d.,]+\t(UN|CA)\t(\d+)\b/);
          if (m) add(line, m[1], '', page.num, m[3], 'es', [], m[2]);
        }
        break;
      case 'LIVANOVA':
        t = t.split(/\nSubtotal/)[0];
        for (const { m, b } of bloques(t, /^(\d+)\s*\t\s*(\S+)\s+([^\n]+)/gm)) {
          const tail = b.match(
            /No Lote\s*:\s*(\S+)\s+Fecha Exp\s*:\s*\d{2}-\d{2}-\d{4}\s*\t\s*(\d+)\s*\t\s*(\w+)/i
          );
          if (tail) add(b, m[3], '', page.num, tail[2], 'en', [tail[1]], tail[3]);
        }
        break;
      case 'ROPSOHN':
        t = t.split(/\nOBSERVACIONES:/)[0];
        for (const { b } of bloques(t, /^\d{9}\s+(?=[A-Z])/gm)) {
          const m = b.match(
            /([\d.,]+)\t(\d{1,12}-\d{1,8})\s+(\w+)\t\d+\s+(\S+)\s+\d{2}\/\d{2}\/\d{4}\s+[\d.,]+\t([\d.,]+)\t\d+/
          );
          if (m)
            add(
              b,
              b.slice(0, m.index).replace(/^\d+\s+/, ''),
              m[2],
              page.num,
              m[5],
              'es',
              [m[4]],
              m[3]
            );
        }
        break;
      case 'AMAREY':
        t = t.split(/\nSubtotal/)[0];
        for (const { m, b } of bloques(t, /^(\d+)\s+(\d+)\s*\t[\d,.]+\s+[\d,.]+\t/gm)) {
          const tail = b.match(/^(\S+)\s+(\d{4}-\d{2}-\d{2})\s+(\d+)\s*$/m);
          if (tail) {
            const code = b.match(/INVIMA[^\n]*?,\s*(\d{1,12}-\d{1,8}),/)?.[1] || '';
            add(b, b.slice(m[0].length).split(/\nINVIMA/)[0], code, page.num, tail[3], 'en', [
              tail[1],
            ]);
          }
        }
        break;
      case 'BIOSPIFAR':
        for (const { m, b } of bloques(
          t,
          /^(\d{1,12}-\d{1,8})\s+[A-Z]\d[A-Z0-9]+\s+(.+?)\s+\d+\s*%\s+([\d,]+)\s+[\d,.]+\s+[\d,.]+\s*$/gm
        )) {
          const lot = b.match(/Lote:\s*(\S+)/i);
          add(
            b.split(/\n(?:SEIS|Son:|POL[IÍ]TICA)/)[0],
            m[2],
            m[1],
            page.num,
            m[3],
            'en',
            lot ? [lot[1]] : []
          );
        }
        break;
      case 'BLAU':
        for (const m of t.matchAll(
          /^(\d+)\s+([\s\S]*?)\s+(\d{1,12}-\d{1,8}|\d[A-Z]\d+)\s+[A-Z]\d[A-Z0-9]+\s+(\S+)\s+(\S+)\s+\d{2}\/\d{4}\s+[\d.,]+\s+[\d.,]+/gm
        )) {
          const cum = /^\d+-\d+$/.test(m[3]) ? m[3] : '';
          const r = add(m[0], m[2], cum, page.num, m[1], 'es', [m[5]], undefined, m[4]);
          if (!cum) r.advertencias.push(`IUM declarado (no CUM): ${m[3]}`);
          if (/\bMVND\b/.test(m[2])) {
            r.tipo = 'VITAL_NO_DISPONIBLE';
            r.registroSanitario = '';
            r.advertencias.push(`Resolución declarada: ${m[4]}`);
          }
        }
        break;
      case 'RYAN':
        t = t.split(/\nObservaciones:/)[0];
        for (const { m, b } of bloques(t, /^([\d.]+,\d{2})\s+[\d.,]+\t[\d.,]+\t/gm)) {
          const cum = b.match(/^(\d{1,12}-\d{1,8})\t/m)?.[1] || '';
          add(b, b.slice(m[0].length).split(/\nATC:/)[0], cum, page.num, m[1], 'es', [
            b.match(/Lote:\s*(\S+)/)?.[1] || '',
          ]);
        }
        break;
      case 'FRESENIUS_KABI':
        for (const m of t.matchAll(
          /^(?:(\d{10})\s+)?(\S+)\s+\d{4}\.\d{2}\.\d{2}\s+([\d,]+)\s+(\w+)\t(.+?)\t\S+\t\d+\s+[\d.]+\t[\d,]+\s+[\d,]+/gm
        )) {
          const r = add(m[0], m[5], m[1] || '', page.num, m[3], 'en', [m[2]], m[4]);
          r.tipo = m[1] ? 'MEDICAMENTO' : 'SIN_CLASIFICAR';
          if (m[1])
            r.advertencias.push(
              'CUM declarado sin separador: revise expediente y consecutivo antes de verificar.'
            );
        }
        break;
      case 'GE_HEALTHCARE':
        for (const m of t.matchAll(
          /^(\d+)\s+[\d.,]+\t[\d.,]+\t(\w+)\t\d+\.\s+(.+?)\t\S+\s+(\S+)\s+\d{2}\/\d{2}\/\d{4}/gm
        )) {
          const code = m[3].match(/\bCUM\s*(\d+-\d+)/)?.[1] || '';
          const r = add(
            m[0],
            m[3].replace(/\s*\/\s*CUM.*$/, ''),
            code,
            page.num,
            m[1],
            'es',
            [m[4]],
            m[2]
          );
          r.tipo = 'MEDICAMENTO';
        }
        break;
      case 'INTERSURGICAL':
        t = t.split(/\nTotal Lineas/)[0];
        for (const { m, b } of bloques(
          t,
          /^[\d.,]+\t[\d.,]+\t\$\t(\d+)\t\d+\s+\$\t\S+\s+[\d.,]+%\t(\w+)\t\d+\s+/gm
        ))
          add(
            b,
            b.slice(m[0].length).split(/\nREGISTRO INVIMA/)[0],
            '',
            page.num,
            m[1],
            'es',
            [],
            m[2]
          );
        break;
      case 'CARDIOMED':
        t = t.split(/\nImpreso por|\nSUBTOTAL/)[0];
        for (const { b } of bloques(t, /^\d+\s+\$\tCMD\d+\t/gm)) {
          const m = b.match(/^([\d.]+)\s+Unidad\s+\$\s*[\d.,]+\t\S+\s+([^\n]+)/m);
          const lot = b.match(/Lote Venc\. CANT\.\s+(\S+)\s+\d{2}\/\d{2}\/\d{4}/);
          if (m) add(b, m[2], '', page.num, m[1], 'es', lot ? [lot[1]] : [], 'Unidad');
        }
        break;
      case 'BSN_MEDICAL':
        t = t.split(/\nPag\./)[0];
        for (const { m, b } of bloques(t, /^\d{6}\s+\d+\s+([^\n]+)/gm)) {
          const q = b.match(/^(\d+)\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+\s*$/m)?.[1];
          const lots = [...b.matchAll(/Lote:\s*(\S+)/g)].map(x => x[1]);
          add(
            b,
            m[1] + (b.slice(m[0].length).split(/\nLote:/)[0] || ''),
            '',
            page.num,
            q,
            'es',
            lots,
            b.match(/F\. Vto\s+\d{2}\.\d{2}\.\d{4}\s+\d+\s+(\w+)/)?.[1]
          );
        }
        break;
      case 'ARROW_MEDICAL':
        for (const { m, b } of bloques(t, /^(.+?)\t\S+\s+[\d,]+\t[\d,]+\t(\d+)\s+\d+%\s*$/gm)) {
          if (!b.includes('F.Vence:')) continue;
          add(b.split(/\nFavor enviar/)[0], m[1], '', page.num, m[2], 'en', [
            b.match(/\bLt:\s*(\S+)/)?.[1] || '',
          ]);
        }
        break;
      case 'FCV':
        for (const m of t.matchAll(
          /^\d+\.\d+\s+(.+?)\s+\d{1,2}-[a-z]{3}-\d{4}\s+(\S+)\s+([\d.,]+)\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+/gim
        )) {
          const r = add(m[0], m[1], '', page.num, m[3], 'es', [m[2]]);
          r.advertencias.push(
            'Hay un registro en observaciones generales; confirme su aplicación a este producto.'
          );
        }
        break;
      case 'BECTON_DICKINSON':
        t = t.split(/\nSON:/)[0];
        for (const { m, b } of bloques(t, /^\d+\s*\t([\d.,]+)\s*\t[\d.,]+\s*\t[\d.,]+\t/gm)) {
          const lot = b
            .match(/^([^\s]+)\t\S+\s*\t(\w+)\s*\t/gm)
            ?.at(0)
            ?.split('\t')[0];
          add(
            b,
            b.slice(m[0].length).split(/\s*Venc:/)[0],
            '',
            page.num,
            m[1],
            'es',
            lot ? [lot] : [],
            'EA'
          );
        }
        break;
      case 'RP_MEDICAS':
        t = t.split(/\nObservaciones:/)[0];
        for (const { m, b } of bloques(
          t,
          /^(?:19\s+)?[\d,]+\.\d{2}\t[\d,]+\.\d{2}\t([\d,]+\.\d{2})\s*$/gm
        )) {
          const lines = b.slice(m[0].length).trim().split('\n');
          if (lines.length >= 2 && /Invima/.test(lines[0]))
            add(
              b,
              lines
                .slice(1)
                .join(' ')
                .replace(/^\S+\s+/, ''),
              '',
              page.num,
              m[1],
              'en',
              [lines[0].split(' ')[0]]
            );
        }
        break;
      case 'IMCOLMEDICA':
        t = t
          .split(/Total Impuesto Total\n/)
          .at(-1)!
          .split(/\nLos códigos/)[0];
        for (const m of t.matchAll(
          /^\S+\s+([\s\S]*?)\s+([\d,]+\.\d{2})\s+(\d+)\s+[\d,.]+\s+[\d,.]+\s+IVA\s+[\d.]+%\s+\S+\s+[\d,.]+\s+[\d,.]+/gm
        )) {
          if (!/^FLETES?$/i.test(clean(m[1]))) add(m[0], m[1], '', page.num, m[2], 'en', [], m[3]);
          else advertencias.push('Se omitió un cargo de flete que no corresponde a un producto.');
        }
        break;
    }
  }
  for (const r of renglones)
    r.advertencias = [
      ...advertenciasRenglon(r).filter(
        a => r.tipo !== 'VITAL_NO_DISPONIBLE' || !a.includes('registro sanitario')
      ),
      ...r.advertencias,
    ];
  const conteos: Partial<Record<string, RegExp>> = {
    SHERLEG: /Total Items\s+(\d+)/i,
    LINEAS_HOSPITALARIAS: /Total [ií]tems:\s*(\d+)/i,
    NESTLE: /^(\d+)\s+Total líneas:/im,
    FRESENIUS_KABI: /Total Nro L[ií]neas:\s*(\d+)/i,
    GE_HEALTHCARE: /TOTAL NRO LINEAS:\s*(\d+)/i,
    INTERSURGICAL: /Total Lineas\s+(\d+)/i,
  };
  const declarado = conteos[formato] && text.match(conteos[formato]!)?.[1];
  if (declarado && Number(declarado) !== renglones.length)
    advertencias.push(
      `El documento declara ${declarado} renglones y se extrajeron ${renglones.length}. Revise y complete los faltantes manualmente.`
    );
  return { numero, fecha, renglones, advertencias };
}
