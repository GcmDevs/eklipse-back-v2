# API del módulo de tanqueos — contrato para front

Fuente de verdad: `presentation/controllers/`, `presentation/dto/` y `domain/reads/*.ts`.  
Si un campo no aparece aquí, **no está en el contrato** (aunque exista en BD u ORM).

---

## Convenciones HTTP

| Tema | Regla |
|------|--------|
| Base inventario | `/v4/inn/...` |
| Autenticación | JWT en `Authorization` (mismo esquema que el resto de 8006) |
| Respuesta exitosa | `{ status, statusCode, message?, data, metadata?, timestamp }` |
| Contenido de esta guía | Siempre el objeto **`data`** (y **`metadata`** en listas paginadas) |
| Paginación | Query `page` (≥ 1), `limit` (≥ 1). Por defecto **`page = 1`**, **`limit = 10`** |
| Fechas en body | String parseable (ISO 8601 recomendado) → `Date` en servidor |
| Booleanos en query | `true` / `false` (`@OptionalBooleanQuery`) |
| Permisos | Cada ruta declara `@Authorities([...])`. Sin permiso → **403** |
| Header **`ctx`** | Código numérico de sede (mismo contrato que `GET /v4/media/preview/:id`). Si apunta a **otra** sede que el JWT, el interceptor exige el permiso transversal indicado en la ruta (`VER_T_SEDES`, `RESOLVER_TRANSVERSAL`, `REGISTRAR_RETROACTIVOS_TRANSVERSALES`, etc.). Sin `ctx` → sede del JWT. |
| Multi-sede en listado | Usuario con permiso directo **VER_T_SEDES** en `GET /tanqueos` y `GET /tanqueos/resumen` consulta todas las sedes |
| Campo **`ctx` en respuesta** | En listados multisede y tras operaciones con override, `TanqueoRead.ctx` = código numérico de la sede donde vive el registro (para reenviar en lecturas/escrituras posteriores). |

**Subida de imágenes:** los `mediaId` deben provenir del flujo de **core/media** (`POST /v4/media/upload/imagenes`, mismo staging que el resto del inventario). Si el tanqueo se gestiona en **otra sede** (`TanqueoRead.ctx` / detalle multisede), enviar el **mismo header `ctx`** en el upload que en `POST /tanqueos/:id/evidencias` y en `GET /tanqueos/:id`; si no, el archivo queda en la BD de la sede del JWT y `mediaId` no se resuelve al vincular evidencia. El backend valida que el archivo exista en la sede efectiva antes de persistir la evidencia.

---

## Enums y literales (JSON)

Enviar **exactamente** estos strings (mayúsculas como abajo).

| Nombre | Valores |
|--------|---------|
| `EstadoTanqueo` | `VALIDADO_AUTOMATICAMENTE`, `APTO_PARA_REVISION`, `CRITICO`, `VALIDADO_MANUALMENTE`, `ANULADO` |
| `OrigenTanqueo` | `ESTACION`, `REPOSITORIO` |
| `TipoRegistro` | `CONDUCTOR`, `COORDINADOR` |
| `CanalRegistro` | `MOVIL`, `WEB` |
| `TipoCombustible` | `EXTRA`, `CORRIENTE`, `DIESEL`, `GAS` |
| `UnidadMedidaCombustible` | `GAL`, `L` |
| `TipoEvidencia` | `TABLERO_INICIAL`, `SURTIDOR_INICIAL`, `SURTIDOR_FINAL`, `INDICADOR_COMBUSTIBLE_FINAL`, `FACTURA`, `FOTO_REPO_ANTES`, `FOTO_REPO_DESPUES` |
| `EstadoEvidencia` (solo respuestas) | `CAPTURADA`, `OMITIDA`, `NO_APLICA` |
| `EstadoInconsistencia` | `ABIERTA`, `CERRADA` |
| `ResultadoInconsistencia` (persistido) | `CORREGIDA`, `JUSTIFICADA`, `FALSO_POSITIVO` |
| `ResultadoInconsistenciaResolucion` (solo `PATCH .../tanqueos/:id/inconsistencias/:inconsistenciaId/resolver`) | `JUSTIFICADA`, `FALSO_POSITIVO` |
| `CodigoInconsistencia` | `EVID_SIN_FOTO`, `EVID_REC_OMIT`, `EVID_ODO_OMIT`, `KM_MENOR_ANT`, `KM_SALTO`, `CANT_COMB_CAP`, `VALOR_ALTO_INU`, `TQ_DUP`, `UBIC_FUERA_RAD`, `UBIC_DISCREP`, `UBIC_NO_CONC` |
| `SeveridadInconsistencia` | `CRITICA`, `ADVERTENCIA` |
| `ResultadoValidacionUbicacion` | `DENTRO_RADIO`, `FUERA_RADIO`, `DISCREPANCIA`, `NO_CONCLUYENTE`, `NO_VALIDADO` |
| `MotivoUbicacionNoDisponible` | `PERMISO_DENEGADO`, `GPS_DESACTIVADO`, `TIMEOUT`, `NO_SOPORTADO` |
| `ModoValidacionUbicacion` | `OFF`, `SHADOW`, `ACTIVE` |
| `EstadoIntentoTanqueo` | `PENDIENTE`, `RECUPERADO` |
| `EstadoAbastecimiento` | `ACTIVO`, `ANULADO` |
| `EstadoVehiculo` | `ACTIVA`, `INACTIVA`, `EN_MANTENIMIENTO` |
| `EstadoOdometro` | `FUNCIONANDO`, `DANADO` |
| `TipoActivo` | `VEHICULO`, `MAQUINA` |
| `ClasificacionUso` | `CARGA`, `PRESIDENCIA`, `UNIDAD_MOVIL`, `MICROBUS`, `AMBULANCIA`, `MOTO`, `MAQUINA`, `PLANTA` |
| `FuenteLecturaOdometro` | `TANQUEO`, `AJUSTE`, `MANTENIMIENTO` |
| `TipoMovimientoCombustible` | `ENTRADA`, `SALIDA` |
| `AccionEvidenciaLog` | `AGREGADA`, `REEMPLAZADA`, `ELIMINADA`, `REASIGNADA`, `OMITIDA` |

