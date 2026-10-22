import {
  advertenciasRenglon,
  EXTRACTOR_VERSION,
  FacturaExtraida,
  PaginaTexto,
  RenglonExtraido,
} from './factura.models';

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
const registroPattern = /\b(?:INVIMA\s*)?(\d{4}\s*(?:DM|RD|MB|M)\s*-\s*\d+(?:\s*-\s*R\d+)?)/gi;
const profiles = [
  {
    id: 'DELTA',
    match: /LABORATORIOS\s+DELTA/,
    proveedor: 'Laboratorios Delta S.A.S.',
    nit: '811009393',
  },
  {
    id: 'VANTIVE',
    match: /\bVANTIVE\s+S\.?A\.?S\.?/,
    proveedor: 'Vantive S.A.S.',
    nit: '901755480',
  },
  {
    id: 'BAXTER',
    match: /LABORATORIOS\s+BAXTER/,
    proveedor: 'Laboratorios Baxter S.A.',
    nit: '890300292',
  },
  {
    id: 'CRUZ_VERDE',
    match: /DROGUERIAS\s+Y\s+FARMACIAS\s+CRUZ\s+VERDE/,
    proveedor: 'Droguerías y Farmacias Cruz Verde S.A.S.',
    nit: '800149695',
  },
  {
    id: 'B_BRAUN',
    match: /\bB\.?\s*BRAUN\s+MEDICAL/,
    proveedor: 'B. Braun Medical S.A.',
    nit: '860026442',
  },
  {
    id: 'LIFE',
    match: /LIFE SUMINISTROS/,
    proveedor: 'Life Suministros Médicos S.A.S.',
    nit: '900240177',
  },
  { id: 'SICMAFARMA', match: /SICMAFARMA/, proveedor: 'Sicmafarma S.A.S.', nit: '900332426' },
  { id: 'XINETIX', match: /XINETIX/, proveedor: 'Xinetix Pharma S.A.S.', nit: '900710720' },
  { id: 'OFFIMEDICAS', match: /\bFDO\s+\d+/, proveedor: 'Offimedicas S.A.', nit: '900098550' },
  {
    id: 'EVEDISA',
    match: /\bDIST\s*-\s*\d+/,
    proveedor: 'Eve Distribuciones S.A.S.',
    nit: '891409291',
  },
];

