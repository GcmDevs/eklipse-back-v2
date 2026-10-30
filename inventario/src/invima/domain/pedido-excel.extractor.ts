import {
  advertenciasRenglon,
  cumCompleto,
  FacturaExtraida,
  RenglonExtraido,
} from './factura.models';

export interface CeldaPedido {
  texto: string;
  formula?: boolean;
  numero?: number;
}
export interface HojaPedido {
  nombre: string;
  filas: Array<{ numero: number; celdas: CeldaPedido[] }>;
}
const normal = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

const esCabecera = (r: HojaPedido['filas'][number]) => {
  const names = r.celdas.map(c => normal(c.texto));
  return (
    names.includes('CUM') &&
    names.includes('INVIMA') &&
    names.some(v => v.startsWith('DESCRIPCI') || v === 'NOMBRE_PRODUCTO')
  );
};

function cantidadCelda(celda: CeldaPedido): number | null {
  if (celda.formula || !celda.texto.trim()) return null;
  const texto = celda.texto.trim();
  // Las celdas numéricas no dependen de separadores de miles o formato regional.
  const value =
    celda.numero ??
    (/^\d+(?:[.,]\d+)?$/.test(texto) && !/[.,]\d{3}$/.test(texto)
      ? Number(texto.replace(',', '.'))
      : /^\d+$/.test(texto)
        ? Number(texto)
        : NaN);
  return Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? value : null;
}

