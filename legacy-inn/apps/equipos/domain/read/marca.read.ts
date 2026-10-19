import { EntityMinimalRead } from '@common/domain/types';

export interface ModeloRead {
  id: number;
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
  marca?: MarcaRead | null;
}

export interface MarcaRead {
  id: number;
  nombre: string;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModeloMinimalRead extends EntityMinimalRead {
  marca: EntityMinimalRead;
}