**Kilometraje en tanqueos:** entero `1 … 4294967295` cuando se envía (`MAX_KILOMETRAJE`).

**UUID de cliente (lote):** `clienteUuid` = UUID v4 (string hasta 36 caracteres).

**Idempotencia**

| Ruta | Clave |
|------|--------|
| `POST /tanqueos/repositorio` | Header **`idempotency-key`** obligatorio (no vacío) |
| `POST /tanqueos/sincronizar-lote` | Header `idempotency-key` **o** body `idempotencyKey`; si vienen ambos, **gana el header** |

Misma clave + payload distinto → error de negocio (conflicto de idempotencia).

---

## DTO compartido: `EvidenciaItemDto` (registro inicial)

Usado en `CreateTanqueoPayloadDto`, `TanqueoItemDto` y `CreateEntradaRepositorioDto`.

| Campo | Requerido | Tipo / regla |
|-------|-----------|----------------|
| `tipo` | sí | `TipoEvidencia` |
| `omitida` | sí | boolean |
| `mediaId` | condicional | int ≥ 1 si `omitida === false` |
| `motivoOmision` | condicional | string ≤ 500 si `omitida === true` |

En registro, el servidor valida el conjunto de tipos requeridos según `origen` (estación vs repositorio) y genera inconsistencias de evidencia si corresponde.

---

# Endpoints

## 1. Tanqueos — `/v4/inn/vehiculos/tanqueos`

### `POST /repositorio`

| | |
|--|--|
| **Permiso** | `GESTION_TANQUEOS.TANQUEOS.REGISTRAR` |
| **Transversal** | Si el header **`ctx`** apunta a **otra** sede distinta a la del JWT, exige permiso directo **REGISTRAR_RETROACTIVOS_TRANSVERSALES** además de `REGISTRAR` o `REGISTRAR_RETROACTIVOS` (según ruta) |
| **Headers** | `idempotency-key` (string, requerido). Opcional **`ctx`**: código **numérico** de sede (mismo contrato que `GET /v4/media/preview/:id`). Sin `ctx` → sede del JWT. |

**Body — `CreateTanqueoRepositorioRequestDto`**

| Campo (raíz) | Req. | Tipo |
|--------------|------|------|
| `canalRegistro` | sí | `MOVIL` \| `WEB` |
| `tanqueo` | sí | `CreateTanqueoPayloadDto` |

**`tanqueo` — `CreateTanqueoPayloadDto`**

| Campo | Req. | Tipo |
|-------|------|------|
| `activoId` | sí | int ≥ 1 |
| `repositorioId` | sí | int ≥ 1 |
| `cantidadCombustible` | sí | number > 0 |
| `unidadMedidaCombustible` | sí | `GAL` \| `L` |
| `tipoCombustible` | sí | enum combustible |
| `evidencias` | sí | `EvidenciaItemDto[]` (≥ 1) |
| `fechaTanqueo` | no | string fecha (ver reglas abajo) |
| `kilometraje` | no | int 1…4294967295 |
| `observaciones` | no | string ≤ 1000 |
| `tipoRegistro` | no | `CONDUCTOR` \| `COORDINADOR` |
| `conductorRealOid` | no | int ≥ 1 |

**`fechaTanqueo` (repositorio):** opcional. Si omites `tipoRegistro`, se asume `CONDUCTOR`.

| `tipoRegistro` | Comportamiento de fecha |
|----------------|-------------------------|
| `CONDUCTOR` (default) | Se usa la fecha/hora del **servidor** al registrar. Cualquier `fechaTanqueo` enviado se **ignora**. |
| `COORDINADOR` | Se usa `fechaTanqueo` del body si viene; si no, fecha del servidor. **`conductorRealOid` es obligatorio** (400 si falta). |

**Registro en otra sede (header `ctx`):**

Códigos numéricos de sedes operativas (`REAL_SEDES`): **1** Aguachica, **2** Alta centro, **4** San Juan, **5** Valledupar.

| Situación | Header `ctx` | Permisos | Conductor | IDs de negocio |
|-----------|--------------|----------|-----------|----------------|
| Registro en la sede del JWT | **No enviar**. Si `ctx` = sede del JWT, **400**. | `REGISTRAR` o `REGISTRAR_RETROACTIVOS` | `conductorRealOid` (si aplica) debe existir en **GENUSUARIO de la sede del JWT**. Sin `conductorRealOid` en `CONDUCTOR`, el conductor implícito es el usuario autenticado. | `activoId`, `repositorioId` de la sede del JWT. |
| Registro transversal (otra sede) | **Obligatorio**, código numérico distinto al JWT. | `REGISTRAR` + **`REGISTRAR_RETROACTIVOS_TRANSVERSALES`** (flujo coordinador / retroactivo en otra sede) | **`tipoRegistro` = `COORDINADOR`** y **`conductorRealOid` obligatorio** en `tanqueo`; el usuario debe existir en la BD de la sede del `ctx`. | `activoId`, `repositorioId` de esa sede; la persistencia ocurre ahí. |

Errores habituales: **403** sin `REGISTRAR_RETROACTIVOS_TRANSVERSALES`; **400** `El conductor no pertenece a la sede del registro` si el OID del conductor no está en la sede efectiva; **400** si `ctx` es la misma sede que la sesión.

**Respuesta `data`:** `TanqueoRead`  
**`message`:** `"Tanqueo desde repositorio registrado"`

**Negocio (km):** referencia = última lectura **confiable** anterior a `fechaTanqueo` del ítem (`referenciaKmAntesDelTanqueo`). En este alta `tanqueoId` aún no existe: solo cuentan lecturas con `fechaLectura` **estrictamente anterior** a `fechaTanqueo`. Sin referencia confiable anterior → no se generan alertas `KM_MENOR_ANT` / `KM_SALTO` por comparación.

---

### `POST /sincronizar-lote`

