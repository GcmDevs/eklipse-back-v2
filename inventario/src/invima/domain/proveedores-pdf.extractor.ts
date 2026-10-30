import { PaginaTexto, RenglonExtraido } from './factura.models';

export const PERFILES_PDF_ADICIONALES = [
  {
    id: 'SEVEN_PHARMA',
    match: /SEVEN\s+PHARMA\s+COLOMBIA/,
    proveedor: 'Seven Pharma Colombia S.A.S.',
    nit: '900569874',
  },
  {
    id: 'GRUPO_AFIN',
    match: /GRUPO\s+AFIN\s+FARMACEUTICA/,
    proveedor: 'Grupo Afín Farmacéutica S.A.S. BIC',
    nit: '900047874',
  },
  {
    id: 'VITALIS',
    match: /VITALIS\s+S\.?\s*A\.?\s*C\.?\s*I\b/,
    proveedor: 'Vitalis S.A.C.I.',
    nit: '830068119',
  },
  { id: 'FARMALOGICA', match: /\bFARMALOGICA\b/, proveedor: 'Farmalógica S.A.', nit: '830057982' },
  {
    id: 'ALFA_TRADING',
    match: /ALFATRADING\.COM|ALFA\s+TRADING/,
    proveedor: 'Alfa Trading S.A.S.',
    nit: '830041488',
  },
  {
    id: 'MEDTRONIC',
    match: /MEDTRONIC\s+COLOMBIA/,
    proveedor: 'Medtronic Colombia S.A.',
    nit: '830025149',
  },
  {
    id: 'SURGICON',
    match: /SURGICON\s*&\s*CIA/,
    proveedor: 'Surgicon & Cía. S.A.S.',
    nit: '860519267',
  },
  {
    id: 'CAFAM',
    match: /CAJA DE COMPENSACION FAMILIAR CAFAM/,
    proveedor: 'Caja de Compensación Familiar Cafam',
    nit: '860013570',
  },
  {
    id: 'LM_INSTRUMENTS',
    match: /L\.?\s*M\.?\s+INSTRUMENTS\s+S\.?A\b/,
    proveedor: 'L.M. Instruments S.A.',
    nit: '800077635',
  },
  { id: 'VYGON', match: /VYGON\s+COLOMBIA/, proveedor: 'Vygon Colombia S.A.S.', nit: '802000335' },
];

