import { GcmContexts } from '@inn/old/common/application/constants';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ADNCENATE')
export class InnEklCentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO', length: 10 })
  codigo: string;

  @Column({ name: 'NOMBRE', length: 100 })
  nombre: string;

  @Column({ name: 'CONTEXTO', length: 10 })
  contexto: GcmContexts;

  usuariosIds?: number[] = [];
  proveedoresIds?: number[] = [];
  cotizadoresIds?: number[] = [];
  usuariosVerificadoresOCIds?: number[] = [];
  usuariosProgramadoresOCIds?: number[] = [];
  areasServicioIds?: number[] = [];
  productosIds?: number[] = [];
  creadoresEstadosIds?: number[] = [];
  ordenesCompraIds?: number[] = [];
}
