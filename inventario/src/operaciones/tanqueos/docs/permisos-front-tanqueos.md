# Tanqueos — permisos y UX (instrucciones para el front)

Fuente de verdad: array **`onlyCodes`** del login (mismos strings que `INN_AUTHORITIES.GESTION_TANQUEOS` en backend).  
Helper sugerido: `hasCode('006013004')` o constantes compartidas con el back.

Códigos tanqueos (`006013` + sufijo):

| Constante | Código |
|-----------|--------|
| REGISTRAR | `006013001` |
| VER | `006013002` |
| RESOLVER | `006013003` |
| **VER_T_SEDES** | **`006013004`** |
| REGISTRAR_RETROACTIVOS | `006013015` |
| REGISTRAR_RETROACTIVOS_TRANSVERSALES | `006013017` |
| RESOLVER_TRANSVERSAL | `006013014` |
| GESTIONAR_INTENTOS | `006013016` |
| VEHICULOS.GESTIONAR | `006013008` |

---

## Reglas obligatorias de UI (permisos)

Copiar tal cual en criterios de aceptación.

### 1. Columna / etiqueta **sede** (lista y modal de tanqueos)

```ts
const puedeVerTodasLasSedes = hasCode('006013004'); // VER_T_SEDES
```

| Condición | Qué hacer |
|-----------|-----------|
| `!puedeVerTodasLasSedes` | **No** mostrar columna sede, chip sede, ni texto sede en modal/detalle. Ignorar `sede` en usuarios y `ctx` en tanqueos aunque venga en JSON (el back ya no envía `ctx` sin este permiso). |
| `puedeVerTodasLasSedes` | Mostrar sede solo en modo **todas las sedes** o cuando el registro trae `ctx` / sede de otra sede. |

**Error común:** mostrar sede porque el API alguna vez devolvió el campo. Sin `VER_T_SEDES` el front **no debe pintarlo**.

---

### 2. Botón verde (registro / sync **retroactivo**)

Identificar en UI el botón que abre sync lote o flujo retroactivo (FAB verde).

```ts
const puedeRetroactivos = hasCode('006013015'); // REGISTRAR_RETROACTIVOS
// Gate del endpoint sync: REGISTRAR (001) O REGISTRAR_RETROACTIVOS (015)
const puedeRegistrar = hasCode('006013001');
const mostrarBotonVerde = puedeRetroactivos || puedeRegistrar; // si el verde es SOLO retroactivo → solo 015
```

| Condición | Qué hacer |
|-----------|-----------|
| `!puedeRetroactivos` **y** el verde es exclusivo de retroactivos | **Ocultar** el botón verde. |
| Solo `REGISTRAR` sin `015` | Registro normal / repositorio sí; **no** sync retroactivo offline. |

Aclaración con back: `POST …/sincronizar-lote` exige `@Authorities([REGISTRAR, REGISTRAR_RETROACTIVOS])` (OR). El botón que solo sincroniza retroactivos debe exigir **`006013015`**.

---

### 3. Formulario retroactivo — selector de **sede** y usuarios

```ts
const puedeTransversalRetro = hasCode('006013017'); // REGISTRAR_RETROACTIVOS_TRANSVERSALES
```

| Condición | Qué hacer |
|-----------|-----------|
| `!puedeTransversalRetro` | En el formulario retroactivo: **sin** dropdown/picker de sede. Registro solo en sede del token. |
| `!puedeTransversalRetro` | `GET /v4/inn/identity/usuarios`: **nunca** enviar header `ctx`. |
| `puedeTransversalRetro` | Mostrar selector de sede solo si el registro es en **otra** sede (no la del token). Al elegir otra sede: header `ctx` en usuarios, media y `POST …/sincronizar-lote` / repositorio según contrato. |

**Error común:** mandar `ctx` en búsqueda de usuarios sin tener `017` → **403**.

---

### 4. Icono **odómetro** en catálogo de activos

