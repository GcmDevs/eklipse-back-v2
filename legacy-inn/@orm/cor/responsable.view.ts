import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'VW_RESPONSABLE_COMPLETE', synchronize: false })
export class ResponsableView {
  @PrimaryColumn({ name: 'responsable_id', type: 'int' })
  responsableId: number;

  @ViewColumn({ name: 'responsable_codigo' })
  responsableCodigo: string;

  @ViewColumn({ name: 'responsable_nombre' })
  responsableNombre: string;

  @ViewColumn({ name: 'responsable_cedula' })
  responsableCedula: string | null;

  @ViewColumn({ name: 'area_id' })
  areaId: number | null;

  @ViewColumn({ name: 'area_codigo' })
  areaCodigo: string | null;

  @ViewColumn({ name: 'area_nombre' })
  areaNombre: string | null;

  @ViewColumn({ name: 'departamento_id' })
  departamentoId: number | null;

  @ViewColumn({ name: 'departamento_codigo' })
  departamentoCodigo: string | null;

  @ViewColumn({ name: 'departamento_nombre' })
  departamentoNombre: string | null;
}
