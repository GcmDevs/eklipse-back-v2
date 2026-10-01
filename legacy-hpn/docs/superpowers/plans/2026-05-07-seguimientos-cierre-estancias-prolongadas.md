# Seguimientos y Cierre de Estancias Prolongadas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar seguimiento semanal inmutable y cierre de caso a `v4/estancias-prolongadas`, usando nombres internos en español y catálogos por código numérico.

**Architecture:** Mantener el patrón actual del módulo `apps/gestor-estancia-prolongadas`: controller NestJS, DTOs con `class-validator`, servicio TypeORM sobre `BaseSource`, entidades en `@orm/hpn/estancia-prolongadas`. Los seguimientos viven en tabla hija; los campos de cierre viven en `EKHPNESTANCIAPROLONGADAS`. Los valores seleccionables se guardan como códigos `tinyint/smallint` y se exponen al frontend como texto mediante types estilo `hpn/older-apps/types`.

**Tech Stack:** NestJS, TypeORM, SQL Server, class-validator, `CtmType`, Jest.

---

## Convenciones de nombres

Renombrar o crear nuevos archivos en español:

- `stays.service.ts` -> `estancia.service.ts`
- `stays.controller.ts` -> `estancias-prolongadas.controller.ts`
- `stays.service.spec.ts` -> `estancia.service.spec.ts`
- `week-follow-up.orm.ts` -> `seguimiento-semana.orm.ts`
- `create-week-follow-up.dto.ts` -> `crear-seguimiento-semana.dto.ts`
- `close-stay.dto.ts` -> `cerrar-estancia.dto.ts`
- `createFollowUp` -> `crearSeguimiento`
- `getFollowUps` -> `listarSeguimientos`
- `closeStay` -> `cerrarEstancia`
- `getStayById` -> opcionalmente `obtenerEstanciaPorId`
- `updateStay` -> opcionalmente `actualizarEstancia`

No cambiar la URL pública base `v4/estancias-prolongadas`, porque ya está en español y el frontend la consume. Sí usar nombres de métodos, DTOs, servicios y archivos en español.

---

## File Structure

- Create: `@types/hpn/estancias-prolongadas/seguimiento-estado.type.ts`
  - Type `SeguimientoEstadoCode` y factory `seguimientoEstadoTypeFactory`.

- Create: `@types/hpn/estancias-prolongadas/seguimiento-destino.type.ts`
  - Type `SeguimientoDestinoCode` y factory `seguimientoDestinoTypeFactory`.

- Create: `@types/hpn/estancias-prolongadas/seguimiento-accion.type.ts`
  - Type `SeguimientoAccionCode` y factory `seguimientoAccionTypeFactory`.

- Create: `@types/hpn/estancias-prolongadas/cierre-destino-final.type.ts`
  - Type `CierreDestinoFinalCode` y factory `cierreDestinoFinalTypeFactory`.

- Create: `@types/hpn/estancias-prolongadas/cierre-los-resultado.type.ts`
  - Type `CierreLosResultadoCode` y factory `cierreLosResultadoTypeFactory`.

- Create: `@types/hpn/estancias-prolongadas/cierre-barrera-critica.type.ts`
  - Type `CierreBarreraCriticaCode` y factory `cierreBarreraCriticaTypeFactory`.

- Create: `@types/hpn/estancias-prolongadas/cierre-protocolo-suficiente.type.ts`
  - Type `CierreProtocoloSuficienteCode` y factory `cierreProtocoloSuficienteTypeFactory`.

- Create: `@types/hpn/estancias-prolongadas/index.ts`
  - Exportar todos los types anteriores.

- Modify: `@types/hpn/index.ts`
  - Exportar `./estancias-prolongadas`.

- Create: `@orm/hpn/estancia-prolongadas/seguimiento-semana.orm.ts`
  - Entidad `SeguimientoSemanaOrm` para `EKHPNSEGUIMIENTOSEMANA`.
  - Relación `ManyToOne` con `ProlongadaEstanciaOrm`.
  - Unique `(ESTANCIAPROLONGADAID, SEMANANUMERO)`.
  - Columnas de catálogo como códigos: `ESTADOCODIGO`, `DESTINOCODIGO`, `ACCIONCODIGO`.

