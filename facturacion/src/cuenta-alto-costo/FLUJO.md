# Consulta CAC para pacientes existentes

La identidad de cada registro CAC es `TIPDOCUSUARIO + NUMDOCUSUARIO + CODCIE10`.
Un paciente puede tener varios diagnósticos; dos filas con la misma llave son un conflicto.

## Búsqueda

- `GET /v1/hpn/cuenta-alto-costo?tipoDocumento=1&documento=123` devuelve el paciente y sus diagnósticos CAC, sin elegir uno automáticamente.
- Agregar `&codigoCie10=C509` carga exclusivamente ese registro y sus ocho secciones.
- `tipoDocumento` conserva el código numérico de GENPACIEN. El servicio lo convierte a la sigla correspondiente para las tablas CAC.
- Primero se listan los diagnósticos CAC y se verifica la existencia directamente en GENPACIEN. Luego se ejecuta la consulta original de datos básicos y afiliación.
- Si esa consulta no devuelve filas debido a sus joins, se usan los datos básicos de GENPACIEN con un aviso de información incompleta.
- Si no existe en GENPACIEN ni en CACIdentificacionGeneral, se habilita la creación del paciente antes de diligenciar CAC. Si ya hay filas CAC sin paciente, el alta se bloquea para revisar la identificación.

## Guardado

El PUT conserva su contrato. La versión, la lectura con `UPDLOCK, HOLDLOCK` y las escrituras se resuelven por la llave completa. Se mantiene la transacción serializable y la verificación posterior antes del commit.

Los datos personales se consultan en GENPACIEN; no se añaden columnas a CACIdentificacionGeneral. Las consultas originales de las ocho secciones y de afiliación permanecen intactas. Las nuevas consultas auxiliares están en `infrastructure/queries/busqueda.ts`.

## Crear o completar un paciente

`GET /v1/hpn/cuenta-alto-costo/recursos-paciente` entrega ocupaciones, grupos poblacionales, planes de EPS, departamentos y municipios. El municipio se filtra en el formulario por departamento.

`PATCH /v1/hpn/cuenta-alto-costo/paciente` actualiza nombres, nacimiento, fecha de afiliación, sexo, régimen, ocupación, población, municipio, detalle de contrato y teléfono. `GENPACIEN` y `GENPACIENT` se escriben en una misma transacción. Para EPS se asigna al paciente un `GENDETCON` existente; no se modifican contratos ni entidades compartidas.

`POST /v1/hpn/cuenta-alto-costo/paciente` valida que la identificación no exista en GENPACIEN ni en CACIdentificacionGeneral, inserta GENPACIEN con `OUTPUT INSERTED.OID` y usa ese OID para crear el teléfono principal en GENPACIENT. Las dos operaciones se confirman o revierten juntas. Los campos no diligenciados conservan los valores predeterminados definidos por Dinámica.

La consulta suministrada confirmó que `GEFEAFEAPB` pertenece a GENPACIEN. Las fechas de nacimiento y afiliación admiten fecha conocida, desconocida (`1800-01-01`) o no aplica (`1845-01-01`).

Las pruebas usan datos sintéticos y simulación de base de datos; no ejecutan operaciones sobre una base clínica real.