| | |
|--|--|
| **Permiso** | `REGISTRAR` o `REGISTRAR_RETROACTIVOS` (mismas reglas de `ctx` / transversal que `POST /repositorio`) |
| **Header** | Opcional **`ctx`** (código numérico de sede), mismo contrato que media |
| **Idempotencia** | Ver tabla arriba |

**Body — `SincronizarLoteTanqueosDto`**

| Campo | Req. |
|-------|------|
| `idempotencyKey` | sí, ≤ 100 |
| `dispositivoId` | sí, ≤ 100 |
| `creadoOffline` | sí, boolean |
| `canalRegistro` | no | `WEB` \| `MOVIL`. Si se omite, el servidor usa **`WEB`** (cliente web actual). La app móvil debe enviar **`MOVIL`**. |
| `tanqueos` | sí, `TanqueoItemDto[]` |

**`TanqueoItemDto`**

| Campo | Req. | Regla / descripción |
|-------|------|---------------------|
| `clienteUuid` | sí, UUID | |
| `activoId` | sí, int ≥ 1 | |
| `valorTotalPagado` | sí, number > 0 | |
| `cantidadCombustible` | sí, number > 0 | |
| `unidadMedidaCombustible` | sí | `GAL` \| `L` |
| `tipoCombustible` | sí | |
| `estacionServicioId` | sí, int ≥ 1 | |
| `fechaTanqueo` | sí, string | Obligatorio en lote: la envía el **móvil** (no aplica la regla CONDUCTOR/COORDINADOR del repositorio web). |
| `fechaCreacionLocal` | sí, string | |
| `evidencias` | sí, `EvidenciaItemDto[]` | |
| `kilometraje` | no | Obligatorio en negocio si `odometroEstado === FUNCIONANDO` |
| `latitud` | no | number `[-90, 90]`. Ubicación **al guardar** el tanqueo. |
| `longitud` | no | number `[-180, 180]`. Ubicación **al guardar** el tanqueo. |
| `precisionMetros` | no | number `>= 0`. Precisión GPS de la ubicación final. |
| `fechaCapturaUbicacion` | condicional | string fecha ISO. **Obligatorio si vienen `latitud` y `longitud`** (las tres viajan completas o ausentes). |
| `ubicacionInicial` | no | `{ latitud: number [-90,90], longitud: number [-180,180], precisionMetros?: number >= 0, fechaCaptura: string ISO }` (captura al abrir el formulario). |
| `ubicacionNoDisponibleMotivo` | no | `PERMISO_DENEGADO` \| `GPS_DESACTIVADO` \| `TIMEOUT` \| `NO_SOPORTADO`. **Excluyente** con coordenadas finales (`latitud`, `longitud`, `fechaCapturaUbicacion`). |
| `gpsSimulado` | no | boolean. Solo apps nativas; la web no lo envía. Ausente = desconocido (NO "limpio"). |
| `observaciones` | no, ≤ 1000 | |
| `tipoRegistro`, `conductorRealOid` | no | |

**Validación de ubicación en el ítem:**
- Coordenadas finales completas (`latitud` + `longitud` + `fechaCapturaUbicacion`) o todas ausentes.
- `ubicacionNoDisponibleMotivo` es mutuamente excluyente con coordenadas finales.
- Un ítem con ubicación fuera del radio, imprecisa o ausente **NO se rechaza**: se registra normalmente (`estado: 'REGISTRADO'`) con su snapshot `validacionUbicacion` y, en modo `ACTIVE`, su inconsistencia `UBIC_*` (`ADVERTENCIA`). `RECHAZADO` (o 400 online) solo aplica a payloads inválidos (rangos fuera de límite o campos incompletos/excluyentes).

**Respuesta `data`:** `ResultadoItemSync[]` (un elemento por ítem del lote, en orden de procesamiento).

**Negocio (km en lote):** cada ítem valida su km **solo** contra la referencia confiable anterior a **su** `fechaTanqueo` (no contra el km de otro ítem del mismo lote). Tras guardar, cada ítem crea lectura de odómetro con `confiable` según plausibilidad vs esa referencia.

---

### `GET /config-ubicacion`

| | |
|--|--|
| **Permiso** | `REGISTRAR`, `REGISTRAR_RETROACTIVOS` o `VER` |
| **Nota** | Declarada **antes** de `GET /:id`. Solo lectura. |

**Respuesta `data` — `ConfigUbicacionTanqueoRead`:**

