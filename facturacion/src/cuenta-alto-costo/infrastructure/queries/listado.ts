import { BadRequestException } from '@nestjs/common';
import { FiltrosListadoCac } from '../../presentation/dtos/listado.dto';
import { SIGLAS_DOCUMENTO_CAC } from '../../presentation/dtos/tipos-documento';

export interface ConsultaListadoCac {
  cteSql: string;
  resumenSql: string;
  registrosSql: string;
  parametros: (string | number)[];
  pagina: number;
  tamano: number;
}

export function prepararListadoCac(filtros: FiltrosListadoCac): ConsultaListadoCac {
  const entero = (valor: string | undefined, defecto: number, maximo: number): number => {
    if (valor === undefined) return defecto;
    if (
      typeof valor !== 'string' ||
      !/^\d+$/.test(valor) ||
      Number(valor) < 1 ||
      Number(valor) > maximo
    )
      throw new BadRequestException('Paginación inválida.');
    return Number(valor);
  };
  const pagina = entero(filtros.pagina, 1, 1000000);
  const tamano = entero(filtros.tamano, 25, 100);
  const texto = (valor: string | undefined): string => {
    if (valor === undefined) return '';
    if (typeof valor !== 'string' || valor.length > 100)
      throw new BadRequestException('El filtro admite hasta 100 caracteres.');
    return valor.trim().replace(/[~%_\[]/g, '~$&');
  };
  const ordenes: Record<string, string> = {
    paciente: 'paciente',
    documento: 'documento',
    codigoCie10: 'codigoCie10',
    eps: 'eps',
    cancerPriorizado: 'TRY_CONVERT(int, cancerPriorizado)',
  };
  const ordenar = filtros.ordenar ?? 'paciente';
  if (!Object.prototype.hasOwnProperty.call(ordenes, ordenar))
    throw new BadRequestException('Ordenamiento inválido.');
  const direccion = filtros.direccion ?? 'asc';
  if (!['asc', 'desc'].includes(direccion)) throw new BadRequestException('Dirección inválida.');
  const estado = filtros.estado ?? '';
  if (!['', 'pendientes'].includes(estado)) throw new BadRequestException('Estado inválido.');
  const cancer = filtros.cancer ?? '';
  if (cancer !== '' && !/^(?:[1-9]|1[0-2])$/.test(cancer))
    throw new BadRequestException('Cáncer priorizado inválido.');
  const tipos = Object.entries(SIGLAS_DOCUMENTO_CAC)
    .map(([numero, sigla]) => `WHEN '${sigla}' THEN ${numero}`)
    .join(' ');
  // Lectura nueva del listado. Las consultas de persistencia permanecen intactas.
  const cte = `
WITH Base AS (
  SELECT CASE LTRIM(RTRIM(c.TIPDOCUSUARIO)) ${tipos} END AS tipoDocumento,
    LTRIM(RTRIM(c.TIPDOCUSUARIO)) tipoDocumentoSigla,
    LTRIM(RTRIM(c.NUMDOCUSUARIO)) documento,
    COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(p.PACPRINOM, ' ', p.PACSEGNOM, ' ', p.PACPRIAPE, ' ', p.PACSEGAPE))), ''), 'Paciente no disponible') paciente,
    LTRIM(RTRIM(c.CODCIE10)) codigoCie10,
    COALESCE(d.DIANOMBRE, '') diagnostico,
    NULLIF(LTRIM(RTRIM(CONVERT(varchar(20), estad.CANPRIORIZADO))), '') cancerPriorizado,
    COALESCE(eps.ENTNOMBRE, '') eps,
    NULLIF(LTRIM(RTRIM(CONVERT(varchar(20), c.IDETIPOTRATAMIENTO))), '') tipoTratamiento
  FROM CACIdentificacionGeneral c
  OUTER APPLY (
    SELECT TOP (1) p.PACPRINOM, p.PACSEGNOM, p.PACPRIAPE, p.PACSEGAPE, p.GENDETCON
    FROM GENPACIEN p
    WHERE p.PACNUMDOC = c.NUMDOCUSUARIO
      AND p.PACTIPDOC = CASE LTRIM(RTRIM(c.TIPDOCUSUARIO)) ${tipos} END
    ORDER BY p.OID
  ) p
  OUTER APPLY (
    SELECT TOP (1) e.ENTNOMBRE FROM GENDETCON dc
    INNER JOIN GENCONTRA ct ON ct.OID = dc.GENCONTRA1
    INNER JOIN GEENENTADM e ON e.OID = ct.DGNENTADM1
    WHERE dc.OID = p.GENDETCON ORDER BY e.OID
  ) eps
  OUTER APPLY (
    SELECT TOP (1) d.DIANOMBRE FROM GENDIAGNO d
    WHERE REPLACE(d.DIACODIGO, '.', '') = REPLACE(c.CODCIE10, '.', '')
    ORDER BY d.OID
  ) d
  OUTER APPLY (
    SELECT MIN(CANPRIORIZADO) CANPRIORIZADO FROM CACDiagnosticoEstadificacion s
    WHERE s.TIPDOCUSUARIO = c.TIPDOCUSUARIO AND s.NUMDOCUSUARIO = c.NUMDOCUSUARIO
      AND s.CODCIE10 = c.CODCIE10
  ) estad
), Marcados AS (
  SELECT *, CASE WHEN tipoTratamiento IS NULL OR cancerPriorizado IS NULL THEN 1 ELSE 0 END pendiente
  FROM Base
), Filtrados AS (
  SELECT * FROM Marcados
  WHERE (documento LIKE @0 ESCAPE '~' OR paciente LIKE @0 ESCAPE '~'
    OR codigoCie10 LIKE @0 ESCAPE '~' OR diagnostico LIKE @0 ESCAPE '~')
    AND eps LIKE @1 ESCAPE '~'
    AND (@2 = '' OR cancerPriorizado = @2)
    AND (@3 = '' OR pendiente = 1)
)`;
  return {
    cteSql: cte,
    pagina,
    tamano,
    parametros: [`%${texto(filtros.buscar)}%`, `%${texto(filtros.eps)}%`, cancer, estado],
    resumenSql: `${cte}
SELECT COUNT(*) registros,
  (SELECT COUNT(*) FROM (SELECT tipoDocumentoSigla, documento FROM Filtrados GROUP BY tipoDocumentoSigla, documento) p) pacientes,
  COALESCE(SUM(pendiente), 0) pendientes FROM Filtrados;`,
    registrosSql: `${cte}
SELECT * FROM Filtrados
ORDER BY ${ordenes[ordenar]} ${direccion}, tipoDocumentoSigla, documento, codigoCie10
OFFSET @4 ROWS FETCH NEXT @5 ROWS ONLY;`,
  };
}
