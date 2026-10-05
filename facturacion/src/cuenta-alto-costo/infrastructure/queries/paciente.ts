// Misma consulta proporcionada; únicamente los valores de búsqueda se enlazan como parámetros.
export const PACIENTE_CAC_SQL = `Select genpacien.PACPRINOM,GENPACIEN.PACSEGNOM,GENPACIEN.PACPRIAPE,GENPACIEN.PACSEGAPE,
Case When GENPACIEN.PACTIPDOC = 0 Then ' NINGUNO'
    When GENPACIEN.PACTIPDOC = 4 Then ' REGISTRO CIVIL'
    When GENPACIEN.PACTIPDOC = 3 Then ' TARJETA DE IDENTIDAD'
    When GENPACIEN.PACTIPDOC = 1 Then ' CÉDULA DE CIUDADANÍA'
    When GENPACIEN.PACTIPDOC = 2 Then 'CEDULA DE EXTRANJERIA'
    When GENPACIEN.PACTIPDOC = 5 Then 'PASAPORTE'
    When GENPACIEN.PACTIPDOC = 6 Then ' ADULTO SIN IDENTIFICACION'
    When GENPACIEN.PACTIPDOC = 7 Then 'MENOR SIN IDENTIFICACIÓN '
    When GENPACIEN.PACTIPDOC = 8 Then 'NUMERO UNICO DE IDENTIFICAION'
    When GENPACIEN.PACTIPDOC = 9 Then 'SALVOCONDUCTO '
    When GENPACIEN.PACTIPDOC = 10 Then 'CERTIFICADO NACIDO VIVO '
    When GENPACIEN.PACTIPDOC = 11 Then 'CARNET DIPLOMATICO '
    When GENPACIEN.PACTIPDOC = 12 Then 'PERMISO ESPECIAL DE PERMANENCIA '
End As TIPO_DOC_PAC,
genpacien.pacnumdoc,GENPACIEN.GPAFECNAC AS 'Fecha de nacimiento',
case GENPACIEN.GPASEXPAC when 0 then 'Ninguno' when 1 then 'Masculino' when 2 then 'Femenino' when 3 then 'Indefinido' end as sexo,GENOCUPACION.dgonombre as OCUPACION,
case GPATIPPAC when 0 then 'Ninguno' when 1 then 'Contributivo' when 2 then 'Subsidiado' when 3 then 'Vinculado' when 4 then 'Particular' when 5 then 'Otro' when 6 then 'Despla_Reg_Cont Desplazado'
when 7 then 'Despla_Reg_Subs Desplazado' when 8 then 'Despla_No_Asegurado' end as 'Régimen de afiliación AL SGSSS',
GEENENTADM.ENTCODIGO AS 'Código de la EPS o de la entidad territorial', GEENENTADM.ENTNOMBRE, GENPOBESP.GPENOMBRE as 'Grupo poblacional',
GENMUNICI.MUNCODDEMU as 'Municipio de residencia',GENMUNICI.MUNNOMMUN as 'DESCRIPCION MUNICIPIO',genpacient.PACTELEFONO as 'Número telefónico del paciente',
GEFEAFEAPB as 'Fecha de afiliación a la EPS que registra'
from GENPACIEN
left join GENOCUPACION on GENOCUPACION.oid=genpacien.GENOCUPACION
INNER JOIN GENDETCON ON GENDETCON.OID=GENPACIEN.GENDETCON
INNER JOIN GENCONTRA ON GENCONTRA.OID=GENDETCON.GENCONTRA1
INNER JOIN GEENENTADM ON GEENENTADM.OID=GENCONTRA.DGNENTADM1
left join GENPOBESP on GENPOBESP.oid=genpacien.GENPOBESP
left join GENMUNICI on GENMUNICI.oid=genpacien.DGNMUNICIPIO
left join GENPACIENT on GENPACIENT.GENPACIEN =genpacien.oid
where GENPACIENT.PACTELPRINC = '1'
and PACNUMDOC=@PACNUMDOC
and PACTIPDOC=@PACTIPDOC`;