function row(
  fragmento: string,
  descripcion: string,
  codigo: string,
  pagina: number,
  formato: string
): RenglonExtraido {
  const regs = [
    ...new Set([...fragmento.matchAll(registroPattern)].map(m => m[1].replace(/\s+/g, ''))),
  ];
  const declarados = [
    ...new Set(
      [...fragmento.matchAll(/\bCUM\s*[:(]\s*(\d{1,12}\s*-\s*\d{1,8})/gi)].map(m =>
        m[1].replace(/\s/g, '')
      )
    ),
  ];
  const cum = declarados.length > 1 ? '' : codigo.trim();
  const tipo = regs.some(r => /^\d{4}(DM|RD)-/i.test(r))
    ? 'DISPOSITIVO'
    : regs.some(r => /^\d{4}MB?-/i.test(r)) || /^\d+-\d+$/.test(cum)
      ? 'MEDICAMENTO'
      : formato === 'LIFE'
        ? 'DISPOSITIVO'
        : 'SIN_CLASIFICAR';
  const r: RenglonExtraido = {
    tipo,
    descripcion: clean(descripcion),
    codigoDeclarado: cum,
    registroSanitario: regs.length === 1 ? regs[0] : '',
    paginas: [pagina],
    fragmento: fragmento.trim(),
    advertencias: [],
  };
  r.advertencias = advertenciasRenglon(r);
  if (declarados.length > 1)
    r.advertencias.push('Varios CUM declarados: seleccione el que corresponde.');
  if (regs.length > 1)
    r.advertencias.push('Varios registros declarados: seleccione el que corresponde.');
  return r;
}
const cumLabel = (text: string) =>
  text.match(/\bCUM\s*[:(]\s*(\d{1,12}\s*-\s*\d{1,8})/i)?.[1].replace(/\s/g, '') || '';

function bloques(text: string, start: RegExp): string[] {
  const matches = [...text.matchAll(start)];
  return matches.map((m, i) => text.slice(m.index!, matches[i + 1]?.index ?? text.length));
}
function fecha(text: string, formato: string): string | null {
  let parts: string[] | null = null;
  if (formato === 'BAXTER' || formato === 'VANTIVE') {
    const m = text.match(/\b(20\d{2})\/(\d{2})\/(\d{2})\s+\d{1,2}:\d{2}/);
    if (m) parts = [m[1], m[2], m[3]];
  } else if (formato === 'B_BRAUN') {
    const m = text.match(/Fecha Factura\s+(\d{2})\.(\d{2})\.(20\d{2})/i);
    if (m) parts = [m[3], m[2], m[1]];
  } else if (formato === 'DELTA') {
    // pdf-parse places the expiry date before the invoice timestamp in this layout.
    const m = text.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\s+\d{1,2}:\d{2}:\d{2}/);
    if (m) parts = [m[3], m[2], m[1]];
  } else if (formato === 'CRUZ_VERDE') {
    const m = normalize(text).match(
      /FACTURA ELECTRONICA DE VENTA\s+CVF\d*\s+\d+\s+(\d{2})-(\d{2})-(20\d{2})/
    );
    if (m) parts = [m[3], m[2], m[1]];
  } else if (formato === 'LIFE') {
    const m = text.match(/\b(20\d{2})\s+(\d{1,2})\s+(\d{1,2})\s+20\d{2}/);
    if (m) parts = [m[1], m[2], m[3]];
  } else if (formato === 'XINETIX') {
    const m = normalize(text).match(/FECHA GENERACION:\s*([A-Z]+)\s+(\d{1,2})\s+(20\d{2})/);
    const meses = [
      'ENERO',
      'FEBRERO',
      'MARZO',
      'ABRIL',
      'MAYO',
      'JUNIO',
      'JULIO',
      'AGOSTO',
      'SEPTIEMBRE',
      'OCTUBRE',
      'NOVIEMBRE',
      'DICIEMBRE',
    ];
    if (m && meses.includes(m[1])) parts = [m[3], String(meses.indexOf(m[1]) + 1), m[2]];
  } else {
    const m = text.match(
      formato === 'SICMAFARMA'
        ? /\b(\d{2})-(\d{2})-(20\d{2})\s+\d{1,2}:\d{2}/
        : formato === 'OFFIMEDICAS'
          ? /\t(\d{2})\s*\/\s*(\d{2})\s*\/\s*(20\d{2})\s+\d{1,2}:/
          : /\b(\d{2})\s*\/\s*(\d{2})\s*\/\s*(20\d{2})/
    );
    if (m) parts = [m[3], m[2], m[1]];
  }
  if (!parts) return null;
  const iso = parts.map((p, i) => (i ? p.padStart(2, '0') : p)).join('-');
  const parsed = new Date(iso + 'T00:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
}

/** Parses only text supplied by pdf-parse. PDF contents are data, never instructions. */
export function extraerFactura(pages: PaginaTexto[]): FacturaExtraida {
  const text = pages.map(p => p.text).join('\n');
  const profile = profiles.find(p => p.match.test(normalize(text)));
  const formato = profile?.id ?? 'DESCONOCIDO';
  let numero = '';
  if (formato === 'LIFE')
    numero = 'E ' + (text.match(/Actividad ICA[^\n]*\s(\d{4,})\s*\n/)?.[1] || '');
  if (formato === 'SICMAFARMA')
    numero = text.match(/FACTURA ELECTR[ÓO]NICA DE VENTA\s*\n\s*(\d+)/i)?.[1] || '';
  if (formato === 'XINETIX') numero = text.match(/\bXEL\s*-\s*\d+/i)?.[0].replace(/\s/g, '') || '';
  if (formato === 'OFFIMEDICAS') numero = text.match(/^FDO\s+\d+/m)?.[0] || '';
  if (formato === 'EVEDISA')
    numero = text.match(/\bDIST\s*-\s*\d+/)?.[0].replace(/\s*-\s*/, ' ') || '';
  if (formato === 'DELTA')
    numero = text.match(/\bNo\.\s*(FE\s*\d+)/i)?.[1].replace(/\s/g, '') || '';
  if (formato === 'VANTIVE' || formato === 'BAXTER' || formato === 'B_BRAUN')
    numero = text.match(/FACTURA ELECTR[ÓO]NICA DE VENTA\s+No\.\s*(\d+)/i)?.[1] || '';
  if (formato === 'CRUZ_VERDE')
    numero =
      text.match(/FACTURA ELECTR[ÓO]NICA DE VENTA\s+(CVF\d*\s+\d+)/i)?.[1].replace(/\s+/g, ' ') ||
      '';
  const renglones: RenglonExtraido[] = [];
  for (const page of pages) {
    const t = page.text;
    if (formato === 'BAXTER' || formato === 'VANTIVE') {
      const body =
        t.split(/VALOR TOTAL\s*\n/i)[1]?.split(/\n(?:Total Nro L[ií]neas:|IMPORTANTE:|SON:)/i)[0] ||
        '';
      for (const b of bloques(body, /^\d{1,4}\.-\s+/gm)) {
        const product = b.replace(/^\d+\.-\s*/, '');
        const unit = /\s+(?:EA|UN|UND|CAJ|CJ|FCO|BOL)\s+\d[\d.,]*/i.exec(product);
        const desc = unit ? product.slice(0, unit.index) : product.split('\t')[0];
        const columns = unit ? product.slice(unit.index) : '';
        // CUM is the column immediately before the expiry date; lots/internal codes are excluded.
        const codigo =
          columns
            .match(/\t(\d{1,12}\s*-\s*\d{1,8}|N\.A\.|N\/A|NA)[ \t]+\d{2}-\d{2}-\d{2}(?=\s|$)/i)?.[1]
            .replace(/\s/g, '') || '';
        renglones.push(row(b, desc, codigo, page.num, formato));
      }
    } else if (formato === 'DELTA') {
      const body = t.split(/\nTel:|\nTotal Items:/i)[0];
      const start =
        /^\d[\d.,]*[ \t]+(?:\d{1,12}[ \t]*-[ \t]*\d{1,8}|\d[A-Z]\d+|N\.A\.|N\/A|NA)(?=\s|$)/gm;
      for (const block of bloques(body, start)) {
        const end = /\n(?:UD|UN|UND)\s*(?:\n|$)/i.exec(block);
        const b = end ? block.slice(0, end.index + end[0].trimEnd().length) : block;
        const reg = new RegExp(registroPattern.source, 'i').exec(b);
        const afterReg = reg ? b.slice(reg.index + reg[0].length).trim() : b.split('\t').at(-1)!;
        const desc = afterReg
          .replace(
            /^Caja\s+x\s+\d+\s+(?:amp\.?|vial|jer\.?\s+prell\.?)(?:\s+de\s+[\d.,]+\s*mL)?\s*/i,
            ''
          )
          .replace(/\n(?:UD|UN|UND)\s*$/i, '');
        const codigo =
          b
            .match(/^\d[\d.,]*[ \t]+(\d{1,12}[ \t]*-[ \t]*\d{1,8}|N\.A\.|N\/A|NA)(?=\s|$)/i)?.[1]
            .replace(/\s/g, '') || '';
        const r = row(b, desc, codigo, page.num, formato);
        const ium = b.match(/^\d[\d.,]*[ \t]+(\d[A-Z]\d+(?:\r?\n\d+)?)/i)?.[1].replace(/\s/g, '');
        if (ium)
          r.advertencias.push(`La factura declara el IUM ${ium}; no se interpreta como CUM.`);
        renglones.push(r);
      }
    } else if (formato === 'CRUZ_VERDE') {
      const body =
        t.split(/\nMEDIO DE PAGO\s*\n/i)[1]?.split(/L[ií]neas facturadas:|Pag\./i)[0] || '';
      const start =
        /^\d[\d.,]*[ \t]+\d[\d.,]*[ \t]+\d[\d.,]*[ \t]+\d+[ \t]+[A-Z]{2,4}[ \t]+(?:\d[\d.,]*[ \t]+){3}/gm;
      for (const b of bloques(body, start)) {
        const product = b.replace(new RegExp(start.source, 'i'), '');
        const desc = product.split(/\bCUM\s*[:(]|\nCANTIDAD\b/i)[0];
        renglones.push(row(b, desc, cumLabel(b), page.num, formato));
      }
    } else if (formato === 'B_BRAUN') {
      const body =
        t.split(/\nItem[^\n]*\n/i)[1]?.split(/\n(?:Carrera\b|Sub-Total\b|Pague por\b|CUFE:)/i)[0] ||
        '';
      const start = /^\d+[ \t]+\d[\d.,]*[ \t]+\d[\d.,]*[ \t]+\d[\d.,]*[ \t]+/gm;
      for (const b of bloques(body, start)) {
        const product = b.replace(new RegExp(start.source, 'i'), '');
        const desc = product.split(
          /\n[A-Z0-9][A-Z0-9./-]*[ \t]+(?:UN|UND|EA|CAJ)\b|\nReg\.\s*Sanitario/i
        )[0];
        renglones.push(row(b, desc, cumLabel(b), page.num, formato));
      }
    } else if (formato === 'LIFE') {
      const body = t.split(/Por favor abstenerse|\nSON:|\nSUBTOTAL|\nME OBLIGO/i)[0];
      for (const b of bloques(body, /^[A-Z]{2}\d{3,}\s+[^\n]+/gm)) {
        const desc = b
          .split(/\nLOTE:/i)[0]
          .replace(/^[A-Z]{2}\d+\s+/, '')
          .split(/\s+\d[\d,.]*[.,]\d{2}(?=[\t\s]|$)/)[0];
        const codes = [
          ...new Set(
            [...b.matchAll(/\b\d{2}\/\d{2}\/\d{4}\s+(\d{5,12})(?=\s|INVIMA|$)/g)].map(m => m[1])
          ),
        ];
        const r = row(b, desc, codes.length === 1 ? codes[0] : '', page.num, formato);
        if (codes.length > 1)
          r.advertencias.push('Los lotes declaran códigos distintos; revise el renglón.');
        renglones.push(r);
      }
    } else if (formato === 'SICMAFARMA') {
      const body = t.split(/Total Cantidad:/i)[0];
      for (const b of bloques(body, /^(?:\d{1,12}\s*-\s*\d{1,8}|N\.A\.|N\/A|NA)\s+\t?CJ[^\n]*/gm)) {
        const before = b.split(/Auto\/Reg\./i)[0];
        const cells = before.split('\t').map(s => s.trim());
        const desc =
          cells.find(
            s => /^[A-ZÁÉÍÓÚÑ]/i.test(s) && /[a-záéíóúñ®)]\s+/i.test(s) && !/^CJ\s/i.test(s)
          ) || '';
        renglones.push(
          row(
            b,
            desc.replace(/\n[\d,.]+\s*$/, ''),
            b.match(/^([^\s]+)/)?.[1] || '',
            page.num,
            formato
          )
        );
      }
    } else if (formato === 'XINETIX') {
      const body = t.split(/Total Items:/i)[0];
      for (const b of bloques(body, /^\d+\s+\d+\s+[A-Z][^\n]*/gm)) {
        const desc = b.replace(/^\d+\s+\d+\s+/, '').split(/Lote\s*-\s*Fech/i)[0];
        renglones.push(row(b, desc, cumLabel(b), page.num, formato));
      }
    } else if (formato === 'OFFIMEDICAS') {
      const body = t.split(/CR[ÉE]DITO\s*\n/i)[1]?.split(/noc\d+\(/i)[0] || '';
      const starts = [...body.matchAll(/^\d[\d.,]*[ \t]+\d[\d.,]*\t[^\n]+/gm)];
      const continuation = body.slice(0, starts[0]?.index ?? body.length).trim();
      if (continuation && renglones.length) {
        const previous = renglones.pop()!;
        const merged = row(
          previous.fragmento + '\n' + continuation,
          previous.descripcion,
          previous.codigoDeclarado,
          previous.paginas[0],
          formato
        );
        merged.paginas = [...previous.paginas, page.num];
        renglones.push(merged);
      }
      for (let i = 0; i < starts.length; i++) {
        const b = body.slice(starts[i].index!, starts[i + 1]?.index ?? body.length);
        const firstLine = b.split('\n')[0].split('\t').slice(-1)[0] || '';
        const remainder = b.slice(b.indexOf('\n') + 1);
        const desc = (firstLine + '\n' + remainder).split(/\bCum\s*\(/i)[0];
        renglones.push(row(b, desc, cumLabel(b), page.num, formato));
      }
    } else if (formato === 'EVEDISA') {
      const body = t.split(/De conformidad|La presente factura/i)[0];
      const bs = bloques(body, /^\d{3,}\s+\d{1,3}\s+\d[\d,.]*[^\n]*/gm);
      for (const block of bs) {
        const end = /FECHA\s+VENC:\s*(?:\d{8}|\d{2}\/\d{2}\/\d{4})/i.exec(block);
        const b = end ? block.slice(0, end.index + end[0].length) : block;
        const desc = b.slice(b.indexOf('\n') + 1).split(/\bCUM\s*:/i)[0];
        if (cumLabel(b)) renglones.push(row(b, desc, cumLabel(b), page.num, formato));
      }
    } else {
      for (const b of bloques(t, /^.*\bCUM\s*[:(][^\n]*/gim)) {
        const r = row(
          b.split(/\n\s*\n/)[0],
          b.split(/\bCUM\s*[:(]/i)[0],
          cumLabel(b),
          page.num,
          formato
        );
        r.advertencias.push(
          'Formato no reconocido: revise la descripción y su asociación con el código.'
        );
        renglones.push(r);
      }
    }
  }
  return {
    formato,
    extractorVersion: EXTRACTOR_VERSION,
    proveedor: profile?.proveedor || '',
    nitProveedor: profile?.nit || '',
    numero: numero === 'E ' ? '' : numero,
    fecha: fecha(text, formato),
    paginas: pages.length,
    renglones,
    advertencias: [
      ...(profile ? [] : ['Formato no reconocido. Revise o agregue los productos manualmente.']),
      ...(renglones.length
        ? []
        : ['No se identificaron renglones de productos. Puede agregarlos manualmente.']),
    ],
  };
}