- Modify: `@orm/hpn/estancia-prolongadas/prolonged-stay.orm.ts`
  - Agregar relación `seguimientos`.
  - Cambiar `fechaCierre` de `CreateDateColumn` a `Column`.
  - Agregar columnas de cierre.
  - Usar códigos para catálogos de cierre: `DESTINOFINALCODIGO`, `LOSRESULTADOCODIGO`, `BARRERACRITICACODIGO`, `PROTOCOLOSUFICIENTECODIGO`.

- Modify: `@orm/hpn/estancia-prolongadas/index.ts`
  - Exportar `SeguimientoSemanaOrm`.
  - Incluirlo en `ESTANCIASPROLONGADAS_ENTITIES`.

- Create: `apps/gestor-estancia-prolongadas/presentation/dtos/crear-seguimiento-semana.dto.ts`
  - DTO del `POST :id/seguimientos`.
  - Recibe códigos numéricos, no textos largos.

- Create: `apps/gestor-estancia-prolongadas/presentation/dtos/cerrar-estancia.dto.ts`
  - DTO del `PATCH :id/cierre`.
  - Recibe códigos numéricos, no textos largos.

- Modify: `apps/gestor-estancia-prolongadas/presentation/dtos/index.ts`
  - Exportar nuevos DTOs.

- Rename/Modify: `apps/gestor-estancia-prolongadas/infraestructure/repositories/stays.service.ts` -> `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.ts`
  - Clase `EstanciaService`.
  - Métodos `crearSeguimiento`, `listarSeguimientos`, `cerrarEstancia`.
  - Incluir `seguimientos` en detalle de estancia.
  - Mapear códigos a textos en respuestas.

- Modify: `apps/gestor-estancia-prolongadas/infraestructure/repositories/index.ts`
  - Exportar `./estancia.service`.
  - Remover export de `./stays.service` cuando el rename esté aplicado.

- Rename/Modify: `apps/gestor-estancia-prolongadas/presentation/controllers/stays.controller.ts` -> `apps/gestor-estancia-prolongadas/presentation/controllers/estancias-prolongadas.controller.ts`
  - Clase `EstanciasProlongadasController`.
  - Inyectar `EstanciaService`.
  - Endpoints públicos siguen bajo `v4/estancias-prolongadas`.

- Modify: `apps/gestor-estancia-prolongadas/presentation/controllers/index.ts`
  - Exportar `./estancias-prolongadas.controller`.

- Modify: `apps/gestor-estancia-prolongadas/stays.module.ts`
  - Puede quedar como archivo de módulo si no se quiere ampliar el alcance del rename.
  - Internamente debe usar `EstanciasProlongadasController` y `EstanciaService`.

- Create: `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.spec.ts`
  - Pruebas unitarias de reglas de negocio.

- Create: `docs/database/2026-05-07-seguimientos-cierre-estancias-prolongadas.sql`
  - Script SQL con códigos numéricos para catálogos.

---

## Catálogos por código

Seguir el estilo de `hpn/older-apps/types/tipo-estancia.ts`: `type Code`, constantes `CtmType`, factory por `switch`, array `VALUES` y objeto agrupador.

### SeguimientoEstado

```ts
import { CtmType } from '@common/domain/types';

export type SeguimientoEstadoCode = 1 | 2 | 3 | 4;

const SIN_CAMBIO = new CtmType<SeguimientoEstadoCode>(1, 'Sin cambio');
const BARRERA_RESUELTA_PARCIALMENTE = new CtmType<SeguimientoEstadoCode>(
  2,
  'Barrera resuelta parcialmente'
);
const BARRERA_RESUELTA_EGRESO_48H = new CtmType<SeguimientoEstadoCode>(
  3,
  'Barrera resuelta - egreso en <48h'
);
const NUEVA_BARRERA = new CtmType<SeguimientoEstadoCode>(4, 'Nueva barrera identificada');

export function seguimientoEstadoTypeFactory(
  code: SeguimientoEstadoCode
): CtmType<SeguimientoEstadoCode> {
  switch (code) {
    case 1:
      return SIN_CAMBIO;
    case 2:
      return BARRERA_RESUELTA_PARCIALMENTE;
    case 3:
      return BARRERA_RESUELTA_EGRESO_48H;
    case 4:
      return NUEVA_BARRERA;
  }
}

export const SEGUIMIENTO_ESTADO_VALUES = [
  SIN_CAMBIO,
  BARRERA_RESUELTA_PARCIALMENTE,
  BARRERA_RESUELTA_EGRESO_48H,
  NUEVA_BARRERA,
];

export const SEGUIMIENTO_ESTADO = {
  SIN_CAMBIO,
  BARRERA_RESUELTA_PARCIALMENTE,
  BARRERA_RESUELTA_EGRESO_48H,
  NUEVA_BARRERA,
};
```