```json
{
  "modo": "ACTIVE",
  "radioMetros": 70
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `modo` | `'OFF' \| 'SHADOW' \| 'ACTIVE'` | Modo global de validación de ubicación (`GEO_VALIDACION_MODO`, default inicial `'ACTIVE'`). |
| `radioMetros` | `number` | Radio global en metros para todas las estaciones (`GEO_RADIO_M`, entero `20…2000`, default `70`). |

---

### `GET /`

| | |
|--|--|
| **Permiso** | `VER` (+ `VER_T_SEDES` para todas las sedes) |

**Query — `FilterTanqueoDto`:** `page`, `limit`, `activoId`, `usuarioId`, `estacionServicioId`, `tipoCombustible`, `estado`, `origen`, `fechaDesde`, `fechaHasta`, `tieneAlertas`, `placa` (≤ 20), `tipoActivo`, `resultadoUbicacion` (`ResultadoValidacionUbicacion`).

**Respuesta:** `TanqueoRead[]` + `metadata` paginación.

**Nota:** `inconsistencias[]` viene del mapper de listado **sin** `correccion` anidado (ese enriquecimiento es solo en detalle).

---

### `GET /resumen`

Mismos filtros que listado (sin paginación). **Respuesta `data`:** `ResumenTanqueosRead`.

---

### `GET /intentos`

| | |
|--|--|
| **Permiso** | `GESTIONAR_INTENTOS` |

**Query:** `page`, `limit`. **Respuesta:** `TanqueoIntentoRead[]` (solo `estado === PENDIENTE`) + `metadata`.

**Campo `payload`:** string JSON producido por `sanitizeIntentoPayload` al persistir el intento. Valores sensibles se sustituyen por el literal **`[REDACTED]`** (claves que coinciden con patrones tipo `token`, `password`, `authorization`, etc., y subcadenas `Bearer …` / JWT en strings). Referencias circulares → `[Circular]`. El front puede hacer `JSON.parse(payload)` para inspección; no asumir que el JSON replica el body original byte a byte.

---

### `PATCH /intentos/:intentoId/recuperar`

| | |
|--|--|
| **Permiso** | `GESTIONAR_INTENTOS` |

**Body — `ResolverIntentoDto`:** `tanqueoId` int ≥ 1 (requerido; 400 si falta).

**Respuesta `data`:** `TanqueoIntentoRead` (`estado: RECUPERADO`).

**Negocio:** si el `clienteUuid` del intento ya está en otro tanqueo → conflicto.

---

### `DELETE /intentos/pendientes`

| | |
|--|--|
| **Permiso** | `GESTIONAR_INTENTOS` |

**Body — `LimpiarIntentosPendientesDto`:** `observacion` opcional ≤ 500.

**Respuesta `data`:** `{ eliminados: number }`. **`message`:** `"Intentos pendientes eliminados"`.  
Solo una ejecución exitosa por mes calendario (control por log de eventos).

---

### `POST /lecturas-odometro`

| | |
|--|--|
| **Permiso** | `VEHICULOS.GESTIONAR` |

**Body — `AjustarOdometroDto`**

| Campo | Req. |
|-------|------|
| `activoId` | sí, int ≥ 1 |
| `lectura` | sí, int ≥ 0 |
| `fechaLectura` | sí, string | 
| `observacion` | sí, ≤ 500 |
| `referenciaId` | no, int ≥ 1 |

Las lecturas registradas por este endpoint se persisten siempre como **confiables** (`confiable: true`); no se envía en el body.

**Respuesta `data`:** `{ id: number, lectura: number }` (no es `LecturaOdometroRead` completo).

---

### `GET /:id`

| | |
|--|--|
| **Permiso** | `VER` |
| **Transversal** | Header opcional **`ctx`**; si es otra sede → permiso directo **`VER_T_SEDES`** |

**Respuesta `data`:** `TanqueoDetalleRead` (ver [referencia de lectura](#referencia-de-modelos-de-lectura)).

- `inconsistencias[]`: listado completo de alertas del tanqueo (abiertas y cerradas); no hay endpoint de bandeja aparte.
- `inconsistencias[].correccion`: objeto `TanqueoCorreccionLigadaRead` o `null` si no hay fila de corrección ligada en BD.
- `correcciones[]` e `historialEvidencias[]` solo en este shape (no en `TanqueoRead` plano de listado).

---

### `PATCH /:id/inconsistencias/:inconsistenciaId/resolver`

| | |
|--|--|
| **Permiso** | `RESOLVER` |
| **Transversal** | Header opcional **`ctx`**; si es otra sede → permiso directo **`RESOLVER_TRANSVERSAL`** |

**Body — `ResolveInconsistenciaDto`**

| Campo | Req. |
|-------|------|
| `contactoRealizado` | sí, boolean |
| `resultado` | sí, `JUSTIFICADA` \| `FALSO_POSITIVO` |
| `notaResolucion` | DTO opcional; **obligatoria en negocio** para ambos resultados |
| `notaContacto` | no, ≤ 500 |

**Respuesta `data`:** `TanqueoInconsistenciaRead` / `TanqueoGestionSnapshotRead`.  
**`message`:** `"Inconsistencia gestionada exitosamente"`

**Negocio:** el `:inconsistenciaId` debe pertenecer al tanqueo `:id` (si no → **400**). `CORREGIDA` en este endpoint → **400** (se cierra automáticamente al corregir el tanqueo). Funciona sin cambios con los nuevos códigos `UBIC_FUERA_RAD`, `UBIC_DISCREP` y `UBIC_NO_CONC`.

---

### `PATCH /:id/corregir`

| | |
|--|--|
| **Permiso** | `RESOLVER` |
| **Transversal** | Header opcional **`ctx`** → **`RESOLVER_TRANSVERSAL`** si otra sede |

**Body — `CorregirTanqueoDto`**

| Campo | Req. |
|-------|------|
| `motivo` | sí, string 10…500 |
| `cambios` | sí, objeto con **al menos un** campo definido |

**`cambios` — `CorregirTanqueoCambiosDto` (todos opcionales a nivel DTO; negocio exige ≥ 1 presente)**

| Campo | Tipo |
|-------|------|
| `kilometraje` | int 1…4294967295 |
| `cantidadCombustible` | number > 0 |
| `unidadMedidaCombustible` | `GAL` \| `L` |
| `valorTotalPagado` | number > 0 |
| `estacionServicioId` | int ≥ 1 |
| `fechaTanqueo` | string |
| `observaciones` | string ≤ 1000 o `null` |

**No existe** `inconsistenciaIds` en el body: el cierre de alertas de datos y ubicación es **automático** tras guardar correcciones.

**Respuesta `data`:** `TanqueoDetalleRead` (mismo shape que `GET /:id`).  
**`message`:** `"Tanqueo corregido"`

**Negocio**

- Tras persistir correcciones, se **re-evalúan** alertas de datos (`KM_*`, `CANT_COMB_CAP`, `VALOR_ALTO_INU`, `TQ_DUP` según campos tocados).
- Si cambia `estacionServicioId`, se **re-evalúan** las alertas `UBIC_*` usando las **coordenadas guardadas del tanqueo** (nunca coordenadas nuevas) y el **radio global actual** (`GEO_RADIO_M`), actualizando el snapshot `validacionUbicacion`. Si la nueva estación deja la ubicación dentro del radio (o ya no aplica la alerta previa), la alerta abierta se cierra automáticamente con `estado: CERRADA`, `resultado: CORREGIDA` y vínculo a la fila de corrección `ESTACIONOID`. Los tanqueos antiguos sin datos de ubicación guardados omiten esta re-evaluación.
- Alertas abiertas que ya no aplican → `estado: CERRADA`, `resultado: CORREGIDA`, vínculo `correcciones[].inconsistenciaId` y `inconsistencias[].correccion` en el detalle.
- `notaResolucion` en cierre automático describe que el usuario **no** cerró la alerta manualmente (texto persistido en mayúsculas por normalización del dominio).
- Km corregido usa `referenciaKmAntesDelTanqueo` (misma regla que registro/lote).

**Valores de `correcciones[].campo` en BD:** `KILOMETRAJE`, `CANTCOMBUST`, `VALORPAGADO`, `ESTACIONOID`, `FECHTANQUEO`, `OBSERVACIONES`, `ORIGEN`, `REPOSITORIOOID` (según qué se haya cambiado).

---

### `PATCH /:id/anular`

| | |
|--|--|
| **Permiso** | `RESOLVER` |
| **Transversal** | **`RESOLVER_TRANSVERSAL`** con `ctx` en otra sede |

**Body — `AnularTanqueoDto`:** `motivoAnulacion` string obligatorio, no solo espacios, longitud máxima **500** (sin mínimo de caracteres en validación HTTP; el dominio exige motivo no vacío).

**Respuesta `data`:** `TanqueoRead` / `TanqueoGestionSnapshotRead`. **`message`:** `"Tanqueo anulado"`

---

## Evidencias del tanqueo (imágenes / archivos post-registro)

Prefijo: `/v4/inn/vehiculos/tanqueos/:id`

Todas exigen permiso **`RESOLVER`** (+ **`RESOLVER_TRANSVERSAL`** con header `ctx` en otra sede).  
Para `historialEvidencias` y `correcciones[]` usar `GET /:id` (detalle).

El parámetro de ruta `:tipo` debe ser un literal de `TipoEvidencia` (enum en path).

### `POST /:id/evidencias` — agregar o reemplazar captura

| Campo body (`TanqueoEvidenciaDto`) | Req. |
|-----------------------------------|------|
| `tipo` | sí, `TipoEvidencia` |
| `mediaId` | sí, int ≥ 1 |
| `motivo` | no, ≤ 500 |

### `DELETE /:id/evidencias/:tipo` — quitar evidencia capturada

**Body — `EliminarTanqueoEvidenciaDto`** (`motivo`: string ≤ 500, requerido).

### `POST /:id/evidencias/:tipo/reasignar` — mover archivo a otro tipo

**Body — `ReasignarTanqueoEvidenciaDto`** (`tipoDestino`: `TipoEvidencia`, `motivo`: string ≤ 500).

### `PATCH /:id/evidencias/orden` — orden de presentación

**Body — `OrdenTanqueoEvidenciasDto`** (`tipos`: `TipoEvidencia[]`).

---

## 2. Vehículos — `/v4/inn/vehiculos`

| Método | Ruta | Permiso | Respuesta `data` |
|--------|------|---------|------------------|
| `POST` | `/` | `VEHICULOS.GESTIONAR` | `VehiculoRead` |
| `GET` | `/` | `VEHICULOS.VER` | `VehiculoRead[]` + metadata |
| `GET` | `/:id` | `VEHICULOS.VER` | `VehiculoRead` |
| `GET` | `/:id/lecturas-odometro` | `VEHICULOS.VER` | `LecturaOdometroRead[]` + metadata |
| `PATCH` | `/:id` | `VEHICULOS.GESTIONAR` | `VehiculoRead` |
| `PATCH` | `/:id/odometro-estado` | `VEHICULOS.GESTIONAR` | `VehiculoRead` |

Filtros listado: `FilterVehiculoDto` — `page`, `limit`, `search`, `estado`, `tipoActivo`.  
Bodies create/update: ver `presentation/dto/vehiculo.dto.ts`.

---

## 3. Estaciones — `/v4/inn/estacioneser`

| Método | Ruta | Permiso | Respuesta |
|--------|------|---------|-----------|
| `GET` | `/` | `ESTACIONES.VER` | `EstacionServicioRead[]` + metadata |
| `POST` | `/` | `ESTACIONES.GESTIONAR` | `EstacionServicioRead` |
| `PATCH` | `/:id` | `ESTACIONES.GESTIONAR` | `EstacionServicioRead` (`message: "Estación de servicio actualizada"`) |

Query listado (`FilterEstacionServicioDto`): `page`, `limit`, `search`, `municipioId`, `activa` (bool), `sinUbicacion` (bool: `true` filtra estaciones sin coordenadas `UBICLATITUD IS NULL OR UBICLONGITUD IS NULL`).

Body `POST` / `PATCH` (`CreateEstacionServicioDto` / `UpdateEstacionServicioDto`): `nombre`, `direccion`, `nit`, `observaciones`, `municipioId`, y coordenadas como `latitud` (`[-90,90]`), `longitud` (`[-180,180]`), `precisionMetros` (`>= 0`) o objeto `ubicacion: { latitud, longitud, precisionMetros? }`. Ningún campo de radio existe en estaciones (el radio es global).

---

## 4. Repositorios — `/v4/inn/vehiculos/repositorios-combustible`

| Método | Ruta | Permiso | Respuesta `data` |
|--------|------|---------|------------------|
| `GET` | `/` | `REPOSITORIOS.VER` | `RepositorioCombustibleRead[]` |
| `POST` | `/` | `REPOSITORIOS.CREAR` | `RepositorioCombustibleRead` |
| `POST` | `/:id/entradas` | `REPOSITORIOS.RECARGAR` | `AbastecimientoRead` |
| `GET` | `/:id/entradas` | `REPOSITORIOS.VER` | `AbastecimientoRead[]` |
| `GET` | `/:id/movimientos` | `REPOSITORIOS.VER` | `MovimientoCombustibleRead[]` |

Body entrada: `CreateEntradaRepositorioDto` (mismo patrón de evidencias que tanqueo).

---

## 5. Abastecimientos — `/v4/inn/vehiculos/abastecimientos`

### `PATCH /:id/anular`

| | |
|--|--|
| **Permiso** | `RESOLVER` |
| **Body** | `AnularTanqueoDto` — `motivoAnulacion` entre **10 y 500** caracteres (validado en servicio tras trim) |
| **Respuesta** | `AbastecimientoRead` |

---

### Evidencias de abastecimiento (mismos DTO que tanqueo)

Prefijo: `/v4/inn/vehiculos/abastecimientos/:id`  
Permiso: **`RESOLVER`** en todas.

| Método | Ruta | Body | Respuesta `data` |
|--------|------|------|------------------|
| `POST` | `/evidencias` | `TanqueoEvidenciaDto` | `AbastecimientoRead` \| `null` |
| `PATCH` | `/evidencias/orden` | `OrdenTanqueoEvidenciasDto` | `AbastecimientoRead` \| `null` |
| `DELETE` | `/evidencias/:tipo` | `EliminarTanqueoEvidenciaDto` | `AbastecimientoRead` \| `null` |
| `POST` | `/evidencias/:tipo/reasignar` | `ReasignarTanqueoEvidenciaDto` | `AbastecimientoRead` \| `null` |

---

# Referencia de modelos de lectura

Tipos definidos en `domain/reads/`. Campos listados en el **mismo orden conceptual** que el TypeScript; tipos `Date` se serializan como ISO en JSON.

## `UsuarioRefRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `nombreCompleto` | string |

