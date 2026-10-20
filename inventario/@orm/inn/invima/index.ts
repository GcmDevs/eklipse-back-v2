import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

@Entity('EKINNIVFACTURA')
export class InvimaFacturaOrm {
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
}

@Entity('EKINNIVFACTURAITEM')
export class InvimaFacturaItemOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'FACTURAID', type: 'int' }) facturaId: number;
  @Column({ name: 'PRODUCTOID', type: 'int', nullable: true }) productoId: number | null;
  @Column({ name: 'ORDEN', type: 'int' }) orden: number;
  @Column({ name: 'ORIGINAL', type: 'nvarchar', length: 'MAX' }) original: string;
  @Column({ name: 'DATOS', type: 'nvarchar', length: 'MAX' }) datos: string;
  @Column({ name: 'EXCLUIDO', type: 'bit' }) excluido: boolean;
}

export const ORM_INN_INVIMA_ENTITIES = [
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaConfirmacionOrm,
  InvimaFacturaOrm,
  InvimaFacturaItemOrm,
];
