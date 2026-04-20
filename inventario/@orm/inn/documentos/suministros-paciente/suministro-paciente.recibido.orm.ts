import { ViewEntity, ViewColumn, PrimaryGeneratedColumn } from 'typeorm';

@ViewEntity({ name: 'EKINNSUMRECMODIF' })
export class SuministroPacienteRecibidoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ViewColumn({ name: 'INNCSUMPA' })
  ordenSuministrosId: number;

  @ViewColumn({ name: 'GENUSUENT' })
  usuarioEntregaId: number;

  @ViewColumn({ name: 'GENUSUREC' })
  usuarioRecibeId: number;

  @ViewColumn({ name: 'GENUSUMO' })
  usuarioModificaId: number;

  @ViewColumn({ name: 'FECHENTRE' })
  fechaEntrega: Date;

  @ViewColumn({ name: 'FECHMODI' })
  fechaModificacion: Date;
}