Nota: usar guion normal `-` en vez de raya larga para mantener ASCII y evitar problemas de encoding.

### SeguimientoDestino

Codes:

- `1`: `Domicilio con cuidador`
- `2`: `Hospitalizacion domiciliaria`
- `3`: `UMH / hogar geriatrico`
- `4`: `Hospital de nivel inferior`
- `5`: `Institucion ICBF / Social`
- `6`: `Sin destino definido`

### SeguimientoAccion

Codes:

- `1`: `Contacto EPS / solicitud autorizacion`
- `2`: `Gestion con hospital receptor`
- `3`: `Visita Trabajo Social`
- `4`: `Entrenamiento al cuidador`
- `5`: `Solicitud ICBF / Bienestar Social`
- `6`: `Escalada a Direccion Medica`
- `7`: `Comite de egreso complejo`
- `8`: `Otra`

### CierreDestinoFinal

Codes:

- `1`: `Domicilio con cuidador entrenado`
- `2`: `Hospitalizacion domiciliaria activa`
- `3`: `UMH / hogar geriatrico`
- `4`: `Hospital de nivel inferior`
- `5`: `Institucion ICBF / Social`
- `6`: `Fallecimiento en hospitalizacion`
- `7`: `Otro`

### CierreLosResultado

Codes:

- `1`: `dentro`
- `2`: `mayor_controlado`
- `3`: `mayor_evitable`
- `4`: `mayor_social`
- `5`: `mayor_sistema`

### CierreBarreraCritica

Codes:

- `1`: `clinica`
- `2`: `social`
- `3`: `sistema`
- `4`: `geografica`
- `5`: `multiple`

### CierreProtocoloSuficiente

Codes:

- `1`: `si`
- `2`: `parcial`
- `3`: `no`

---

## API Contract actualizado

Los endpoints públicos se mantienen:

- `POST /v4/estancias-prolongadas/:id/seguimientos`
- `GET /v4/estancias-prolongadas/:id/seguimientos`
- `PATCH /v4/estancias-prolongadas/:id/cierre`

El request usa códigos:

```json
{
  "semanaNumero": 1,
  "fechaSeguimiento": "2026-05-05",
  "estadoCodigo": 1,
  "destinoCodigo": 1,
  "accionCodigo": 3,
  "responsable": "Disneris Ruiz",
  "egresoEstimado": "2026-05-12",
  "observaciones": "Se compromete a gestionar cuidador para el lunes siguiente.",
  "escalada": null
}
```

La respuesta puede exponer código y texto:

```json
{
  "id": 1,
  "estanciaProlongadaId": 45,
  "semanaNumero": 1,
  "fechaSeguimiento": "2026-05-05",
  "esCritica": false,
  "estado": { "code": 1, "name": "Sin cambio" },
  "destino": { "code": 1, "name": "Domicilio con cuidador" },
  "accion": { "code": 3, "name": "Visita Trabajo Social" },
  "responsable": "Disneris Ruiz",
  "egresoEstimado": "2026-05-12",
  "observaciones": "Se compromete a gestionar cuidador para el lunes siguiente.",
  "escalada": null,
  "creadoPor": "nombre-del-usuario-autenticado",
  "createdAt": "2026-05-05T21:00:00.000Z",
  "updatedAt": "2026-05-05T21:00:00.000Z"
}
```

Para cierre:

```json
{
  "fechaEgreso": "2026-05-20",
  "losTotal": 42,
  "destinoFinalCodigo": 1,
  "firmaMedico": "Dr. Carlos Mendez - RM 12345",
  "losResultadoCodigo": 2,
  "barreraCriticaCodigo": 2,
  "accionEfectiva": "Contacto directo con auditor EPS logro autorizacion en 6h.",
  "accionInefectiva": "Solicitud por portal EPS nunca fue respondida.",
  "leccionAprendida": "Priorizar llamada directa al auditor desde el dia 7.",
  "protocoloSuficienteCodigo": 2,
  "observacionesCierre": "Paciente egresa en condiciones estables. Pendiente cita control en 15 dias."
}
```

