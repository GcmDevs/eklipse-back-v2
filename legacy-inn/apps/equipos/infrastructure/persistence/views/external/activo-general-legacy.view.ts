import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'VW_ACTIVO_GENERAL_LEGACY', synchronize: false })
export class GeneralActivoLegacyView {
  @ViewColumn({ name: 'id' })
  id: number;

  @ViewColumn({ name: 'num_placa' })
  numeroPlaca: string;

  @ViewColumn({ name: 'num_serie' })
  numeroSerie: string;

  @ViewColumn({ name: 'detalle' })
  observaciones: string;

  @ViewColumn({ name: 'garantia' })
  aplicaGarantia: boolean;

  @ViewColumn({ name: 'fecha_vecto_garantia' })
  fechaVencimientoGarantia: Date;

  @ViewColumn({ name: 'fecha_instalacion' })
  fechaInstalacion: Date;

  @ViewColumn({ name: 'mantenimiento' })
  tiempoMantenimiento: number;

  @ViewColumn({ name: 'numero_factura' })
  numeroFactura: string;

  @ViewColumn({ name: 'tipo_manual_code' })
  tipoManualCodigo: string;

  @ViewColumn({ name: 'modelo' })
  modeloLegacyNombre: string;

  @ViewColumn({ name: 'marca' })
  marcaLegacyNombre: string;

  @ViewColumn({ name: 'activo_id' })
  activoId: number;

  @ViewColumn({ name: 'fecha_compra' })
  fechaCompra: Date;

  @ViewColumn({ name: 'activo_num_placa' })
  activoNumeroPlaca: string;

  @ViewColumn({ name: 'responsable_id' })
  responsableId: number;

  @ViewColumn({ name: 'responsable_codigo' })
  responsableCodigo: string;

  @ViewColumn({ name: 'responsable_nombre' })
  responsableNombre: string;

  @ViewColumn({ name: 'area_id' })
  areaId: number;

  @ViewColumn({ name: 'area_codigo' })
  areaCodigo: string;

  @ViewColumn({ name: 'area_nombre' })
  areaNombre: string;

  @ViewColumn({ name: 'departamento_id' })
  departamentoId: number;

  @ViewColumn({ name: 'departamento_codigo' })
  departamentoCodigo: string;

  @ViewColumn({ name: 'departamento_nombre' })
  departamentoNombre: string;

  @ViewColumn({ name: 'producto_id' })
  productoId: number;

  @ViewColumn({ name: 'producto_codigo' })
  productoCodigo: string;

  @ViewColumn({ name: 'producto_nombre' })
  productoNombre: string;

  @ViewColumn({ name: 'producto_precio_sugerido' })
  productoPrecioSugerido: number;

  @ViewColumn({ name: 'clasificacion_id' })
  clasificacionId: number;

  @ViewColumn({ name: 'clasificacion_nombre' })
  clasificacionNombre: string;

  @ViewColumn({ name: 'proveedor_id' })
  proveedorId: number;

  @ViewColumn({ name: 'proveedor_codigo' })
  proveedorCodigo: string;

  @ViewColumn({ name: 'proveedor_nombre' })
  proveedorNombre: string;

  @ViewColumn({ name: 'proveedor_direccion' })
  proveedorDireccion: string;

  @ViewColumn({ name: 'proveedor_telefono1' })
  proveedorTelefono1: string;

  @ViewColumn({ name: 'proveedor_telefono2' })
  proveedorTelefono2: string;

  @ViewColumn({ name: 'proveedor_terceroId' })
  proveedorTerceroId: number;

  @ViewColumn({ name: 'fabricante' })
  fabricante: string;

  @ViewColumn({ name: 'distribuidor' })
  distribuidor: string;
}
