import JSZip = require('jszip');
import { CAMPOS_CAC, CampoCac } from '../../presentation/dtos/cac.dto';
import { CATALOGOS_CAC } from '../../presentation/dtos/catalogos-cac';
import { ExcelCacResponse } from '../../presentation/dtos/excel.dto';
import { DEFINICION_CAMPOS } from '../queries/campos';

type ValorCacExcel = string | number | boolean | Date | null;
export interface FilaExportacionCac extends Record<CampoCac, ValorCacExcel> {
  PACIENTE: string;
  EPS: string;
  DIAGNOSTICO: string;
  DIAGNOSTICO_ANTERIOR: string | null;
}
interface ColumnaExcel {
  clave: CampoCac | 'PACIENTE' | 'EPS';
  titulo: string;
  ancho: number;
}
const documentos: Record<string, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  RC: 'Registro civil',
  PA: 'Pasaporte',
  AS: 'Adulto sin identificación',
  MS: 'Menor sin identificación',
  NU: 'Número único de identificación',
  SC: 'Salvoconducto',
  CN: 'Certificado de nacido vivo',
  CD: 'Carnet diplomático',
  PE: 'Permiso especial de permanencia',
};
const definiciones = new Map<CampoCac, { etiqueta: string; tipo: string }>(
  DEFINICION_CAMPOS.map(campo => [campo.nombre, campo])
);
const columnas: ColumnaExcel[] = [
  { clave: 'TIPDOCUSUARIO', titulo: 'Tipo de documento', ancho: 30 },
  { clave: 'NUMDOCUSUARIO', titulo: 'Número de documento', ancho: 24 },
  { clave: 'PACIENTE', titulo: 'Paciente', ancho: 38 },
  { clave: 'EPS', titulo: 'EPS', ancho: 34 },
  ...CAMPOS_CAC.filter(campo => !['TIPDOCUSUARIO', 'NUMDOCUSUARIO'].includes(campo)).map(campo => ({
    clave: campo,
    titulo: `${definiciones.get(campo)?.etiqueta ?? campo}`,
    ancho: CATALOGOS_CAC[campo] ? 38 : 28,
  })),
];

function xml(valor: string): string {
  return valor
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
function letra(indice: number): string {
  let valor = indice + 1;
  let resultado = '';
  while (valor) {
    valor--;
    resultado = String.fromCharCode(65 + (valor % 26)) + resultado;
    valor = Math.floor(valor / 26);
  }
  return resultado;
}
function textoCelda(referencia: string, texto: string, estilo = 1): string {
  // inlineStr conserva códigos, ceros iniciales y textos que empiezan por "=" sin ejecutarlos.
  return `<c r="${referencia}" t="inlineStr" s="${estilo}"><is><t xml:space="preserve">${xml(texto)}</t></is></c>`;
}
function celda(fila: FilaExportacionCac, columna: ColumnaExcel, referencia: string): string {
  const valor = fila[columna.clave];
  if (valor === null || valor === undefined || valor === '') return `<c r="${referencia}" s="1"/>`;
  const texto = valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).trim();
  if (columna.clave === 'PACIENTE' || columna.clave === 'EPS') return textoCelda(referencia, texto);
  const campo = columna.clave;
  const codigo = typeof valor === 'boolean' ? (valor ? '1' : '0') : texto;
  const descripcion =
    campo === 'TIPDOCUSUARIO'
      ? documentos[codigo]
      : campo === 'CODCIE10'
        ? fila.DIAGNOSTICO
        : campo === 'ANTCODCIE10'
          ? fila.DIAGNOSTICO_ANTERIOR
          : CATALOGOS_CAC[campo]?.find(opcion => opcion.codigo === codigo)?.descripcion;
  if (descripcion) return textoCelda(referencia, `${codigo} - ${descripcion}`);
  const definicion = definiciones.get(campo);
  if (definicion?.tipo === 'date') {
    if (texto === '1800-01-01') return textoCelda(referencia, texto + ' - Desconocida');
    if (texto === '1845-01-01') return textoCelda(referencia, texto + ' - No aplica');
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(texto) &&
      texto >= '1900-03-01' &&
      Number.isFinite(Date.parse(texto)) &&
      new Date(texto).toISOString().slice(0, 10) === texto
    ) {
      const serial = (Date.parse(texto) - Date.UTC(1899, 11, 30)) / 86400000;
      return `<c r="${referencia}" s="2"><v>${serial}</v></c>`;
    }
  }
  if (
    !CATALOGOS_CAC[campo] &&
    definicion?.tipo === 'number' &&
    /^-?\d+$/.test(codigo) &&
    Number.isSafeInteger(Number(codigo))
  )
    return `<c r="${referencia}" s="1"><v>${Number(codigo)}</v></c>`;
  return textoCelda(referencia, codigo);
}

export async function generarExcelCac(filas: FilaExportacionCac[]): Promise<ExcelCacResponse> {
  if (!filas.length)
    throw new Error('No hay registros para exportar con los filtros seleccionados.');
  if (filas.length > 1048575)
    throw new Error('El resultado supera el límite de filas de Excel. Aplica filtros.');
  const claves = new Set<string>();
  for (const fila of filas) {
    const clave = JSON.stringify([fila.TIPDOCUSUARIO, fila.NUMDOCUSUARIO, fila.CODCIE10]);
    if (claves.has(clave))
      throw new Error('Hay registros CAC duplicados. Revisa los duplicados antes de exportar.');
    claves.add(clave);
  }
  const ultimaCelda = `${letra(columnas.length - 1)}${filas.length + 1}`;
  const encabezados = columnas
    .map((columna, i) => textoCelda(letra(i) + '1', columna.titulo, 3))
    .join('');
  const datos = filas
    .map(
      (fila, i) =>
        `<row r="${i + 2}">${columnas.map((columna, j) => celda(fila, columna, letra(j) + (i + 2))).join('')}</row>`
    )
    .join('');
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Registros CAC" sheetId="1" r:id="rId1"/></sheets></workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );
  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0E7490"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
  );
  zip.file(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${ultimaCelda}"/>
<sheetViews><sheetView workbookViewId="0"><pane xSplit="4" ySplit="1" topLeftCell="E2" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="E2" sqref="E2"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="30"/>
<cols>${columnas.map((columna, i) => `<col min="${i + 1}" max="${i + 1}" width="${columna.ancho}" customWidth="1"/>`).join('')}</cols>
<sheetData><row r="1" ht="60" customHeight="1">${encabezados}</row>${datos}</sheetData>
<autoFilter ref="A1:${ultimaCelda}"/>
</worksheet>`
  );
  return {
    nombreArchivo: `Registros_CAC_${new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date())}.xlsx`,
    tipoContenido: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    contenidoBase64: await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' }),
    cantidadRegistros: filas.length,
  };
}