---

## Data Model

### Nueva tabla `EKHPNSEGUIMIENTOSEMANA`

```sql
CREATE TABLE EKHPNSEGUIMIENTOSEMANA (
  OID INT IDENTITY(1,1) PRIMARY KEY,
  ESTANCIAPROLONGADAID INT NOT NULL,
  SEMANANUMERO TINYINT NOT NULL,
  FECHASEGUIMIENTO DATE NOT NULL,
  ESCRITICA BIT NOT NULL DEFAULT 0,
  ESTADOCODIGO TINYINT NOT NULL,
  DESTINOCODIGO TINYINT NULL,
  ACCIONCODIGO TINYINT NULL,
  RESPONSABLE NVARCHAR(200) NULL,
  EGRESOESTIMADO DATE NULL,
  OBSERVACIONES NVARCHAR(MAX) NULL,
  ESCALADA NVARCHAR(300) NULL,
  CREADOPOR NVARCHAR(200) NULL,
  USUARIOCREACION INT NULL,
  CREATEDAT DATETIME NOT NULL DEFAULT GETDATE(),
  UPDATEDAT DATETIME NULL,
  CONSTRAINT FK_EKHPNSEGSEM_ESTPRO FOREIGN KEY (ESTANCIAPROLONGADAID)
    REFERENCES EKHPNESTANCIAPROLONGADAS(OID),
  CONSTRAINT UQ_EKHPNSEGSEM_EST_SEM UNIQUE (ESTANCIAPROLONGADAID, SEMANANUMERO),
  CONSTRAINT CK_EKHPNSEGSEM_SEMANA CHECK (SEMANANUMERO BETWEEN 1 AND 8),
  CONSTRAINT CK_EKHPNSEGSEM_ESTADO CHECK (ESTADOCODIGO BETWEEN 1 AND 4),
  CONSTRAINT CK_EKHPNSEGSEM_DESTINO CHECK (DESTINOCODIGO IS NULL OR DESTINOCODIGO BETWEEN 1 AND 6),
  CONSTRAINT CK_EKHPNSEGSEM_ACCION CHECK (ACCIONCODIGO IS NULL OR ACCIONCODIGO BETWEEN 1 AND 8)
);
```

### Columnas nuevas en `EKHPNESTANCIAPROLONGADAS`

```sql
ALTER TABLE EKHPNESTANCIAPROLONGADAS ADD
  FECHAEGRESO DATE NULL,
  LOSTOTAL INT NULL,
  DESTINOFINALCODIGO TINYINT NULL,
  FIRMAMEDICO NVARCHAR(250) NULL,
  LOSRESULTADOCODIGO TINYINT NULL,
  BARRERACRITICACODIGO TINYINT NULL,
  ACCIONEFECTIVA NVARCHAR(MAX) NULL,
  ACCIONINEFECTIVA NVARCHAR(MAX) NULL,
  LECCIONAPRENDIDA NVARCHAR(MAX) NULL,
  PROTOCOLOSUFICIENTECODIGO TINYINT NULL,
  OBSERVACIONESCIERRE NVARCHAR(MAX) NULL;

ALTER TABLE EKHPNESTANCIAPROLONGADAS ADD
  CONSTRAINT CK_EKHPNESTPRO_DESTFINAL CHECK (DESTINOFINALCODIGO IS NULL OR DESTINOFINALCODIGO BETWEEN 1 AND 7),
  CONSTRAINT CK_EKHPNESTPRO_LOSRESULT CHECK (LOSRESULTADOCODIGO IS NULL OR LOSRESULTADOCODIGO BETWEEN 1 AND 5),
  CONSTRAINT CK_EKHPNESTPRO_BARRCRIT CHECK (BARRERACRITICACODIGO IS NULL OR BARRERACRITICACODIGO BETWEEN 1 AND 5),
  CONSTRAINT CK_EKHPNESTPRO_PROTSUF CHECK (PROTOCOLOSUFICIENTECODIGO IS NULL OR PROTOCOLOSUFICIENTECODIGO BETWEEN 1 AND 3);
```

---

## Task 1: Baseline, rename y routing cleanup