```ts
const puedeGestionarVehiculos = hasCode('006013008'); // VEHICULOS.GESTIONAR
```

| Condición | Qué hacer |
|-----------|-----------|
| `!puedeGestionarVehiculos` | No mostrar icono/acción de odómetro. |
| `tipoActivo === 'MAQUINA'` | **No** mostrar icono de odómetro (regla de dominio: odómetro aplica a vehículos, no máquinas), aunque tenga `008`. |
| `tipoActivo === 'VEHICULO'` y `puedeGestionarVehiculos` | Puede mostrar icono (ajuste estado: `PATCH …/vehiculos/:id/odometro-estado`; ajuste lectura: `POST …/tanqueos/lecturas-odometro` también exige `008`). |

---

## Header `ctx` — resumen para permisos

| Permiso | ¿Puede enviar `ctx`? |
|---------|------------------------|
| Sin `004` | **No** en consultas ni confiar en `ctx` en respuestas. |
| Sin `017` | **No** en **registros** retroactivos / repositorio / sync. |
| Sin `014` | **No** en gestión (evidencias, resolver, anular) de otra sede. |
| `ctx` = sede del token | **No enviar** (400). |

---

## Precedencias rápidas

1. Sin `VER` (`002`) → no hay pantalla de listado.
2. Con `VER` sin `004` → solo sede del JWT; sin UI multi-sede.
3. Con `VER` + `004` → toggle “todas las sedes”; `004` gana para vista agregada.
4. Permisos transversales (`014`, `017`) son **directos** en `onlyCodes`; el rol genérico no alcanza.

---

## UX obligatorio (todo el módulo tanqueos)

Aplica a **estación**, **retroactivo**, **repositorio**, **detalle**, **gestión** (evidencias, resolver, corregir, anular), **sync lote**, modales y drawers.

### 5. Selector de **vehículo** (tanqueo por estación o retroactivo)

En el picker/autocomplete de activo **solo** deben listarse **vehículos**, no máquinas.

| Qué hacer | Detalle |
|-----------|---------|
| Filtrar en API | `GET /v4/inn/vehiculos?tipoActivo=VEHICULO` (+ `search`, paginación). |
| Filtrar en cliente | Si la lista ya está cargada: `item.tipoActivo === 'VEHICULO'`. No confiar solo en el label. |
| No mostrar | `tipoActivo === 'MAQUINA'` en este flujo (el catálogo general sí puede listar ambos). |

Dominio: el tanqueo por estación/retroactivo está pensado para **vehículos** (km, odómetro, rendimiento). Las máquinas se gestian en catálogo, no aquí.

---

### 6. Botones **Guardar**, **Cancelar** y acciones que disparan API

Mientras la petición (o cierre con persistencia) está en curso:

| Regla | Implementación |
|-------|----------------|
| Loading visible | Spinner o texto “Guardando…” / “Procesando…” **en el mismo botón** pulsado (o en el primario si hay par guardar/cancelar y solo guardar llama API). |
| Desactivar | `disabled` en **Guardar** y **Cancelar** del mismo formulario/modal (y FAB si aplica) hasta terminar éxito o error. |
| Evitar doble envío | No permitir segundo click en guardar (idempotency en back no sustituye feedback en UI). |
| Error | Al fallar: quitar loading, reactivar botones, mostrar mensaje; no dejar el botón colgado en loading. |
| Cancelar sin API | Si cancelar solo cierra el modal, loading opcional breve; si cancelar dispara anulación/API, misma regla que guardar. |

**Alcance:** todos los formularios y confirmaciones del módulo tanqueos (incluidos subflujos de evidencias y orden de fotos).

---

### 7. Estilos de formulario (no es back)

- **Cantidad combustible** (retroactivo / estación): usar el mismo componente y borde que el resto de inputs requeridos; debe verse claramente como campo editable.

---

Contrato HTTP: `api-tanqueos.md`.
