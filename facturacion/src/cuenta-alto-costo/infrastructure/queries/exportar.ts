import { CAMPOS_CAC } from '../../presentation/dtos/cac.dto';
import { FiltrosListadoCac } from '../../presentation/dtos/listado.dto';
import { CONSULTAS_CAC } from './cac.queries';
import { prepararListadoCac } from './listado';

export interface ConsultaExportacionCac {
  sql: string;
  parametros: (string | number)[];
}

export function prepararExportacionCac(filtros: FiltrosListadoCac): ConsultaExportacionCac {
  const listado = prepararListadoCac({
    buscar: filtros.buscar,
    eps: filtros.eps,
    cancer: filtros.cancer,
    estado: filtros.estado,
  });
  const columnas = CAMPOS_CAC.map(campo => {
    const indice = CONSULTAS_CAC.findIndex(seccion => seccion.campos.includes(campo));
    return `s${indice}.[${campo}]`;
  });
  const joins = CONSULTAS_CAC.map(
    (seccion, indice) => `
LEFT JOIN ${seccion.tabla} s${indice}
  ON s${indice}.TIPDOCUSUARIO = f.tipoDocumentoSigla
  AND s${indice}.NUMDOCUSUARIO = f.documento
  AND s${indice}.CODCIE10 = f.codigoCie10`
  );
  return {
    sql: `${listado.cteSql}
SELECT f.paciente PACIENTE, f.eps EPS, f.diagnostico DIAGNOSTICO,
  anterior.DIANOMBRE DIAGNOSTICO_ANTERIOR,
  ${columnas.join(', ')}
FROM Filtrados f
${joins.join('\n')}
OUTER APPLY (
  SELECT TOP (1) d.DIANOMBRE FROM GENDIAGNO d
  WHERE REPLACE(d.DIACODIGO, '.', '') = REPLACE(s2.ANTCODCIE10, '.', '')
  ORDER BY d.OID
) anterior
ORDER BY f.paciente, f.tipoDocumentoSigla, f.documento, f.codigoCie10;`,
    parametros: listado.parametros,
  };
}
