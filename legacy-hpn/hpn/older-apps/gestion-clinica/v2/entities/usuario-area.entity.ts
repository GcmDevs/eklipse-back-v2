import { ViewEntity, ViewColumn, PrimaryGeneratedColumn, Column } from 'typeorm';

@ViewEntity({ name: 'GCMHPNGESTUSUAREA' })
export class UsuarioAreaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ViewColumn({ name: 'GENUSUARIO' })
  user: number;

  @ViewColumn({ name: 'AREA' })
  area: number;

  @ViewColumn({ name: 'GENUSUREG' })
  createdBy: number;
}