## `VehiculoModeloRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `nombre` | string |
| `marcaId` | number \| null |
| `marcaNombre` | string \| null |

## `VehiculoRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `placa` | string |
| `modeloId` | number \| null |
| `modeloNombre` | string \| null |
| `modelo` | `VehiculoModeloRead` \| null |
| `estado` | `EstadoVehiculo` |
| `tipoActivo` | `TipoActivo` |
| `tipoCombustible` | `TipoCombustible` |
| `capacidadAlmacenamientoCombustible` | number \| null |
| `unidadMedidaCapacidad` | `UnidadMedidaCombustible` |
| `anioModelo` | number \| null |
| `clasificacionUso` | `ClasificacionUso` \| null |
| `kilometrajeActual` | number \| null | **Deprecado.** Fecha de retiro prevista: *pendiente de definir*. No usar en código nuevo del front; preferir `kilometrajeReferencia` + `fechaReferencia` + `referenciaConfiable`. |
| `kilometrajeReferencia` | number \| null |
| `fechaReferencia` | string \| null |
| `referenciaConfiable` | boolean |
| `odometroEstado` | `EstadoOdometro` |
| `createdAt` | Date |
| `updatedAt` | Date |

## `EstacionServicioRead`

**No cambia de forma.** `ubicacion` mantiene exactamente su estructura actual:

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | |
| `nombre` | string | |
| `direccion` | string | |
| `nit` | string \| null | |
| `observaciones` | string \| null | |
| `municipio` | `{ id: number, nombre: string, departamentoNombre: string } \| null` | |
| `ubicacion` | `{ latitud: number \| null, longitud: number \| null, precisionMetros: number \| null } \| null` | Forma real normalizada por `EstacionServicioMapper.normalizeRead`. Cuando la estación no tiene coordenadas en BD, TypeORM hidrata el embeddable con `{ latitud: null, longitud: null, precisionMetros: null }`. |
| `activa` | boolean | |
| `creadaPorUsuario` | `{ id: number, contexto: string \| null } \| null` | |
| `createdAt` | Date | |
| `updatedAt` | Date | |