type CrearRenglon = (
  fragmento: string,
  descripcion: string,
  codigo: string,
  pagina: number,
  formato: string
) => RenglonExtraido;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
function bloques(text: string, start: RegExp): string[] {
  const found = [...text.matchAll(start)];
  return found.map((m, i) => text.slice(m.index!, found[i + 1]?.index ?? text.length));
}
function cantidad(raw: string | undefined, locale: 'es' | 'en'): number | null {
  if (raw == null) return null;
  const value = raw.trim();
  const pattern =
    locale === 'es'
      ? /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/
      : /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
  if (!pattern.test(value)) return null;
  const n = Number(
    locale === 'es' ? value.replace(/\./g, '').replace(',', '.') : value.replace(/,/g, '')
  );
  return Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : null;
}
export function cantidadRenglonPdf(
  r: RenglonExtraido,
  raw: string | undefined,
  locale: 'es' | 'en',
  unidad?: string
): RenglonExtraido {
  r.cantidad = cantidad(raw, locale);
  if (unidad) r.unidadMedida = clean(unidad);
  if (r.cantidad === null)
    r.advertencias.push(
      'No se identificó una cantidad válida en la columna facturada. Revísela manualmente.'
    );
  return r;
}
function fechaIso(y: string, m: string, d: string) {
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const date = new Date(iso + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}
function fechaProveedor(text: string, formato: string): string | null {
  if (formato === 'SEVEN_PHARMA' || formato === 'VITALIS') {
    const m = text.match(
      formato === 'SEVEN_PHARMA'
        ? /Fecha de Factura\s+Fecha de\s+Vencimiento\s+(20\d{2})-(\d{2})-(\d{2})/i
        : /FECHA DE EMISI[ÓO]N:\s*(20\d{2})-(\d{2})-(\d{2})/i
    );
    return m ? fechaIso(m[1], m[2], m[3]) : null;
  }
  if (formato === 'GRUPO_AFIN') {
    // La extracción intercala el vencimiento antes de la fecha de expedición.
    const m = text.match(
      /(\d{2})\/(\d{2})\/(20\d{2})\s+\d{2}:\d{2}\s*\nFecha de certificaci[oó]n:/i
    );
    return m ? fechaIso(m[3], m[2], m[1]) : null;
  }
  if (['FARMALOGICA', 'MEDTRONIC'].includes(formato)) {
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    const m = text.match(
      formato === 'FARMALOGICA'
        ? /Fecha de Generacion:\s*(\d{1,2})-([a-z]+)-(20\d{2})/i
        : /ORIGINAL\s+(\d{1,2})-([a-z]+)-(20\d{2})/i
    );
    return m && months.includes(m[2].toLowerCase())
      ? fechaIso(m[3], String(months.indexOf(m[2].toLowerCase()) + 1), m[1])
      : null;
  }
  if (formato === 'LM_INSTRUMENTS') {
    const m = text.match(/\n(\d{2})\s+(\d{2})\s+(20\d{2})\s*\n/);
    return m ? fechaIso(m[3], m[2], m[1]) : null;
  }
  const m = text.match(
    formato === 'ALFA_TRADING'
      ? /FECHA DE GENERACION:\s*(\d{2})\/(\d{2})\/(20\d{2})/i
      : formato === 'SURGICON'
        ? /FECHA GENERACI[ÓO]N\s+(\d{2})\/(\d{2})\/(20\d{2})/i
        : formato === 'CAFAM'
          ? /AREA VENTAS FECHA EMISION\s+(\d{2})\/(\d{2})\/(20\d{2})/i
          : /VYGON COLOMBIA S\.A\.S\. FECHA\s*\/\s*DATE:\s*(?:Vendedor\(a\)[^\n]*\n)?(\d{2})\/(\d{2})\/(20\d{2})/i
  );
  return m ? fechaIso(m[3], m[2], m[1]) : null;
}

/** Reglas por formato. Nunca se usan códigos internos, referencias o lotes como CUM. */
export function extraerProveedorPdf(formato: string, pages: PaginaTexto[], crear: CrearRenglon) {
  if (!PERFILES_PDF_ADICIONALES.some(p => p.id === formato)) return null;
  const text = pages.map(p => p.text).join('\n');
  let numero = '';
  switch (formato) {
    case 'SEVEN_PHARMA':
      numero =
        text
          .match(/\bSPCL\s*-\s*[\d.]+/)?.[0]
          .replace(/\s*-\s*/, ' ')
          .replace(/\./g, '') || '';
      break;
    case 'GRUPO_AFIN':
      numero = text.match(/\bBOCE\s+\d+/)?.[0] || '';
      break;
    case 'VITALIS':
      numero = text.match(/\bNo\.\s*(VEN\s*-\s*\d+)/i)?.[1].replace(/\s/g, '') || '';
      break;
    case 'FARMALOGICA':
      numero = text.match(/FACTURA ELECTRONICA DE VENTA No\.\s*(\d+)/i)?.[1] || '';
      if (numero) numero = 'FE ' + numero;
      break;
    case 'ALFA_TRADING':
      numero = text.match(/\bINST\s*-\s*\d+/)?.[0].replace(/\s*-\s*/, ' ') || '';
      break;
    case 'MEDTRONIC':
      numero = text.match(/\bMDTC\s+\d+/)?.[0] || '';
      break;
    case 'SURGICON':
      numero = text.match(/FACTURA ELECTR[ÓO]NICA DE\s+VENTA\s+(\d+)/i)?.[1] || '';
      break;
    case 'CAFAM':
      numero = text.match(/FACTURA ELECTR[ÓO]NICA DE VENTA\s+(SD\d+)/i)?.[1] || '';
      break;
    case 'LM_INSTRUMENTS':
      numero = text.match(/^LM\s+\d{5,}\s*$/m)?.[0].trim() || '';
      break;
    case 'VYGON':
      numero = text.match(/INVOICE No:\s*(\d+)/i)?.[1] || '';
      break;
  }
  const renglones: RenglonExtraido[] = [];
  const add = (
    b: string,
    desc: string,
    codigo: string,
    page: number,
    raw: string | undefined,
    locale: 'es' | 'en',
    unidad?: string
  ) => {
    const r = crear(b, desc, codigo, page, formato);
    if (
      r.tipo === 'SIN_CLASIFICAR' &&
      ['ALFA_TRADING', 'MEDTRONIC', 'LM_INSTRUMENTS'].includes(formato)
    ) {
      r.tipo = 'DISPOSITIVO';
      r.advertencias = r.advertencias.filter(
        a => a !== 'Seleccione el tipo de producto antes de verificar.'
      );
    }
    renglones.push(cantidadRenglonPdf(r, raw, locale, unidad));
    return r;
  };
  for (const page of pages) {
    const t = page.text;
    if (formato === 'SEVEN_PHARMA') {
      // Cada producto termina con su código de barras; el detalle de lote no es otro producto.
      const body = (t.split(/Hora de creaci[oó]n:[^\n]*\n/i)[1] || '')
        .replace(/^\d[\d.-]*\s*\n/, '')
        .split(/\n(?:P[aá]gina\s+\d|Total Bruto:)/i)[0];
      for (const b of body.split(/\nCodigo de barras:[ \t]*\n[^\n]*(?:\n|$)/i)) {
        // Precio y total están en formato colombiano; cantidad usa punto decimal.
        const m = b.match(/^[\d.,]+[ \t]+[\d.,]+\t([^\t\n]*)(?:\t([^\n]*))?$/m);
        if (!m) continue;
        const codigo = m[2]?.match(/(?:^|\s)(\d{1,12}-\d{1,8}|N\.A\.|N\/A)\s*$/i)?.[1] || '';
        add(b, b.slice(0, m.index).trim(), codigo, page.num, m[1], 'en');
      }
    } else if (formato === 'GRUPO_AFIN') {
      const body = t.split(/PRECIO\s+UNITARIO\s*\n/i)[1]?.split(/\nSubtotal\b/i)[0] || '';
      for (const b of bloques(body, /^[\d.,]+[ \t]+(?:INVIMA\b|N\.A\.|N\/A|NO REQUIERE)/gim)) {
        const codigo = /\t(\d{1,12}-\d{1,8}|N\.A\.|N\/A)\t/i.exec(b);
        const descripcion = codigo
          ? b.slice(codigo.index + codigo[0].length)
          : b.match(/\$\s*[\d.,]+\t\t([\s\S]*)$/)?.[1] || '';
        const desc = descripcion.replace(/\n[A-Z]\d{2}[A-Z]{2}\d{2}\s*$/, '');
        add(b, desc, codigo?.[1] || '', page.num, b.match(/^([\d.,]+)[ \t]+/)?.[1], 'es');
      }
    } else if (formato === 'VITALIS') {
      const body = t.split(/\nLOTE DESCRIPCI[ÓO]N|\nSUBTOTAL\b/i)[0];
      for (const b of bloques(body, /^[A-Z0-9-]+\s*\nVence:\s*\n\d{2}\.\d{2}\.\d{4}\s*\n/gm)) {
        const desc = b
          .replace(/^[A-Z0-9-]+\s*\nVence:\s*\n\d{2}\.\d{2}\.\d{4}\s*\n/, '')
          .split(/\nREGISTRO SANITARIO:/i)[0];
        const codigo = b.match(/\bCUM:\s*(\d{1,12}-\d{1,8}|N\.A\.|N\/A)/i)?.[1] || '';
        const raw = b.match(/[ \t]+([+-]?[\d.,]+)[ \t]+[\d.]+,\d{2}[ \t]+[\d.]+,\d{2}\s*$/m)?.[1];
        add(b, desc, codigo, page.num, raw, 'es');
      }
    } else if (formato === 'FARMALOGICA') {
      for (const b of bloques(
        t.split(/\nPREPARADA POR:/i)[0],
        /^\d[\d.]*\t[^\n]*\/\s*\d{2}-[a-z]+\.?-\d{4}\t/gim
      )) {
        const m = b.match(/^\d+\s+(\d[\d.]*)\s+\d[\d.]*\t(\d{1,12}-\d{1,8})\s*$/m);
        add(
          b,
          b.split('\n')[0].split('\t').slice(2).join(' '),
          m?.[2] || '',
          page.num,
          m?.[1],
          'es'
        );
      }
    } else if (formato === 'ALFA_TRADING') {
      const body = t.split(/\nAutorizacion numeracion/i)[0];
      for (const b of bloques(body, /^[A-Z]{4}\d{3}\s+/gm)) {
        const date = /\d{2}\/\d{2}\/\d{4}/.exec(b);
        const m = b.match(/\$[\d,]+\t[^\s]+\s+([\d,]+)\s+\$[\d,]+/);
        const unidad = date
          ? b
              .slice(date.index + date[0].length)
              .split('$')[0]
              .replace(/(?:\d{4}DM-[\d-]+|NO REQUIERE|\bR\d+\b|[\/"\n])/g, ' ')
              .trim()
          : '';
        add(
          b,
          date ? b.slice(0, date.index).replace(/^[A-Z]{4}\d{3}\s+/, '') : b.split('\t')[0],
          '',
          page.num,
          m?.[1],
          'en',
          unidad
        );
      }
    } else if (formato === 'MEDTRONIC') {
      for (const b of bloques(
        t.split(/\n(?:Page \d|VALOR EN LETRAS)/i)[0],
        /^\d[\d.]*\t(?![^\n]*%)(?=[A-Z])/gm
      )) {
        const lines = b.split('\n');
        const m = b.match(/^\d[\d.]*\t\S+\s+([\d.,]+)\s+\d+(?:[.,]\d+)?%\t/m);
        const desc = lines
          .slice(0, 2)
          .join(' ')
          .replace(/^\d[\d.]*\t/, '');
        add(b, desc, '', page.num, m?.[1], 'es', b.match(/U\.M\s+\d+\s+(\w+)/)?.[1]);
      }
    } else if (formato === 'SURGICON') {
      const body = t.split(/\nTotal Nro L[ií]neas:/i)[0];
      for (const b of bloques(body, /^[A-Z0-9-]+\s+NAR\s+\d+\.\s+/gm)) {
        const m = b.match(/^([\d.,]+)\s+[\d,]+\.\d{2}(?:\s|$)/m);
        const desc = b
          .replace(/^[A-Z0-9-]+\s+NAR\s+\d+\.\s+/, '')
          .split(/\s*-\s*GTIN|LOTE\(s\):/i)[0];
        add(b, desc, '', page.num, m?.[1], 'en', 'NAR');
      }
    } else if (formato === 'CAFAM') {
      const body = t.split(/\n(?:CUFE:|Total Nro L[ií]neas:)/i)[0];
      for (const b of bloques(body, /^\d{8}\s+\d+\.\s+/gm)) {
        const m = b.match(/\s([\d,]+)\s+NAR\s+[\d,]+\s+[\d,]+\s+IVA\b/);
        const product = b.replace(/^\d{8}\s+\d+\.\s+/, '');
        add(
          b,
          m ? product.slice(0, product.length - (b.length - m.index!)) : product,
          '',
          page.num,
          m?.[1],
          'en',
          'NAR'
        );
      }
    } else if (formato === 'LM_INSTRUMENTS') {
      const body = t.split(/\n\d+\tTotal Lineas/i)[0];
      for (const b of bloques(body, /^(?:LM-\d+-[A-Z0-9]+|T-\d+-\d+)\s+/gm)) {
        const m = b.match(/^\d[\d,]*\t\d[\d,]*\t([\d,]+)\t\d+\s*$/m);
        const desc = b
          .replace(
            /^(?:LM-\d+-[A-Z0-9]+|T-\d+-\d+)\s+(?:L\.M\. INSTRUMENTS|TRACOE MEDICAL)\s+/i,
            ''
          )
          .split(/\n\d{6,}\s*\n/)[0];
        add(b, desc, '', page.num, m?.[1], 'en');
      }
    } else if (formato === 'VYGON') {
      const body = t.split(/\nSUBTOTAL RETEFUENTE/i)[0];
      for (const b of bloques(body, /^\d{7,}(?:-[A-Z]+)?\s+(?=[A-Za-z])/gm)) {
        const m = b.match(/\s(\d+(?:,\d{3})*\.\d{2})\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}/);
        const product = b.replace(/^\d{7,}(?:-[A-Z]+)?\s+/, '');
        const r = add(
          b,
          m
            ? product.slice(0, product.length - (b.length - m.index!))
            : product.split(/Lote No\./i)[0],
          '',
          page.num,
          m?.[1],
          'en',
          b.match(/^Und\s*$/m)?.[0]
        );
        // Conservar completo el identificador publicado con sus guiones originales.
        const reg = b.match(/No\.\s*INVIMA:\s*([^\n]+)/i)?.[1];
        if (reg) r.registroSanitario = clean(reg);
      }
    }
  }
  return { numero, fecha: fechaProveedor(text, formato), renglones };
}
