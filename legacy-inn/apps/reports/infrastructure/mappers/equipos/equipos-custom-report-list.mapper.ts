import { EquipoOrm } from '@orm/inn/equipos';
import { EquipoExportRow, EQUIPOS_CUSTOM_COLUMNS } from 'apps/reports/domain/types';

export class EquiposCustomReportMapper {
  public static toExportRows(equipos: EquipoOrm[]): EquipoExportRow[] {
    return equipos.map((equipo) => this.toExportRow(equipo));
  }

  public static toExportRow(equipo: EquipoOrm): EquipoExportRow {
    const tipoEquipo = equipo.tipoEquipoRel;
    const clasificacion = tipoEquipo?.fichaTecnica?.clasificacionBiomedica;
    const responsable = equipo.responsable;

    const row: EquipoExportRow = {
      placa: this.cell(equipo.numeroPlaca),
      serie: this.cell(equipo.numeroSerie),
      equipo: this.cell(equipo.nombre),
      marca: this.cell(tipoEquipo?.modelo?.marca?.nombre),
      modelo: this.cell(tipoEquipo?.modelo?.nombre),
      registroSanitario: this.cell(clasificacion?.numeroRegSanitario),
      expedienteSanitario: this.cell(clasificacion?.expedienteRegSanitario),
      departamento: this.cell(responsable?.departamentoNombre),
      area: this.cell(responsable?.areaNombre),
      ubicacion: this.cell(equipo.localizacion),
      modalidadAdquisicion: this.cell(equipo.compra?.tipoAdquisicion),
    };

    for (const columna of EQUIPOS_CUSTOM_COLUMNS) {
      if (row[columna] == null) {
        row[columna] = '';
      }
    }
    return row;
  }

  private static cell(value: string | number | null | undefined): string {
    if (value == null) {
      return '';
    }
    return String(value).trim();
  }
}
