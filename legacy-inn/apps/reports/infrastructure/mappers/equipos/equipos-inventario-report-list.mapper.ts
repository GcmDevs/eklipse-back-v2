import { EquipoOrm } from "@orm/inn/equipos";
import { InventarioExportRow } from "apps/reports/domain/types";

export class EquiposInventarioReportMapper {
    public static toExportRows(equipos: EquipoOrm[]): InventarioExportRow[] {
        return equipos.map((e) => this.toExportRow(e));
    }

    public static toExportRow(equipo: EquipoOrm): InventarioExportRow {
        const tipoEquipo = equipo.tipoEquipoRel;
        const clasificacion = tipoEquipo?.fichaTecnica?.clasificacionBiomedica;
        const responsable = equipo.responsable;

        return {
            placa: this.cell(equipo.numeroPlaca),
            equipo: this.cell(equipo.nombre),
            marca: this.cell(tipoEquipo?.modelo?.marca?.nombre),
            modelo: this.cell(tipoEquipo?.modelo?.nombre),
            serie: this.cell(equipo.numeroSerie),
            registroSanitario: this.cell(clasificacion?.numeroRegSanitario),
            expedienteSanitario: this.cell(clasificacion?.expedienteRegSanitario),
            clasificacionRiesgo: this.cell(clasificacion?.riesgo),
            area: this.cell(responsable?.areaNombre),
            departamento: this.cell(responsable?.departamentoNombre),
            ubicacion: this.cell(equipo.localizacion),
        };
    }

    private static cell(v: string | number | null | undefined): string {
        return v == null ? '' : String(v).trim();
    }
}