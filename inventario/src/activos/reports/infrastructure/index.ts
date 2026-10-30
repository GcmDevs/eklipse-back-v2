import { ExceljsEquiposCustomExportGenerator, ExceljsInventarioExportGenerator, PuppeteerPdfGenerator } from "./exporters";
import { TypeOrmEquipoReportRepository, TypeOrmEquiposReportListRepository } from "./persistence";

export const REPORTS_INFRA_PROVIDERS = [
    TypeOrmEquipoReportRepository,
    TypeOrmEquiposReportListRepository,
    PuppeteerPdfGenerator,
    ExceljsEquiposCustomExportGenerator,
    ExceljsInventarioExportGenerator,
]