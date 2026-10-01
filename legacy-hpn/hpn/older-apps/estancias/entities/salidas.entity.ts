import { ViewEntity, ViewColumn, PrimaryGeneratedColumn } from 'typeorm';

@ViewEntity({ name: 'GCMHPNREGSALIDA' })
export class SalidaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ViewColumn({ name: 'GENPACIEN' })
  patient: number;

  @ViewColumn({ name: 'AINCONSEC' })
  consecutive: number;

  @ViewColumn({ name: 'GENUSUARIO' })
  userId: number;

  @ViewColumn({ name: 'TIPOSALIDA' })
  checkOutType: number;

  @ViewColumn({ name: 'FECHREGISTRO' })
  createdAt: Date;

  @ViewColumn({ name: 'DESCONFIRMADAPOR' })
  disconfirmedBy: number | null;
}
