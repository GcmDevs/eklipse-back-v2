import catalogo = require('./catalogo.json');
import cups = require('./cups.json');

// Datos de referencia, no código del aplicativo anterior. Su procedencia y versión viajan con el catálogo.
export const CAUSALES_PRE: { code: string; specific: string; general: string }[] = catalogo.codes;
export const AREAS_PRE: string[] = catalogo.areas;
export const FUENTE_CAUSALES = catalogo.glosasSource;
export const CUPS_PRE: { code: string; name: string }[] = cups.services;
export const FUENTE_CUPS = { resolution: cups.resolution, source: cups.source };