**Files:**
- Rename/Modify: `apps/gestor-estancia-prolongadas/presentation/controllers/stays.controller.ts` -> `apps/gestor-estancia-prolongadas/presentation/controllers/estancias-prolongadas.controller.ts`
- Rename/Modify: `apps/gestor-estancia-prolongadas/infraestructure/repositories/stays.service.ts` -> `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.ts`
- Modify: `apps/gestor-estancia-prolongadas/presentation/controllers/index.ts`
- Modify: `apps/gestor-estancia-prolongadas/infraestructure/repositories/index.ts`
- Modify: `apps/gestor-estancia-prolongadas/stays.module.ts`
- Test: `npm run build`

- [ ] **Step 1: Confirm current build state**

Run:

```powershell
npm run build
```

Expected: PASS or document existing TypeScript errors before editing.

- [ ] **Step 2: Rename service class and file**

Rename file to `estancia.service.ts`.

Rename class:

```ts
@Injectable()
export class EstanciaService extends BaseSource {
}
```

Update exports:

```ts
export * from './gestor-estancia-prolongadas.impl';
export * from './domains.service';
export * from './estancia.service';
```

- [ ] **Step 3: Rename controller file and injection**

Use:

```ts
@Controller('v4/estancias-prolongadas')
export class EstanciasProlongadasController {
  constructor(private readonly estanciaService: EstanciaService) {}
}
```

- [ ] **Step 4: Replace duplicate root GET handlers with one handler**

Keep one `@Get()`:

```ts
@Get()
public async obtenerEstancias(@Query() query: FindStaysQueryDto) {
  try {
    return await this.estanciaService.getStays(query);
  } catch (error: any) {
    this.handleError(error);
  }
}
```

Later, in a separate cleanup, `FindStaysQueryDto` can be renamed to `BuscarEstanciasQueryDto`. It is not required for this feature.

- [ ] **Step 5: Preserve HTTP exceptions**

Add:

```ts
private handleError(error: any): never {
  if (error instanceof HttpException) throw error;
  throw new BadRequestException(error.message);
}
```

Expected: `NotFoundException` remains 404 and `ForbiddenException` remains 403.

- [ ] **Step 6: Build**

Run:

```powershell
npm run build
```

Expected: PASS.

---

## Task 2: Types por código

**Files:**
- Create: all files under `@types/hpn/estancias-prolongadas/`
- Modify: `@types/hpn/index.ts`
- Test: `npm run build`

- [ ] **Step 1: Create seguimiento types**

Create:

- `seguimiento-estado.type.ts`
- `seguimiento-destino.type.ts`
- `seguimiento-accion.type.ts`

Each file must follow the `CtmType` pattern shown in `hpn/older-apps/types/tipo-estancia.ts`.

- [ ] **Step 2: Create cierre types**

Create:

- `cierre-destino-final.type.ts`
- `cierre-los-resultado.type.ts`
- `cierre-barrera-critica.type.ts`
- `cierre-protocolo-suficiente.type.ts`

- [ ] **Step 3: Export all types**

`@types/hpn/estancias-prolongadas/index.ts`:

```ts
export * from './seguimiento-estado.type';
export * from './seguimiento-destino.type';
export * from './seguimiento-accion.type';
export * from './cierre-destino-final.type';
export * from './cierre-los-resultado.type';
export * from './cierre-barrera-critica.type';
export * from './cierre-protocolo-suficiente.type';
```

`@types/hpn/index.ts`:

```ts
export * from './estancias-prolongadas';
```

- [ ] **Step 4: Build**

Run:

```powershell
npm run build
```

Expected: PASS.

---

## Task 3: DTOs en español con códigos

**Files:**
- Create: `apps/gestor-estancia-prolongadas/presentation/dtos/crear-seguimiento-semana.dto.ts`
- Create: `apps/gestor-estancia-prolongadas/presentation/dtos/cerrar-estancia.dto.ts`
- Modify: `apps/gestor-estancia-prolongadas/presentation/dtos/index.ts`
- Test: `npm run build`

- [ ] **Step 1: Add `CrearSeguimientoSemanaDto`**

Fields:

- `semanaNumero`: int `1..8`
- `fechaSeguimiento`: date string
- `estadoCodigo`: int `1..4`
- `destinoCodigo`: optional int `1..6`
- `accionCodigo`: optional int `1..8`
- `responsable`: optional string max 200
- `egresoEstimado`: optional date string
- `observaciones`: optional string
- `escalada`: optional string max 300