export function extraerPedidoDisfarma(hojas: HojaPedido[]): FacturaExtraida {
  const candidatas = hojas.filter(h => h.filas.some(esCabecera));
  if (candidatas.length > 1)
    throw new Error(
      'Hay varias hojas de productos. Cargue un pedido con una sola hoja de detalle para evitar omitir renglones.'
    );
  const h = candidatas[0];
  if (!h)
    throw new Error(
      'El Excel no contiene las columnas Descripción o NOMBRE_PRODUCTO, CUM e INVIMA de Disfarma.'
    );
  const header = h.filas.find(esCabecera)!;
  const headers = header.celdas.map(c => normal(c.texto));
  const desc = headers.findIndex(v => v.startsWith('DESCRIPCI') || v === 'NOMBRE_PRODUCTO'),
    cum = headers.indexOf('CUM'),
    reg = headers.indexOf('INVIMA');
  const vence = headers.findIndex(v => /^FECHA.*VENCE/.test(v));
  const codigo = headers.findIndex(v => /^C[OÓ�]?DIGO$/.test(v) || v === 'PRODUCTO');
  const unidades = headers.indexOf('CANTIDAD_UNIDADES');
  const cantidad = unidades >= 0 ? unidades : headers.indexOf('CANTIDAD');
  const presentacion = headers.indexOf('CANTIDAD_PRESENTACION');
  const text = h.filas
    .filter(r => r.numero < header.numero)
    .flatMap(r => r.celdas.map(c => c.texto))
    .join('\n');
  const pedido = text.match(/PEDIDO\s*(?:NO\.?|N[°º])\s*[:.]?\s*([\w-]+)/i);
  const factura = text.match(
    /FACTURA\s+(?:([A-Z][A-Z0-9-]*)\s+)?(?:NO\.?|N[°º])\s*[:.]?\s*([\w-]+)/i
  );
  const esFactura = !pedido && !!factura;
  const numero = pedido?.[1] || (factura ? [factura[1], factura[2]].filter(Boolean).join(' ') : '');
  if (!numero)
    throw new Error(
      'No se identificó el número de pedido o factura. Seleccione el formato Excel Disfarma.'
    );
  const date = text.match(/FECHA\s+EXPEDIC[^:]*:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  const rawDate = date ? `${date[3]}-${date[2]}-${date[1]}` : null;
  const parsedDate = rawDate && new Date(rawDate + 'T00:00:00Z');
  const fecha =
    parsedDate &&
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === rawDate
      ? rawDate
      : null;
  const renglones: RenglonExtraido[] = [];
  for (const r of h.filas.filter(r => r.numero > header.numero)) {
    const cell = (index: number) => r.celdas[index] || { texto: '' };
    const rawDesc = cell(desc),
      rawCum = cell(cum),
      rawReg = cell(reg);
    if (
      !rawDesc.texto.trim() &&
      !rawCum.texto.trim() &&
      !rawReg.texto.trim() &&
      !/^\d+$/.test(codigo >= 0 ? cell(codigo).texto : '')
    )
      continue;
    const code = codigo >= 0 ? cell(codigo).texto.trim() : '';
    if (/^[+-]?\s*(?:TOTAL|SUBTOTAL|BRUTO|DESCUENTO|IVA)\s*:?$/i.test(code)) continue;
    const descripcion = rawDesc.formula ? '' : rawDesc.texto.trim();
    const codigoDeclarado = rawCum.formula ? '' : rawCum.texto.trim();
    const registroSanitario = rawReg.formula ? '' : rawReg.texto.trim();
    const tipo = /\d{4}\s*(?:DM|RD)\s*-/i.test(registroSanitario)
      ? 'DISPOSITIVO'
      : cumCompleto(codigoDeclarado) || /\d{4}\s*MB?\s*-/i.test(registroSanitario)
        ? 'MEDICAMENTO'
        : 'SIN_CLASIFICAR';
    const row: RenglonExtraido = {
      tipo,
      descripcion,
      codigoDeclarado,
      registroSanitario,
      cantidad: cantidad >= 0 ? cantidadCelda(cell(cantidad)) : null,
      ...(presentacion >= 0 ? { cantidadPresentacion: cantidadCelda(cell(presentacion)) } : {}),
      paginas: [],
      hoja: h.nombre,
      fila: r.numero,
      fragmento:
        `Hoja: ${h.nombre} · Fila: ${r.numero}\n` +
        r.celdas
          .map((c, i) => `${header.celdas[i]?.texto || 'Columna ' + (i + 1)}: ${c.texto}`)
          .join('\n'),
      advertencias: [],
    };
    row.advertencias = advertenciasRenglon(row);
    for (const [index, label] of [
      [cantidad, 'Cantidad'],
      [presentacion, 'Cantidad por presentación'],
    ] as const)
      if (
        index >= 0 &&
        (cell(index).formula || (cell(index).texto.trim() && cantidadCelda(cell(index)) === null))
      )
        row.advertencias.push(
          `${label} inválida, ambigua o con fórmula. Revísela manualmente; el valor original se conserva.`
        );
    if (rawDesc.formula || rawCum.formula || rawReg.formula)
      row.advertencias.push(
        'Hay fórmulas en campos del producto. No se usan sus resultados: complete los datos manualmente.'
      );
    if (codigoDeclarado && !cumCompleto(codigoDeclarado))
      row.advertencias.push(
        'El CUM declarado está vacío, no aplica o es ambiguo; revise el identificador.'
      );
    if (registroSanitario && /\s/.test(registroSanitario))
      row.advertencias.push(
        'El registro INVIMA contiene espacios o un formato irregular. Se conserva exactamente como fue declarado.'
      );
    if (descripcion.length > 240 || codigoDeclarado.length > 120 || registroSanitario.length > 100)
      throw new Error(
        `El producto en la fila ${r.numero} supera la longitud admitida. Corrija el archivo antes de cargarlo.`
      );
    renglones.push(row);
  }
  if (!renglones.length) throw new Error('El pedido no contiene renglones de productos.');
  const counts = new Map<string, number>();
  for (const r of renglones)
    if (r.codigoDeclarado) counts.set(r.codigoDeclarado, (counts.get(r.codigoDeclarado) || 0) + 1);
  for (const r of renglones)
    if ((counts.get(r.codigoDeclarado) || 0) > 1)
      r.advertencias.push('CUM repetido en el pedido. Se conserva este renglón para revisión.');
  return {
    tipoDocumento: esFactura ? 'FACTURA' : 'PEDIDO',
    cliente: esFactura ? '' : 'Disfarma',
    formato: 'DISFARMA_EXCEL',
    extractorVersion: '2',
    numero,
    proveedor: esFactura ? 'Disfarma' : '',
    nitProveedor: '',
    fecha,
    paginas: 0,
    renglones,
    advertencias: [
      ...(date && !fecha
        ? ['La fecha de expedición no es válida. Corríjala durante la revisión.']
        : []),
      esFactura
        ? 'Factura del formato Disfarma. Confirme el proveedor y los productos antes de verificar.'
        : 'Pedido del cliente Disfarma. Confirme el cliente y los productos antes de verificar.',
      ...(h.filas.some(
        r =>
          r.numero > header.numero &&
          r.celdas[vence]?.texto &&
          !/^\d{2}\/\d{2}\/\d{4}$/.test(r.celdas[vence].texto)
      )
        ? [
            'La columna «Fecha Vence» contiene valores que no son fechas. Se conservan en la evidencia sin interpretarlos como vencimientos.',
          ]
        : []),
      ...(renglones.some(r => r.advertencias.some(a => a.startsWith('CUM repetido')))
        ? ['Hay CUM repetidos: revise los renglones antes de excluirlos o verificarlos.']
        : []),
    ],
  };
}
