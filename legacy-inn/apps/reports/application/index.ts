import { EquipoReportService } from './equipo-report.service';
import { EquiposReportListService } from './equipos-report-list.service';

export * from './equipo-report.service';
export * from './equipos-report-list.service';

export const REPORTS_PROVIDERS = [EquipoReportService, EquiposReportListService];