Use `@Min`, `@Max`, `@IsInt`, `@IsDateString`, `@IsOptional`, `@IsString`, `@MaxLength`.

- [ ] **Step 2: Add `CerrarEstanciaDto`**

Fields:

- `fechaEgreso`: date string
- `losTotal`: int min 0
- `destinoFinalCodigo`: int `1..7`
- `firmaMedico`: optional string max 250
- `losResultadoCodigo`: int `1..5`
- `barreraCriticaCodigo`: int `1..5`
- `accionEfectiva`: optional string
- `accionInefectiva`: optional string
- `leccionAprendida`: optional string
- `protocoloSuficienteCodigo`: int `1..3`
- `observacionesCierre`: optional string

- [ ] **Step 3: Export DTOs**

```ts
export * from './crear-seguimiento-semana.dto';
export * from './cerrar-estancia.dto';
```

- [ ] **Step 4: Build**

Run:

```powershell
npm run build
```

Expected: PASS.

---

## Task 4: Entidades TypeORM

**Files:**
- Create: `@orm/hpn/estancia-prolongadas/seguimiento-semana.orm.ts`
- Modify: `@orm/hpn/estancia-prolongadas/prolonged-stay.orm.ts`
- Modify: `@orm/hpn/estancia-prolongadas/index.ts`
- Test: `npm run build`

- [ ] **Step 1: Create `SeguimientoSemanaOrm`**

Use code columns:

```ts
@Column({ name: 'ESTADOCODIGO', type: 'tinyint' })
estadoCodigo: number;

@Column({ name: 'DESTINOCODIGO', type: 'tinyint', nullable: true })
destinoCodigo: number;

@Column({ name: 'ACCIONCODIGO', type: 'tinyint', nullable: true })
accionCodigo: number;
```

Do not store catalog display labels in this table.

- [ ] **Step 2: Update `ProlongadaEstanciaOrm` closure columns**

Use:

```ts
@Column({ name: 'DESTINOFINALCODIGO', type: 'tinyint', nullable: true })
destinoFinalCodigo: number;

@Column({ name: 'LOSRESULTADOCODIGO', type: 'tinyint', nullable: true })
losResultadoCodigo: number;

@Column({ name: 'BARRERACRITICACODIGO', type: 'tinyint', nullable: true })
barreraCriticaCodigo: number;

@Column({ name: 'PROTOCOLOSUFICIENTECODIGO', type: 'tinyint', nullable: true })
protocoloSuficienteCodigo: number;
```

- [ ] **Step 3: Fix `fechaCierre`**

Change from `CreateDateColumn` to nullable `Column`:

```ts
@Column({ name: 'FECHACIERRE', type: 'datetime', nullable: true })
fechaCierre: Date;
```

- [ ] **Step 4: Add relation and export entity**

Add `seguimientos` relation in `ProlongadaEstanciaOrm`.

Add `SeguimientoSemanaOrm` to `@orm/hpn/estancia-prolongadas/index.ts`.

- [ ] **Step 5: Build**

Run:

```powershell
npm run build
```

Expected: PASS.

---

## Task 5: Servicio de seguimiento

**Files:**
- Modify: `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.ts`
- Test: `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.spec.ts`

- [ ] **Step 1: Add failing tests**

Cover:

- 404 when estancia does not exist.
- 403 when `estado === false`.
- 400 when `semanaNumero > 8`.
- 400 when week already exists.
- 400 when previous week is missing.
- Week 4 persists `esCritica = true`.
- Week 1 does not require previous week.

- [ ] **Step 2: Implement `crearSeguimiento`**

Rules:

```ts
const estancia = await estanciaRp.findOne({ where: { id } });
if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');
if (!estancia.estado) throw new ForbiddenException('La estancia ya esta cerrada');
if (body.semanaNumero > 8) throw new BadRequestException('El numero maximo de semanas es 8');
```

Persist code fields:

