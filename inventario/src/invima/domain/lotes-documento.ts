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
