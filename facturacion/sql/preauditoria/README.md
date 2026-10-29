# Scripts manuales de Preauditoría

El backend no ejecuta estos scripts, no crea estructuras al iniciar ni renombra tablas automáticamente.

La operación y la persistencia pertenecen a la **sede/contexto de la sesión**. Cada sede guarda sus auditorías, configuración, entregas, salarios y horas extras en su propia base. El módulo no usa una base central para datos transversales ni busca instalaciones de otras sedes. No hay migración o copia automática de datos entre bases.

## Orden de ejecución

Para **cada sede** que habilitará, seleccione la base configurada para ese contexto. En pruebas puede ser `DGEMPRES99` si esa es la base asociada a la sede de la sesión. No se deduce el contexto por el nombre de la base.

1. Solo si creó las tablas anteriores `EKPRE_*` en esa base y desea descartarlas, puede ejecutar `000-eliminar-tablas-anteriores.sql`. Es **optativo y destructivo**: elimina sus datos y no los traslada a las tablas nuevas. Omita este paso si ya tiene las tablas corregidas o está realizando una instalación nueva.
2. Ejecute `001-estructura-central.sql` para crear las tablas con la nomenclatura de Eklipse.
3. En `002-configuracion-central.sql`, complete `@Contexto` con el código de la sede (`ALTACENTRO`, `AGUACHICA`, `AMMEDICAL`, `SANJUAN` o `VALLEDUPAR`) y ejecútelo en esa misma base para registrar únicamente su configuración inicial.

4. Ejecute `003-permisos-seguridad.sql` en la base de seguridad de esa sede. Cuando seguridad está en la misma base de la sede, mantenga seleccionada esa base. Si ya lo ejecutó, los registros de permisos se conservan; no hace falta eliminarlos. El script es reejecutable y comprueba colisiones.

Los nombres `001-estructura-central.sql` y `002-configuracion-central.sql` se conservan para mantener los enlaces anteriores; su destino es la **base de cada sede**, no una base central. Si ya ejecutó 001/002/003 en la base correcta, no elimine ni vuelva a crear las tablas: compruebe la instalación desde Eklipse después de actualizar el backend.

Mantenga el módulo fuera de uso mientras sustituye las tablas y publica el backend actualizado. Los scripts no cambian de base automáticamente ni alteran las tablas nativas de Dinámica.

## Diagnóstico sin modificar SQL

`004-diagnostico-contexto.sql` contiene únicamente consultas de lectura. Ejecútelo manualmente en la base de la sede para ver la base/servidor usados, los 14 nombres esperados, los esquemas visibles, el resultado de `OBJECT_ID`, el permiso `SELECT` y el marcador `Id=1, Version=1`.

Para comprobar lo que ve el backend, use la misma cuenta SQL que tiene configurada la conexión de esa sede. Una tabla puede existir y `OBJECT_ID` devolver `NULL` si esa cuenta no tiene visibilidad sobre ella. El diagnóstico no crea estructuras, no modifica permisos ni traslada datos. No requiere volver a ejecutar 001/002/003.

## Nomenclatura de las tablas

Se sigue el patrón existente `EK` + módulo `SLN` + dominio, en mayúsculas y sin separadores. Por ejemplo, Facturación ya usa `EKSLNEGRFACPEN` y `EKSLNEGRFACASIG`. Los nombres de restricciones e índices mantienen los prefijos `PK_`, `FK_`, `UQ_`, `CK_` e `IX_`.

| Anterior               | Nueva                       |
| ---------------------- | --------------------------- |
| `EKPRE_Instalacion`    | `EKSLNPREAUDINSTALACION`    |
| `EKPRE_Auditoria`      | `EKSLNPREAUDITORIA`         |
| `EKPRE_Hallazgo`       | `EKSLNPREAUDHALLAZGO`       |
| `EKPRE_Revision`       | `EKSLNPREAUDREVISION`       |
| `EKPRE_Borrador`       | `EKSLNPREAUDBORRADOR`       |
| `EKPRE_Historial`      | `EKSLNPREAUDHISTORIAL`      |
| `EKPRE_Entrega`        | `EKSLNPREAUDENTREGA`        |
| `EKPRE_EntregaDetalle` | `EKSLNPREAUDENTREGADETALLE` |
| `EKPRE_Notificacion`   | `EKSLNPREAUDNOTIFICACION`   |
| `EKPRE_Configuracion`  | `EKSLNPREAUDCONFIGURACION`  |
| `EKPRE_Cup`            | `EKSLNPREAUDCUP`            |
| `EKPRE_Salario`        | `EKSLNPREAUDSALARIO`        |
| `EKPRE_Hora`           | `EKSLNPREAUDHORA`           |
| `EKPRE_HoraHistorial`  | `EKSLNPREAUDHORAHISTORIAL`  |

Las columnas y los contratos de la API conservan sus nombres. Los scripts de creación/configuración y todas las consultas del backend utilizan las nuevas tablas. El script 000 solo incluye las 14 tablas anteriores y comprueba claves foráneas entrantes desde tablas ajenas antes de eliminar; ante una dependencia o error, revierte la transacción.