```ts
const seguimiento = seguimientoRp.create({
  estanciaProlongadaId: id,
  semanaNumero: body.semanaNumero,
  fechaSeguimiento: new Date(body.fechaSeguimiento),
  esCritica: body.semanaNumero >= 4,
  estadoCodigo: body.estadoCodigo,
  destinoCodigo: body.destinoCodigo ?? null,
  accionCodigo: body.accionCodigo ?? null,
  responsable: body.responsable?.trim() ?? null,
  egresoEstimado: body.egresoEstimado ? new Date(body.egresoEstimado) : null,
  observaciones: body.observaciones?.trim() ?? null,
  escalada: body.escalada?.trim() ?? null,
  creadoPor: this.auth.user?.nombre ?? this.auth.user?.name ?? null,
  usuarioCreacionId: this.auth.user?.id ?? null,
});
```

- [ ] **Step 3: Map response**

Use factories:

```ts
estado: seguimientoEstadoTypeFactory(data.estadoCodigo),
destino: data.destinoCodigo ? seguimientoDestinoTypeFactory(data.destinoCodigo) : null,
accion: data.accionCodigo ? seguimientoAccionTypeFactory(data.accionCodigo) : null,
```

- [ ] **Step 4: Run tests**

```powershell
npm test -- estancia.service.spec.ts
```

Expected: PASS.

---

## Task 6: Listar seguimientos e incluirlos en detalle

**Files:**
- Modify: `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.ts`
- Modify: `apps/gestor-estancia-prolongadas/presentation/controllers/estancias-prolongadas.controller.ts`
- Test: `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.spec.ts`

- [ ] **Step 1: Implement `listarSeguimientos`**

```ts
const estancia = await estanciaRp.findOne({ where: { id } });
if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');

const seguimientos = await seguimientoRp.find({
  where: { estanciaProlongadaId: id },
  order: { semanaNumero: 'ASC' },
});

return seguimientos.map(seguimiento => this.mapSeguimiento(seguimiento));
```

- [ ] **Step 2: Add controller routes**

```ts
@Post(':id/seguimientos')
public async crearSeguimiento(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: CrearSeguimientoSemanaDto
) {
  try {
    return await this.estanciaService.crearSeguimiento(id, body);
  } catch (error: any) {
    this.handleError(error);
  }
}

@Get(':id/seguimientos')
public async listarSeguimientos(@Param('id', ParseIntPipe) id: number) {
  try {
    return await this.estanciaService.listarSeguimientos(id);
  } catch (error: any) {
    this.handleError(error);
  }
}
```

- [ ] **Step 3: Include `seguimientos` in detail**

In `obtenerEstanciaPorId`, load sorted follow-ups and map them. Do not rely on raw TypeORM relation output if the API needs `{ code, name }` catalog objects.

- [ ] **Step 4: Build and tests**

```powershell
npm test -- estancia.service.spec.ts
npm run build
```

Expected: PASS.

---

## Task 7: Cerrar estancia

**Files:**
- Modify: `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.ts`
- Modify: `apps/gestor-estancia-prolongadas/presentation/controllers/estancias-prolongadas.controller.ts`
- Test: `apps/gestor-estancia-prolongadas/infraestructure/repositories/estancia.service.spec.ts`

- [ ] **Step 1: Add failing tests**

Cover:

- 404 when estancia does not exist.
- 400 when already closed.
- 400 when `fechaEgreso < fechaIngreso`.
- Success sets `estado = false`.
- Success stores code columns, not labels.

- [ ] **Step 2: Implement `cerrarEstancia`**

```ts
const estancia = await estanciaRp.findOne({ where: { id } });
if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');
if (!estancia.estado) throw new BadRequestException('La estancia ya esta cerrada');

const fechaEgreso = new Date(body.fechaEgreso);
if (fechaEgreso < estancia.fechaIngreso) {
  throw new BadRequestException('La fecha de egreso no puede ser anterior a la fecha de ingreso');
}

estancia.estado = false;
estancia.fechaCierre = fechaEgreso;
estancia.usuarioCerroId = this.auth.user.id;
estancia.fechaEgreso = fechaEgreso;
estancia.losTotal = body.losTotal;
estancia.destinoFinalCodigo = body.destinoFinalCodigo;
estancia.firmaMedico = body.firmaMedico?.trim() ?? null;
estancia.losResultadoCodigo = body.losResultadoCodigo;
estancia.barreraCriticaCodigo = body.barreraCriticaCodigo;
estancia.accionEfectiva = body.accionEfectiva?.trim() ?? null;
estancia.accionInefectiva = body.accionInefectiva?.trim() ?? null;
estancia.leccionAprendida = body.leccionAprendida?.trim() ?? null;
estancia.protocoloSuficienteCodigo = body.protocoloSuficienteCodigo;
estancia.observacionesCierre = body.observacionesCierre?.trim() ?? null;
estancia.updatedAt = new Date();
```

