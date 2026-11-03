import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKINNIVPRODUCTO')
export class InvimaProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'DATOS', type: 'nvarchar', length: 'MAX' }) datos: string;
  @Column({ name: 'VERSION', type: 'int' }) version: number;
  @Column({ name: 'ULTIMAVERIFICACION', type: 'int', nullable: true }) ultimaVerificacionId:
    | number
    | null;
  @Column({ name: 'CREADOPOR', type: 'int' }) creadoPor: number;
  @Column({ name: 'FECHACREA', type: 'datetime2' }) fechaCreacion: Date;
  @Column({ name: 'FECHAACT', type: 'datetime2' }) fechaActualizacion: Date;
}

@Entity('EKINNIVVERIFICACION')
export class InvimaVerificacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'PRODUCTOID', type: 'int' }) productoId: number;
  @Column({ name: 'VERSIONPRODUCTO', type: 'int' }) versionProducto: number;
  @Column({ name: 'ENTRADA', type: 'nvarchar', length: 'MAX' }) entrada: string;
  @Column({ name: 'RESULTADO', length: 30 }) resultado: string;
  @Column({ name: 'EVIDENCIA', type: 'nvarchar', length: 'MAX' }) evidencia: string;
  @Column({ name: 'USUARIOID', type: 'int' }) usuarioId: number;
  @Column({ name: 'USUARIONOMBRE', type: 'nvarchar', length: 240 }) usuarioNombre: string;
  @Column({ name: 'FECHA', type: 'datetime2' }) fecha: Date;
}

@Entity('EKINNIVCONFIRMACION')
export class InvimaConfirmacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'VERIFICACIONID', type: 'int' }) verificacionId: number;
  @Column({ name: 'CANDIDATO', type: 'nvarchar', length: 'MAX' }) candidato: string;
  @Column({ name: 'USUARIOID', type: 'int' }) usuarioId: number;
  @Column({ name: 'USUARIONOMBRE', type: 'nvarchar', length: 240 }) usuarioNombre: string;
  @Column({ name: 'FECHA', type: 'datetime2' }) fecha: Date;
}

export abstract class ObservacionInvimaOrm {
  @Column({ name: 'OBSERVACION', type: 'nvarchar', length: 'MAX', default: '' })
  observacion: string;
  @Column({ name: 'OBSVERSION', type: 'int', default: 0 }) observacionVersion: number;
  @Column({ name: 'OBSUSUARIO', type: 'int', nullable: true }) observacionUsuarioId: number | null;
  @Column({ name: 'OBSNOMBRE', type: 'nvarchar', length: 240, nullable: true })
  observacionUsuarioNombre: string | null;
  @Column({ name: 'OBSFECHA', type: 'datetime2', nullable: true }) observacionFecha: Date | null;
}

@Entity('EKINNIVFACTURA')
export class InvimaFacturaOrm extends ObservacionInvimaOrm {
  @Column({ name: 'TIPODOCUMENTO', length: 20, default: 'FACTURA' }) tipoDocumento: string;
  @Column({ name: 'CLIENTE', type: 'nvarchar', length: 240, default: '' }) cliente: string;
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'NUMERO', type: 'nvarchar', length: 100 }) numero: string;
  @Column({ name: 'PROVEEDOR', type: 'nvarchar', length: 240 }) proveedor: string;
  @Column({ name: 'NITPROVEEDOR', length: 30 }) nitProveedor: string;
  @Column({ name: 'FECHA', type: 'date', nullable: true }) fecha: string | null;
  @Column({ name: 'FORMATO', length: 30 }) formato: string;
  @Column({ name: 'EXTRACTORVERSION', length: 30 }) extractorVersion: string;
  @Column({ name: 'ARCHIVONOMBRE', type: 'nvarchar', length: 260 }) archivoNombre: string;
  @Column({ name: 'ARCHIVOHASH', length: 64 }) archivoHash: string;
  @Column({ name: 'PAGINAS', type: 'int' }) paginas: number;
  @Column({ name: 'ADVERTENCIAS', type: 'nvarchar', length: 'MAX' }) advertencias: string;
  @Column({ name: 'ESTADO', length: 20 }) estado: string;
  @Column({ name: 'VERSION', type: 'int' }) version: number;
  @Column({ name: 'CREADOPOR', type: 'int' }) creadoPor: number;
  @Column({ name: 'ACTUALIZADOPOR', type: 'int' }) actualizadoPor: number;
  @Column({ name: 'FECHACREA', type: 'datetime2' }) fechaCreacion: Date;
  @Column({ name: 'FECHAACT', type: 'datetime2' }) fechaActualizacion: Date;
  @DeleteDateColumn({ name: 'FECHAELIMINA', type: 'datetime2', nullable: true })
  fechaEliminacion: Date | null;
  @Column({ name: 'ELIMINADOPOR', type: 'int', nullable: true }) eliminadoPor: number | null;
}

@Entity('EKINNIVFACTURAITEM')
export class InvimaFacturaItemOrm extends ObservacionInvimaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'FACTURAID', type: 'int' }) facturaId: number;
  @Column({ name: 'PRODUCTOID', type: 'int', nullable: true }) productoId: number | null;
  @Column({ name: 'ORDEN', type: 'int' }) orden: number;
  @Column({ name: 'ORIGINAL', type: 'nvarchar', length: 'MAX' }) original: string;
  @Column({ name: 'DATOS', type: 'nvarchar', length: 'MAX' }) datos: string;
  @Column({ name: 'EXCLUIDO', type: 'bit' }) excluido: boolean;
}

@Entity('EKINNIVRECEPCION')
export class InvimaRecepcionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'FACTURAID', type: 'int' }) facturaId: number;
  @Column({ name: 'ESTADO', length: 20 }) estado: string;
  @Column({ name: 'VERSION', type: 'int' }) version: number;
  @Column({ name: 'CREADOPOR', type: 'int' }) creadoPor: number;
  @Column({ name: 'ACTUALIZADOPOR', type: 'int' }) actualizadoPor: number;
  @Column({ name: 'FECHACREA', type: 'datetime2' }) fechaCreacion: Date;
  @Column({ name: 'FECHAACT', type: 'datetime2' }) fechaActualizacion: Date;
  @Column({ name: 'FECHAFINALIZA', type: 'datetime2', nullable: true })
  fechaFinalizacion: Date | null;
}
@Entity('EKINNIVRECEPCIONITEM')
export class InvimaRecepcionItemOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'RECEPCIONID', type: 'int' }) recepcionId: number;
  @Column({ name: 'FACTURAITEMID', type: 'int' }) facturaItemId: number;
  @Column({ name: 'PRODUCTOID', type: 'int', nullable: true }) productoId: number | null;
  @Column({ name: 'FACTURADO', type: 'nvarchar', length: 'MAX' }) facturado: string;
  @Column({ name: 'FISICO', type: 'nvarchar', length: 'MAX' }) fisico: string;
  @Column({ name: 'DECISION', length: 20 }) decision: string;
  @Column({ name: 'JUSTIFICACION', type: 'nvarchar', length: 4000 }) justificacion: string;
  @Column({ name: 'VERSION', type: 'int' }) version: number;
  @Column({ name: 'USUARIOID', type: 'int' }) usuarioId: number;
  @Column({ name: 'FECHA', type: 'datetime2' }) fecha: Date;
}

export const ORM_INN_INVIMA_ENTITIES = [
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaConfirmacionOrm,
  InvimaFacturaOrm,
  InvimaFacturaItemOrm,
  InvimaRecepcionOrm,
  InvimaRecepcionItemOrm,
];
