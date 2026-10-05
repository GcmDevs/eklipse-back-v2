export const getRecordatorioCitasQuery = () => {
  return `

    SELECT N0.ccmfeccit                      AS FECHOR_INICIAL_CITA,
       N0.ccmfincit                      AS FECHOR_FINAL_CITA,
       N0.ccmestado                      AS ESTADO_CITA,
       CASE N0.ccmpactipdoc
         WHEN 0 THEN 'NINGUNO'
         WHEN 1 THEN 'CC'
         WHEN 2 THEN 'CE'
         WHEN 3 THEN 'TI'
         WHEN 4 THEN 'RC'
         WHEN 5 THEN 'PA'
         WHEN 6 THEN 'ASI'
         WHEN 7 THEN 'MSI'
         WHEN 8 THEN 'NUI'
         WHEN 9 THEN 'SC'
         WHEN 10 THEN 'CNV'
         WHEN 11 THEN 'CD'
         WHEN 12 THEN 'PEP'
         WHEN 14 THEN 'PPT'
         WHEN 15 THEN 'DE'
         WHEN 16 THEN 'NIT'
       END                               AS TIPO_IDENTIFICACION,
       genpacien.pacnumdoc               AS NUM_IDENTIFICACION,
       Isnull(genpacien.pacprinom, '') + ' '
       + Isnull(genpacien.pacsegnom, '') + ' '
       + Isnull(genpacien.pacpriape, '') + ' '
       + Isnull(genpacien.pacsegape, '') AS NOMBRE_PACIENTE,
       genespeci.geecodigo               COD_ESPECIALIDAD,
       genespeci.geedescri               AS NOM_ESPECIALIDAD,
       gentercer.ternumdoc               AS ID_MEDICO,
       N2.gmenomcom                      AS NOM_MEDICO,
       cmnconsul                         AS CONSULTORIO
    FROM   cmncitmed AS N0
       INNER JOIN cmnhormed AS N1
               ON N0.cmnhormed = N1.oid
       INNER JOIN genmedico AS N2
               ON N1.genmedico = N2.oid
       INNER JOIN adncenate AS N3
               ON N1.adncenate = N3.oid
       LEFT JOIN genespeci
              ON N1.genespeci = genespeci.oid
       LEFT JOIN genpacien
              ON N0.genpacien = genpacien.oid
       LEFT JOIN gentercer
              ON N2.gentercer = gentercer.oid
    WHERE  ( N0.ccmestado = 0 )
    AND N0.ccmfeccit >= Dateadd(day, 1, Cast(Getdate() AS DATE))
    ORDER  BY ccmfeccit ASC  
`;
};