- [ ] **Step 3: Return mapped closure payload**

```ts
cierre: {
  fechaEgreso: body.fechaEgreso,
  losTotal: data.losTotal,
  destinoFinal: cierreDestinoFinalTypeFactory(data.destinoFinalCodigo),
  firmaMedico: data.firmaMedico,
  losResultado: cierreLosResultadoTypeFactory(data.losResultadoCodigo),
  barreraCritica: cierreBarreraCriticaTypeFactory(data.barreraCriticaCodigo),
  accionEfectiva: data.accionEfectiva,
  accionInefectiva: data.accionInefectiva,
  leccionAprendida: data.leccionAprendida,
  protocoloSuficiente: cierreProtocoloSuficienteTypeFactory(data.protocoloSuficienteCodigo),
  observacionesCierre: data.observacionesCierre,
}
```

- [ ] **Step 4: Add controller route**

```ts
@Patch(':id/cierre')
public async cerrarEstancia(@Param('id', ParseIntPipe) id: number, @Body() body: CerrarEstanciaDto) {
  try {
    return await this.estanciaService.cerrarEstancia(id, body);
  } catch (error: any) {
    this.handleError(error);
  }
}
```

- [ ] **Step 5: Build and tests**

```powershell
npm test -- estancia.service.spec.ts
npm run build
```

Expected: PASS.

---

## Task 8: SQL y verificación manual

**Files:**
- Create: `docs/database/2026-05-07-seguimientos-cierre-estancias-prolongadas.sql`
- Test: local or staging DB request calls.

- [ ] **Step 1: Add SQL script**

Use the SQL from the Data Model section.

- [ ] **Step 2: Apply script in development DB**

Run it through the existing DB deployment process. Do not rely on TypeORM `synchronize` unless this project already uses it in development.

- [ ] **Step 3: Start API**

```powershell
npm run start:dev
```

Expected: Nest starts without entity metadata errors.

- [ ] **Step 4: Manual endpoint checks**

Create week 1:

```http
POST /v4/estancias-prolongadas/45/seguimientos
```

Expected: `201`, `semanaNumero = 1`, `esCritica = false`, `estado.code = 1`.

Create week 4 after weeks 1, 2 and 3:

```http
POST /v4/estancias-prolongadas/45/seguimientos
```

Expected: `201`, `semanaNumero = 4`, `esCritica = true`.

List:

```http
GET /v4/estancias-prolongadas/45/seguimientos
```

Expected: `200`, array sorted by `semanaNumero ASC`.

Close:

```http
PATCH /v4/estancias-prolongadas/45/cierre
```

Expected: `200`, `estado = 0`, closure object with `{ code, name }` catalog values.

Try follow-up after close:

```http
POST /v4/estancias-prolongadas/45/seguimientos
```

Expected: `403`.

Try close again:

```http
PATCH /v4/estancias-prolongadas/45/cierre
```

Expected: `400`.

---

## Open Decisions Before Coding

- Confirm whether catalog labels should preserve accents in API responses. This plan uses ASCII labels to avoid encoding issues seen in current files; DB stores only numeric codes either way.
- Confirm whether `@types/hpn/estancias-prolongadas` is preferred over `hpn/older-apps/types`. The pattern comes from `hpn/older-apps/types`, but new shared types should live under `@types/hpn` unless the team wants legacy placement.
- Confirm the user display field for `creadoPor`: current code reliably has `this.auth.user.id`, but the sample response expects a name.
- Confirm whether `PATCH /v4/estancias-prolongadas/:id` should be blocked when the estancia is closed. The spec only blocks nuevos seguimientos and doble cierre.
- Confirm whether `stays.module.ts` should also be renamed. This plan leaves it as-is to reduce import churn.

## Self-Review

- Spec coverage: create follow-up, list follow-ups, include in detail, close case, validation errors, unique week and closed-case rules are covered.
- Requested changes: internal names are Spanish; catalog values are moved from enums/string columns to `CtmType`-style types and numeric DB codes.
- Type consistency: DTO fields, entity columns, service methods and controller methods use Spanish names and code-based catalogs consistently.
