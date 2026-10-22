// Comprobación real en SQL Server; todas las escrituras se revierten.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const sql = require('mssql');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
const migration = readFileSync(
  path.resolve(__dirname, '../database/migrations/20261022_invima_completa.sql'),
  'utf8'
);
const tables = [
  'EKINNIVPRODUCTO',
  'EKINNIVVERIFICACION',
  'EKINNIVCONFIRMACION',
  'EKINNIVFACTURA',
  'EKINNIVFACTURAITEM',
];
const observationColumns = ['OBSERVACION', 'OBSVERSION', 'OBSUSUARIO', 'OBSNOMBRE', 'OBSFECHA'];

const legacyProducto = schema => `CREATE TABLE ${schema}.EKINNIVPRODUCTO (
  OID INT IDENTITY PRIMARY KEY, DATOS NVARCHAR(MAX) NOT NULL, VERSION INT NOT NULL,
  ULTIMAVERIFICACION INT NULL, CREADOPOR INT NOT NULL,
  FECHACREA DATETIME2 NOT NULL, FECHAACT DATETIME2 NOT NULL
);`;

const legacyTables = schema => `${legacyProducto(schema)}
CREATE TABLE ${schema}.EKINNIVVERIFICACION (
  OID INT IDENTITY PRIMARY KEY, PRODUCTOID INT NOT NULL, VERSIONPRODUCTO INT NOT NULL,
  ENTRADA NVARCHAR(MAX) NOT NULL, RESULTADO VARCHAR(30) NOT NULL,
  EVIDENCIA NVARCHAR(MAX) NOT NULL, USUARIOID INT NOT NULL,
  USUARIONOMBRE NVARCHAR(240) NOT NULL, FECHA DATETIME2 NOT NULL
);
CREATE TABLE ${schema}.EKINNIVCONFIRMACION (
  OID INT IDENTITY PRIMARY KEY, VERIFICACIONID INT NOT NULL,
  CANDIDATO NVARCHAR(MAX) NOT NULL, USUARIOID INT NOT NULL,
  USUARIONOMBRE NVARCHAR(240) NOT NULL, FECHA DATETIME2 NOT NULL
);
CREATE TABLE ${schema}.EKINNIVFACTURA (
  OID INT IDENTITY PRIMARY KEY, NUMERO NVARCHAR(100) NOT NULL,
  PROVEEDOR NVARCHAR(240) NOT NULL, NITPROVEEDOR VARCHAR(30) NOT NULL,
  FECHA DATE NULL, FORMATO VARCHAR(30) NOT NULL, EXTRACTORVERSION VARCHAR(30) NOT NULL,
  ARCHIVONOMBRE NVARCHAR(260) NOT NULL, ARCHIVOHASH VARCHAR(64) NOT NULL,
  PAGINAS INT NOT NULL, ADVERTENCIAS NVARCHAR(MAX) NOT NULL,
  ESTADO VARCHAR(20) NOT NULL, VERSION INT NOT NULL, CREADOPOR INT NOT NULL,
  ACTUALIZADOPOR INT NOT NULL, FECHACREA DATETIME2 NOT NULL, FECHAACT DATETIME2 NOT NULL,
  CONSTRAINT UQ_IV_FACTURA_HASH UNIQUE(ARCHIVOHASH)
);
CREATE TABLE ${schema}.EKINNIVFACTURAITEM (
  OID INT IDENTITY PRIMARY KEY, FACTURAID INT NOT NULL, PRODUCTOID INT NULL,
  ORDEN INT NOT NULL, ORIGINAL NVARCHAR(MAX) NOT NULL,
  DATOS NVARCHAR(MAX) NOT NULL, EXCLUIDO BIT NOT NULL
);`;

const facturaInsert = (schema, numero = 'F-1') => `
INSERT INTO ${schema}.EKINNIVFACTURA
  (NUMERO, PROVEEDOR, NITPROVEEDOR, FECHA, FORMATO, EXTRACTORVERSION, ARCHIVONOMBRE,
   ARCHIVOHASH, PAGINAS, ADVERTENCIAS, ESTADO, VERSION, CREADOPOR, ACTUALIZADOPOR,
   FECHACREA, FECHAACT)
VALUES (N'${numero}', N'Proveedor de prueba', '', NULL, 'TEST', '1', N'prueba.pdf',
        REPLICATE('a', 64), 1, N'[]', 'REVISADA', 3, 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME());`;

