import { TipoProductoInvima } from './invima.models';

export const EXTRACTOR_VERSION = '2';
export interface RenglonFactura {
  tipo: TipoProductoInvima;
  descripcion: string;
  codigoDeclarado: string;
  registroSanitario: string;
}
export interface RenglonExtraido extends RenglonFactura {
  hoja?: string;
  fila?: number;
  paginas: number[];
  fragmento: string;
  advertencias: string[];
}
export interface FacturaExtraida {
  tipoDocumento?: 'FACTURA' | 'PEDIDO';
  cliente?: string;
  formato: string;
  extractorVersion: string;
  proveedor: string;
  nitProveedor: string;
  numero: string;
  fecha: string | null;
  paginas: number;
  advertencias: string[];
  renglones: RenglonExtraido[];
}
export interface PaginaTexto {
  num: number;
  text: string;
}
export const cumCompleto = (value: string) => /^\d{1,12}\s*-\s*\d{1,8}$/.test(value.trim());
export function advertenciasRenglon(row: RenglonFactura): string[] {
  const warnings: string[] = [];
  if (!row.descripcion.trim()) warnings.push('Falta la descripción del producto.');
  if (row.tipo === 'SIN_CLASIFICAR')
    warnings.push('Seleccione el tipo de producto antes de verificar.');
  if (row.tipo === 'MEDICAMENTO' && !cumCompleto(row.codigoDeclarado))
    warnings.push(
      'Sin CUM completo: se consultará por registro o descripción y requerirá revisión.'
    );
  if (!row.registroSanitario.trim())
    warnings.push('La factura no aporta un registro sanitario identificable.');
  return warnings;
}
