export const EQUIPOS_INVENTARIO_COLUMNS = [
  'placa',
  'equipo',
  'marca',
  'modelo',
  'serie',
  'registroSanitario',
  'expedienteSanitario',
  'clasificacionRiesgo',
  'area',
  'departamento',
  'ubicacion',
] as const;

export const EQUIPOS_CUSTOM_COLUMNS = [
  'placa',
  'serie',
  'equipo',
  'marca',
  'modelo',
  'registroSanitario',
  'expedienteSanitario',
  'departamento',
  'area',
  'ubicacion',
  'modalidadAdquisicion',
] as const;

export type CustomExportColumn = (typeof EQUIPOS_CUSTOM_COLUMNS)[number];
export type InventarioExportColumn = (typeof EQUIPOS_INVENTARIO_COLUMNS)[number];
export type InventarioExportRow = Record<InventarioExportColumn, string>;

export const EQUIPOS_EXPORT_COLUMN_LABELS: Record<CustomExportColumn, string> = {
  placa: 'Placa',
  serie: 'Serie',
  equipo: 'Equipo',
  marca: 'Marca',
  modelo: 'Modelo',
  registroSanitario: 'Registro sanitario',
  expedienteSanitario: 'Expediente sanitario',
  departamento: 'Departamento',
  area: 'Área',
  ubicacion: 'Ubicación',
  modalidadAdquisicion: 'Modalidad de adquisición',
};

export const REPORT_BRAND_BLUE = '388194';
export const REPORT_BRAND_BLUE_LIGHT = '92CDDC';
export const REPORT_EXCEL_COLUMN_HEADER_BG = 'D6F0FA';
export const REPORT_EXCEL_COLUMN_HEADER_FG = '2C6573';
export const PDF_RENDER_TIMEOUT_MS = 30_000;