async function seedData(query, schema) {
  await query(`
INSERT INTO ${schema}.EKINNIVPRODUCTO
  (DATOS, VERSION, ULTIMAVERIFICACION, CREADOPOR, FECHACREA, FECHAACT)
VALUES (N'{"nombre":"Producto QA","cum":"00001-001"}', 2, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
INSERT INTO ${schema}.EKINNIVVERIFICACION
  (PRODUCTOID, VERSIONPRODUCTO, ENTRADA, RESULTADO, EVIDENCIA, USUARIOID, USUARIONOMBRE, FECHA)
VALUES (1, 2, N'{"cum":"00001-001"}', 'CONFIRMADA', N'{"fuentes":[]}', 1, N'QA', SYSUTCDATETIME());
UPDATE ${schema}.EKINNIVPRODUCTO SET ULTIMAVERIFICACION = 1 WHERE OID = 1;
INSERT INTO ${schema}.EKINNIVCONFIRMACION
  (VERIFICACIONID, CANDIDATO, USUARIOID, USUARIONOMBRE, FECHA)
VALUES (1, N'{"cum":"00001-001"}', 1, N'QA', SYSUTCDATETIME());
${facturaInsert(schema)}
INSERT INTO ${schema}.EKINNIVFACTURAITEM (FACTURAID, PRODUCTOID, ORDEN, ORIGINAL, DATOS, EXCLUIDO)
VALUES (1, 1, 1, N'{"pagina":1}', N'{"descripcion":"Producto QA"}', 0);
`);
}

async function snapshot(query, schema) {
  const result = await query(`
SELECT * FROM ${schema}.EKINNIVPRODUCTO ORDER BY OID;
SELECT * FROM ${schema}.EKINNIVVERIFICACION ORDER BY OID;
SELECT * FROM ${schema}.EKINNIVCONFIRMACION ORDER BY OID;
SELECT OID, NUMERO, PROVEEDOR, NITPROVEEDOR, FECHA, FORMATO, EXTRACTORVERSION,
       ARCHIVONOMBRE, ARCHIVOHASH, PAGINAS, ADVERTENCIAS, ESTADO, VERSION,
       CREADOPOR, ACTUALIZADOPOR, FECHACREA, FECHAACT
FROM ${schema}.EKINNIVFACTURA ORDER BY OID;
SELECT OID, FACTURAID, PRODUCTOID, ORDEN, ORIGINAL, DATOS, EXCLUIDO
FROM ${schema}.EKINNIVFACTURAITEM ORDER BY OID;
`);
  return JSON.parse(JSON.stringify(result.recordsets));
}

async function assertStructure(query, schema) {
  const result = await query(`
SELECT t.name AS tabla, c.name AS columna FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.columns c ON c.object_id = t.object_id WHERE s.name = '${schema}';
SELECT i.name, i.is_unique, i.has_filter, i.filter_definition FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id WHERE s.name = '${schema}';
SELECT N'FK' AS tipo, f.is_disabled, f.is_not_trusted FROM sys.foreign_keys f
JOIN sys.tables t ON t.object_id = f.parent_object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id WHERE s.name = '${schema}'
UNION ALL
SELECT N'CK', c.is_disabled, c.is_not_trusted FROM sys.check_constraints c
JOIN sys.tables t ON t.object_id = c.parent_object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id WHERE s.name = '${schema}';
SELECT EKCODIGO, NOMBRE, EKGENMODULO, EKGENSUBMODULO FROM ${schema}.GCMMODULOS;
`);
  for (const table of tables)
    assert(
      result.recordsets[0].some(row => row.tabla === table),
      `Falta ${table}`
    );
  for (const table of ['EKINNIVFACTURA', 'EKINNIVFACTURAITEM'])
    for (const column of observationColumns)
      assert(result.recordsets[0].some(row => row.tabla === table && row.columna === column));
  for (const column of ['FECHAELIMINA', 'ELIMINADOPOR', 'TIPODOCUMENTO', 'CLIENTE'])
    assert(
      result.recordsets[0].some(row => row.tabla === 'EKINNIVFACTURA' && row.columna === column)
    );
  const hashIndex = result.recordsets[1].find(row => row.name === 'UQ_IV_FACTURA_HASH_ACTIVA');
  assert.equal(hashIndex?.is_unique, true);
  assert.match(hashIndex.filter_definition, /FECHAELIMINA.*IS NULL/i);
  assert(!result.recordsets[1].some(row => row.name === 'UQ_IV_FACTURA_HASH'));
  assert.equal(result.recordsets[2].filter(row => row.tipo === 'FK').length, 5);
  assert.equal(result.recordsets[2].filter(row => row.tipo === 'CK').length, 5);
  assert(result.recordsets[2].every(row => !row.is_disabled && !row.is_not_trusted));
  assert.deepEqual(result.recordsets[3], [
    {
      EKCODIGO: '002',
      NOMBRE: 'VERIFICACIÓN INVIMA',
      EKGENMODULO: 101,
      EKGENSUBMODULO: 305,
    },
  ]);
}