## `ValidacionUbicacionTanqueoRead`

Expuesto en `TanqueoRead.validacionUbicacion` (`null` si el registro es previo a la funcionalidad o si se registró con `GEO_VALIDACION_MODO = OFF`).

| Campo | Tipo |
|-------|------|
| `resultado` | `ResultadoValidacionUbicacion` (`DENTRO_RADIO` \| `FUERA_RADIO` \| `DISCREPANCIA` \| `NO_CONCLUYENTE` \| `NO_VALIDADO`) |
| `distanciaMetros` | number \| null |
| `distanciaInicialMetros` | number \| null |
| `radioAplicadoMetros` | number \| null |
| `precisionMetros` | number \| null |
| `latitud` | number \| null |
| `longitud` | number \| null |
| `fechaCaptura` | Date \| null |
| `ubicacionInicial` | `{ latitud: number, longitud: number, precisionMetros: number \| null, fechaCaptura: Date \| null } \| null` |
| `motivoNoDisponible` | string \| null |
| `fechaValidacion` | Date \| null |

## `EvidenciaTanqueoRead`

| Campo | Tipo |
|-------|------|
| `tipo` | `TipoEvidencia` |
| `estado` | `EstadoEvidencia` |
| `mediaId` | number \| null \| undefined |
| `motivoOmision` | string \| null \| undefined |
| `fecha` | Date \| undefined |

## `TanqueoCorreccionLigadaRead`

Solo en `inconsistencias[]` dentro de **`TanqueoDetalleRead`**.

| Campo | Tipo |
|-------|------|
| `id` | number |
| `campo` | string |
| `motivo` | string |
| `fecha` | Date |
| `usuarioId` | number |

## `TanqueoInconsistenciaRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `tanqueoId` | number |
| `codigo` | `CodigoInconsistencia` |
| `campo` | string \| null |
| `severidad` | `SeveridadInconsistencia` |
| `estado` | `EstadoInconsistencia` |
| `resultado` | `ResultadoInconsistencia` \| null |
| `fechaDeteccion` | Date |
| `resueltoPorUsuarioId` | number \| null |
| `resueltoPorNombre` | string \| null |
| `fechaResolucion` | Date \| null |
| `contactoRealizado` | boolean |
| `notaContacto` | string \| null |
| `notaResolucion` | string \| null |
| `correccion` | `TanqueoCorreccionLigadaRead` \| null \| undefined | solo enriquecido en **detalle** de tanqueo |

## `TanqueoRead`

