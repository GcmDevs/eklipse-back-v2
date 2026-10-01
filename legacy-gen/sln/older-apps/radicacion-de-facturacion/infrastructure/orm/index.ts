import { CentroOrm } from './centro.orm';
import { ContratoOrm } from './contrato.orm';
import { DetalleContratoOrm } from './detalle-contrato.orm';
import { DetalleRadicacionOrm } from './detalle-radicacion.orm';
import { DocumentoOrm } from './documento.orm';
import { FacturaOrm } from './factura.orm';
import { IngresoOrm } from './ingreso.orm';
import { PacienteOrm } from './paciente.orm';
import { RadicacionOrm } from './radicacion.orm';
import { TerceroOrm } from './tercero.orm';
import { UsuarioOrm } from './usuario.orm';

export * from './centro.orm';
export * from './contrato.orm';
export * from './detalle-contrato.orm';
export * from './detalle-radicacion.orm';
export * from './documento.orm';
export * from './factura.orm';
export * from './ingreso.orm';
export * from './paciente.orm';
export * from './radicacion.orm';
export * from './tercero.orm';
export * from './usuario.orm';

export const RADICACION_FACTURACION_ENTITIES_ORM = [
  DetalleRadicacionOrm,
  ContratoOrm,
  DetalleContratoOrm,
  FacturaOrm,
  RadicacionOrm,
  TerceroOrm,
  IngresoOrm,
  CentroOrm,
  DocumentoOrm,
  PacienteOrm,
  UsuarioOrm,
];