async function main() {
  const pool = await new sql.ConnectionPool({
    server: process.env.AC_HOST_DB,
    user: process.env.AC_USERNAME_DB,
    password: process.env.AC_PASS_DB,
    database: process.env.AC_NAME_DB,
    connectionTimeout: 10000,
    requestTimeout: 30000,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      cryptoCredentialsDetails: { minVersion: 'TLSv1' },
    },
  }).connect();
  let passed = 0;
  async function scenario(name, run) {
    const schema = `invima_qa_${randomBytes(8).toString('hex')}`;
    assert.match(schema, /^invima_qa_[a-f0-9]{16}$/);
    const isolated = migration.replaceAll('dbo.', `${schema}.`);
    assert(!/\bdbo\./i.test(isolated), 'La prueba no debe escribir en dbo');
    const tx = new sql.Transaction(pool);
    let rolledBack = false;
    tx.on('rollback', () => {
      rolledBack = true;
    });
    await tx.begin();
    try {
      const query = statement => new sql.Request(tx).query(statement);
      await query(`CREATE SCHEMA ${schema};`);
      await query(`
CREATE TABLE ${schema}.EKGENMODULO (OID INT PRIMARY KEY, CODIGO VARCHAR(3), NOMBRE NVARCHAR(100), ACTIVO BIT);
CREATE TABLE ${schema}.EKGENSUBMODULO (OID INT PRIMARY KEY, CODIGO VARCHAR(3), EKGENMODULO INT, NOMBRE NVARCHAR(100), ACTIVO BIT);
CREATE TABLE ${schema}.GCMMODULOS (OID INT IDENTITY PRIMARY KEY, EKCODIGO VARCHAR(3), NOMBRE NVARCHAR(240), ACTIVO BIT, EKGENMODULO INT, EKGENSUBMODULO INT);
INSERT INTO ${schema}.EKGENMODULO VALUES (101, '006', N'INVENTARIO', 1);
INSERT INTO ${schema}.EKGENSUBMODULO VALUES (305, '005', 101, N'PRODUCTOS', 1);
`);
      await run({ query, schema, migrate: () => query(isolated) });
      passed++;
      console.log(`OK: ${name}`);
    } finally {
      if (!rolledBack) await tx.rollback();
      const residue = await pool
        .request()
        .input('schema', sql.NVarChar, schema)
        .query('SELECT COUNT(*) AS total FROM sys.schemas WHERE name = @schema');
      assert.equal(residue.recordset[0].total, 0, 'No debe quedar ningún esquema de prueba');
    }
  }
  try {
    await scenario(
      'instalación nueva, repetición, notas y permiso desactivado',
      async ({ query, schema, migrate }) => {
        await migrate();
        await assertStructure(query, schema);
        await seedData(query, schema);
        await query(`
UPDATE ${schema}.EKINNIVFACTURA SET OBSERVACION = N'Nota general', OBSVERSION = 3, OBSUSUARIO = 1, OBSNOMBRE = N'QA', OBSFECHA = SYSUTCDATETIME(), TIPODOCUMENTO = 'PEDIDO', CLIENTE = N'Disfarma', FECHAELIMINA = SYSUTCDATETIME(), ELIMINADOPOR = 1;
UPDATE ${schema}.EKINNIVFACTURAITEM SET OBSERVACION = N'Nota del producto', OBSVERSION = 2;
UPDATE ${schema}.GCMMODULOS SET ACTIVO = 0;
`);
        const before = await snapshot(query, schema);
        const notesBefore = (
          await query(
            `SELECT * FROM ${schema}.EKINNIVFACTURA; SELECT * FROM ${schema}.EKINNIVFACTURAITEM;`
          )
        ).recordsets;
        await migrate();
        await migrate();
        await assertStructure(query, schema);
        assert.deepEqual(await snapshot(query, schema), before);
        assert.deepEqual(
          (
            await query(
              `SELECT * FROM ${schema}.EKINNIVFACTURA; SELECT * FROM ${schema}.EKINNIVFACTURAITEM;`
            )
          ).recordsets,
          notesBefore
        );
        assert.equal(
          (await query(`SELECT ACTIVO FROM ${schema}.GCMMODULOS`)).recordset[0].ACTIVO,
          false
        );
        await query(facturaInsert(schema, 'F-2'));
        assert.equal(
          (await query(`SELECT COUNT(*) AS total FROM ${schema}.EKINNIVFACTURA`)).recordset[0]
            .total,
          2
        );
      }
    );

    await scenario(
      'actualización de tablas anteriores conservando productos e historial',
      async ({ query, schema, migrate }) => {
        await query(legacyTables(schema));
        await seedData(query, schema);
        const before = await snapshot(query, schema);
        await migrate();
        await assertStructure(query, schema);
        assert.deepEqual(await snapshot(query, schema), before);
        assert.deepEqual(
          (
            await query(
              `SELECT TIPODOCUMENTO, CLIENTE, OBSERVACION, OBSVERSION FROM ${schema}.EKINNIVFACTURA`
            )
          ).recordset,
          [{ TIPODOCUMENTO: 'FACTURA', CLIENTE: '', OBSERVACION: '', OBSVERSION: 0 }]
        );
        await migrate();
        assert.deepEqual(await snapshot(query, schema), before);
      }
    );

    await scenario(
      'instalación parcial con solo tabla de productos',
      async ({ query, schema, migrate }) => {
        await query(legacyProducto(schema));
        await query(
          `INSERT INTO ${schema}.EKINNIVPRODUCTO VALUES (N'{"cum":"00001-001"}', 1, NULL, 1, SYSUTCDATETIME(), SYSUTCDATETIME())`
        );
        await migrate();
        await assertStructure(query, schema);
        assert.equal(
          (await query(`SELECT DATOS FROM ${schema}.EKINNIVPRODUCTO`)).recordset[0].DATOS,
          '{"cum":"00001-001"}'
        );
      }
    );

    await scenario(
      'columnas de observaciones instaladas parcialmente',
      async ({ query, schema, migrate }) => {
        await query(legacyTables(schema));
        await seedData(query, schema);
        await query(
          `ALTER TABLE ${schema}.EKINNIVFACTURA ADD OBSERVACION NVARCHAR(MAX) NOT NULL DEFAULT N'Nota existente'; ALTER TABLE ${schema}.EKINNIVFACTURAITEM ADD OBSVERSION INT NOT NULL DEFAULT 7;`
        );
        await migrate();
        await assertStructure(query, schema);
        assert.equal(
          (await query(`SELECT OBSERVACION FROM ${schema}.EKINNIVFACTURA`)).recordset[0]
            .OBSERVACION,
          'Nota existente'
        );
        assert.equal(
          (await query(`SELECT OBSVERSION FROM ${schema}.EKINNIVFACTURAITEM`)).recordset[0]
            .OBSVERSION,
          7
        );
      }
    );

    await scenario(
      'rechazo de hash duplicado entre documentos activos',
      async ({ query, schema, migrate }) => {
        await migrate();
        await query(facturaInsert(schema));
        await assert.rejects(query(facturaInsert(schema, 'F-duplicada')), error =>
          [2601, 2627].includes(error.number)
        );
      }
    );

    await scenario('colisión del código del permiso', async ({ query, schema, migrate }) => {
      await query(`INSERT INTO ${schema}.GCMMODULOS VALUES ('002', N'OTRA FUNCIÓN', 1, 101, 305)`);
      await assert.rejects(migrate(), error => error.number === 50002);
    });

    await scenario('ausencia del submódulo Productos', async ({ query, schema, migrate }) => {
      await query(`UPDATE ${schema}.EKGENSUBMODULO SET CODIGO = '999'`);
      await assert.rejects(migrate(), error => error.number === 50001);
    });
    console.log(`${passed} escenarios aprobados. Todos los cambios se revirtieron.`);
  } finally {
    await pool.close();
  }
}

main().catch(error => {
  console.error(`Falló la comprobación (${error.code || error.name}): ${error.message}`);
  process.exitCode = 1;
});