| Campo | Tipo |
|-------|------|
| `ctx` | number \| undefined | Código numérico de sede del registro (multisede / respuestas con override) |
| `id` | number |
| `codigo` | string |
| `clienteUuid` | string |
| `activo` | `VehiculoRead` \| null |
| `origen` | `OrigenTanqueo` |
| `repositorioId` | number \| null |
| `repositorioNombre` | string \| null |
| `abastecimientoId` | number \| null |
| `abastecimientoCodigo` | string \| null |
| `usuarioId` | number |
| `usuarioNombre` | string |
| `tipoRegistro` | `TipoRegistro` |
| `canalRegistro` | `CanalRegistro` |
| `conductorRealId` | number \| null |
| `kilometraje` | number \| null |
| `kilometrosRecorridos` | number \| null |
| `valorTotalPagado` | number \| null |
| `cantidadCombustible` | number \| null |
| `unidadMedidaCombustible` | string \| null |
| `rendimiento` | number \| null |
| `tipoCombustible` | `TipoCombustible` |
| `estacionServicio` | `EstacionServicioRead` \| null |
| `fechaTanqueo` | Date |
| `latitud` | number \| null |
| `longitud` | number \| null |
| `precisionMetros` | number \| null |
| `validacionUbicacion` | `ValidacionUbicacionTanqueoRead` \| null |
| `observaciones` | string \| null |
| `estado` | `EstadoTanqueo` |
| `evidencias` | `EvidenciaTanqueoRead[]` |
| `evidenciasCompletas` | boolean |
| `creadoOffline` | boolean |
| `fechaCreacionLocal` | Date \| null |
| `dispositivoId` | string \| null |
| `fechaSincronizacion` | Date \| null |
| `cantidadInconsistencias` | number |
| `cantidadInconsistenciasActivas` | number |
| `tieneAlertas` | boolean |
| `inconsistencias` | `TanqueoInconsistenciaRead[]` |
| `decididoPorUsuarioId` | number \| null |
| `decididoPorNombre` | string \| null |
| `decididoPor` | `UsuarioRefRead` \| null |
| `fechaDecision` | Date \| null |
| `motivoDecision` | string \| null |
| `aprobacionConOverride` | boolean |
| `anuladoPorId` | number \| null |
| `fechaAnulacion` | Date \| null |
| `motivoAnulacion` | string \| null |
| `createdAt` | Date |
| `updatedAt` | Date |

## `TanqueoCorreccionDetalleRead`

Solo en **`TanqueoDetalleRead.correcciones`**.

| Campo | Tipo |
|-------|------|
| `id` | number |
| `campo` | string |
| `valorAnterior` | string \| null |
| `valorNuevo` | string \| null |
| `motivo` | string |
| `inconsistenciaId` | number \| null |
| `usuarioId` | number |
| `createdAt` | Date |

## `TanqueoHistorialEvidenciaRead`

Solo en **`TanqueoDetalleRead.historialEvidencias`**.

| Campo | Tipo |
|-------|------|
| `id` | number |
| `tipoEvidencia` | `TipoEvidencia` |
| `accion` | `AccionEvidenciaLog` |
| `mediaAnteriorId` | number \| null |
| `mediaNuevoId` | number \| null |
| `tipoDestino` | string \| null |
| `motivo` | string \| null |
| `usuarioId` | number |
| `createdAt` | Date |

## `TanqueoDetalleRead`

Extiende **`TanqueoRead`** (todos los campos anteriores) más:

| Campo | Tipo |
|-------|------|
| `correcciones` | `TanqueoCorreccionDetalleRead[]` |
| `historialEvidencias` | `TanqueoHistorialEvidenciaRead[]` |

En detalle, cada `inconsistencias[i].correccion` se rellena cuando existe corrección con `inconsistenciaId` apuntando a esa alerta.

## `ResultadoItemSync`

| Variante | Campos |
|----------|--------|
| Común | `clienteUuid`: string |
| `estado: 'REGISTRADO'` | `tanqueo`: `TanqueoRead` |
| `estado: 'DUPLICADO'` | `codigo`: string (código del tanqueo existente; puede ser `""` si duplicado solo dentro del lote) |
| `estado: 'RECHAZADO'` | `motivo`: string |

## `ResumenTanqueosRead`

| Campo | Tipo |
|-------|------|
| `totalFiltrado` | number |
| `totalValorPagado` | number |
| `totalCantidadCombustible` | number |
| `promedioRendimiento` | number |
| `porEstado` | `Record<EstadoTanqueo, number>` |
| `porTipoCombustible` | `Record<string, number>` |
| `costoPromedioPorKm` | number \| null |
| `consumoVehiculos.mayorConsumo` | `{ vehiculoId, placa?, rendimiento }` \| null |
| `consumoVehiculos.menorConsumo` | idem |
| `combustibleComprado.masComprado` | `{ tipoCombustible, galones }` \| null |
| `combustibleComprado.menosComprado` | idem |
| `gastoVehiculos.mayorGasto` | `{ vehiculoId, placa?, totalGastado }` \| null |
| `gastoVehiculos.menorGasto` | idem |

## `TanqueoIntentoRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `clienteUuid` | string \| null |
| `idempotencyKey` | string \| null |
| `usuarioId` | number |
| `dispositivoId` | string \| null |
| `canalRegistro` | `CanalRegistro` \| null |
| `operacion` | string |
| `payload` | string | JSON sanitizado (ver `GET /intentos`) |
| `errorCodigo` | string \| null |
| `errorMensaje` | string \| null |
| `estado` | `EstadoIntentoTanqueo` |
| `tanqueoId` | number \| null |
| `resueltoPorId` | number \| null |
| `fechaResolucion` | Date \| null |
| `fechaIntento` | Date |
| `createdAt` | Date |

## `LecturaOdometroRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `activoId` | number |
| `lectura` | number |
| `fechaLectura` | Date |
| `fuente` | `FuenteLecturaOdometro` |
| `referenciaId` | number \| null |
| `confiable` | boolean |
| `usuarioId` | number |
| `usuarioNombre` | string \| undefined |
| `observacion` | string \| null |
| `createdAt` | Date |

## `RepositorioCombustibleRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `nombre` | string |
| `tipoCombustible` | `TipoCombustible` |
| `unidadMedidaCombustible` | `UnidadMedidaCombustible` |
| `capacidad` | number |
| `stockActual` | number |
| `activo` | boolean |
| `createdAt` | Date |
| `updatedAt` | Date |

