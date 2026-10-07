// El catálogo solo necesita estas columnas; evita descargar las plantillas binarias de DIAPLANOTIF.
export const DIAGNOSTICOS_ONCOLOGICOS_SQL =
  'SELECT DIAGTIPCANCER, DIACODIGO, DIANOMBRE FROM GENDIAGNO WHERE DIADIAONCO = 1';
