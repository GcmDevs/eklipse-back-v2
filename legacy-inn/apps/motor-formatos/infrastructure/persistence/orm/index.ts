import { EventoAuditVersionFormatoOrm } from './auditoria';
import { EjecucionMantItemOrm, GrupoEjecucionMantOrm } from './mantenimiento-sec';
import { RegistroDiligenciadoFmtOrm } from './registro-diligenciado.orm';
import { SeccionAnexoImagenesOrm, SeccionPlantillaFmtOrm, SeccionVersionFormatoPlantillaOrm } from './secciones';
import { VersionFormatoFmtOrm } from './version-formato.orm';

export * from './auditoria';
export * from './mantenimiento-sec';
export * from './registro-diligenciado.orm';
export * from './secciones';
export * from './version-formato.orm';

export const ORM_MOTOR_FMTS_ENTITIES = [
    SeccionPlantillaFmtOrm,
    SeccionVersionFormatoPlantillaOrm,
    SeccionAnexoImagenesOrm,
    RegistroDiligenciadoFmtOrm,
    GrupoEjecucionMantOrm,
    EjecucionMantItemOrm,
    VersionFormatoFmtOrm,
    EventoAuditVersionFormatoOrm,
];
