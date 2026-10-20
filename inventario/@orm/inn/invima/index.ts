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

export const ORM_INN_INVIMA_ENTITIES = [
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaConfirmacionOrm,
];