## `AbastecimientoRead`

| Campo | Tipo |
|-------|------|
| `id` | number |
| `codigo` | string |
| `estacionServicioId` | number |
| `usuarioId` | number |
| `valorTotalPagado` | number |
| `cantidadCombustible` | number \| null |
| `unidadMedidaCombustible` | `UnidadMedidaCombustible` \| null |
| `tipoCombustible` | `TipoCombustible` |
| `fechaAbastecimiento` | Date |
| `tanqueoId` | number \| null |
| `repositorioId` | number \| null |
| `estado` | `EstadoAbastecimiento` |
| `evidenciasCompletas` | boolean |
| `evidencias` | `EvidenciaTanqueoRead[]` |
| `createdAt` | Date |
| `updatedAt` | Date |

## `MovimientoTanqueoRefRead` / `MovimientoAbastecimientoRefRead` / `MovimientoCombustibleRead`

Ver `domain/reads/repositorio-combustible-read.ts` para la forma exacta de referencias anidadas en movimientos de stock.

---

# Reglas de negocio que el front debe anticipar

1. **Odómetro dañado (`DANADO`):** en estación/lote el km puede omitirse; no hay lectura de odómetro ni alertas km por comparación.
2. **Odómetro funcionando:** km obligatorio en validación de estación/lote. Referencia = lectura con `confiable === true` más reciente que sea **anterior** al tanqueo: primero `fechaLectura` &lt; `fechaTanqueo`; si hay `tanqueoId` (lote guardado, corrección, etc.), a **igual** `fechaLectura` también cuentan lecturas no `TANQUEO`, y lecturas `TANQUEO` solo si `referenciaId` &lt; `tanqueoId`. Entre candidatas: `ORDER BY fechaLectura DESC`, luego **`id` de la lectura (OID) DESC**. Registro repositorio sin `tanqueoId`: solo `fechaLectura` estrictamente menor.
3. **Lote:** dos ítems del mismo activo **no** se comparan entre sí en km; solo contra su referencia temporal.
4. **Corregir tanqueo:** sin lista de ids de inconsistencias; cierre `CORREGIDA` automático + vínculo en `correcciones[].inconsistenciaId` / `inconsistencias[].correccion`.
5. **Resolver inconsistencia manual:** `PATCH /tanqueos/:id/inconsistencias/:inconsistenciaId/resolver` — solo `JUSTIFICADA` o `FALSO_POSITIVO` con notas; nunca `CORREGIDA`. Listado en `GET /tanqueos/:id`.
6. **Registro transversal:** header `ctx` + `REGISTRAR_RETROACTIVOS_TRANSVERSALES` al registrar en sede distinta al JWT.
7. **Validación de ubicación (estación vs radio global):**
   - **Configuración global:** `GEO_VALIDACION_MODO` (`OFF` \| `SHADOW` \| `ACTIVE`, default inicial `ACTIVE`), `GEO_RADIO_M=70` (entero `20…2000`), `GEO_PRECISION_MAX_M=100`, `GEO_EDAD_MAX_CAPTURA_MIN=5`, `GEO_DURACION_MAX_FORM_MIN=60`, `GEO_VELOCIDAD_MAX_KMH=150`, `GEO_DISCREPANCIA_MIN_MIN=0`.
   - **Alcance:** solo se evalúa cuando `modo != OFF`, `origen === ESTACION` y `tipoRegistro === CONDUCTOR` (sin importar `canalRegistro`). Si `tipoRegistro === COORDINADOR` o `origen === REPOSITORIO` → `resultado = NO_VALIDADO`, sin alerta.
   - **Modos:**
     - `OFF`: no se calcula ni persiste `validacionUbicacion` (`null`).
     - `SHADOW`: calcula y persiste el snapshot inmutable (`validacionUbicacion`), pero **no** crea inconsistencias `UBIC_*`.
     - `ACTIVE`: persiste el snapshot y crea la inconsistencia `UBIC_*` (`ADVERTENCIA`) cuando aplica.
   - **Regla por captura** ($d$ = distancia Haversine a la estación con $R_{\text{Tierra}} = 6.371.000\text{ m}$, $p$ = `precisionMetros ?? 0`, $R$ = `GEO_RADIO_M`):
     - $p > \text{GEO\_PRECISION\_MAX\_M} \rightarrow \text{NO\_CONCLUYENTE}$
     - $(d - p) > R \rightarrow \text{FUERA}$
     - en otro caso $\rightarrow \text{DENTRO}$
   - **Resultado y código de inconsistencia:**
     - Estación sin coordenadas → `NO_CONCLUYENTE`, **sin** inconsistencia (dato maestro pendiente).
     - Captura final ausente, `gpsSimulado === true`, `|fechaCapturaUbicacion - fechaTanqueo| > GEO_EDAD_MAX_CAPTURA_MIN`, fecha de captura futura respecto al servidor (> 5 min), o precisión final > `GEO_PRECISION_MAX_M` → `NO_CONCLUYENTE` + `UBIC_NO_CONC`.
     - Captura inicial inutilizable (posterior a la final o más antigua que `GEO_DURACION_MAX_FORM_MIN` respecto a la final) → se ignora; si es utilizable pero la velocidad implícita entre captura inicial y final supera `GEO_VELOCIDAD_MAX_KMH` → `NO_CONCLUYENTE` + `UBIC_NO_CONC`.
     - Final `FUERA` → `FUERA_RADIO` + `UBIC_FUERA_RAD`.
     - Final `DENTRO` e inicial `FUERA` (con tiempo entre capturas $\ge$ `GEO_DISCREPANCIA_MIN_MIN`) → `DISCREPANCIA` + `UBIC_DISCREP`.
     - Final `DENTRO` e inicial `DENTRO` (o ausente/ignorada) → `DENTRO_RADIO`, sin inconsistencia.

---

*Actualizar este archivo cuando cambien DTOs, reads o controladores del módulo `vehiculos`.*
