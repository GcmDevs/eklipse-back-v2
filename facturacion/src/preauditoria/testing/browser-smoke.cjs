/* Prueba local de interfaz. Requiere compilar sln:esbuild:development previamente.
   Sirve dist/sln o PREAUDITORIA_BUILD_DIR (relativo al frontend) y simula las solicitudes API: no inicia el backend,
   no usa credenciales, no contacta bases de datos y no guarda archivos PDF.
   Uso desde eklipse-backend: node facturacion/src/preauditoria/testing/browser-smoke.cjs
*/
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const backend = path.resolve(__dirname, '../../../..');
const frontend = path.resolve(backend, '../eklipse-frontend');
const build = path.resolve(frontend, process.env.PREAUDITORIA_BUILD_DIR || 'dist/sln/browser');
const qa = path.join(frontend, '.angular/preauditoria-qa');
fs.mkdirSync(qa, { recursive: true });
const puppeteer = require(path.join(backend, 'node_modules/puppeteer'));
require(path.join(backend, 'node_modules/ts-node')).register({
  project: path.join(backend, 'facturacion/tsconfig.json'),
  transpileOnly: true,
});
const { DocumentosPre } = require('../infrastructure/documentos.ts');
const { auditoriaPrueba, pacientePrueba } = require('./fixtures.ts');
const catalogo = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../infrastructure/catalogo.json'), 'utf8')
);
const paciente = pacientePrueba();
let registro = auditoriaPrueba({
  estado: 'Sin asignar',
  responsableId: null,
  responsable: '',
  asignado: null,
});
let revisiones = [],
  entregas = [],
  historial = [],
  salarios = [],
  horas = [],
  borrador = null;
const docs = new DocumentosPre();
const pdf = () =>
  docs.auditoria({
    id: registro.id,
    auditoriaId: registro.id,
    numero: Math.max(registro.revision, 1),
    fecha: new Date().toISOString(),
    responsable: 'Usuario de prueba',
    formato: 1,
    auditoria: registro,
  });
const permisos = Object.fromEntries(
  [
    'equipo',
    'recibir',
    'asignar',
    'auditar',
    'reabrir',
    'entregar',
    'informes',
    'configurar',
    'salarios',
    'horas',
  ].map(k => [k, true])
);
const sesion = {
  id: 7,
  nombre: 'Usuario de prueba',
  contexto: 'ALTACENTRO',
  baseDatos: 'DGEMPRES99',
  instalado: true,
  permisos,
  causales: catalogo.codes.slice(0, 8),
  areas: catalogo.areas,
  configuracion: { sinAsignar: 24, auditoria: 24, entrega: 24 },
  fuentes: {},
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/remoteEntry.json') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ name: 'sln', shared: [], exposes: [] }));
  }
  if (url.pathname.endsWith('favicon.ico')) {
    res.writeHead(204);
    return res.end();
  }
  const file = path.resolve(build, '.' + url.pathname);
  if (!file.startsWith(build + path.sep) && file !== build) {
    res.writeHead(403);
    return res.end();
  }
  const target =
    fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
  const mime = {
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.html': 'text/html',
  };
  res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({ headless: true, timeout: 20000 });
  console.log('Navegador de prueba iniciado.');
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const errores = [];
    page.on('pageerror', e => errores.push(String(e)));
    page.on('dialog', d => d.accept());
    await page.setRequestInterception(true);
    page.on('request', async req => {
      if (!req.url().includes(':8104/')) return req.continue();
      try {
        const url = new URL(req.url()),
          ruta = url.pathname.replace('/v1/preauditoria/', ''),
          method = req.method();
        const headers = {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
          'access-control-expose-headers': 'X-Preauditoria-Vista',
        };
        if (method === 'OPTIONS') return req.respond({ status: 204, headers });
        let p = {};
        try {
          p = JSON.parse(req.postData() || '{}');
        } catch {}
        let body = {},
          status = 200;
        if (ruta === 'sesion') body = sesion;
        else if (ruta === 'notificaciones') body = [];
        else if (ruta === 'ingreso') body = paciente;
        else if (ruta === 'prefacturas/analizar')
          body = {
            id: '11111111-1111-4111-8111-111111111111',
            vence: Date.now() + 900000,
            paciente,
            sha256: 'a'.repeat(64),
            bytes: 1000,
            neto: 1000,
            candidatos: [1000],
            identidadCompleta: true,
            incidencias: [],
          };
        else if (ruta === 'auditorias' && method === 'POST') {
          body = registro;
          status = 201;
        } else if (ruta === 'auditorias')
          body = { registros: [registro], total: 1, valor: registro.valor, pagina: 1, tamano: 25 };
        else if (ruta.endsWith('/acciones')) {
          registro = { ...registro, version: registro.version + 1 };
          if (p.accion === 'asignar') {
            registro.estado = 'Pendiente';
            registro.responsableId = 7;
            registro.responsable = 'Usuario de prueba';
          }
          if (p.accion === 'iniciar') registro.estado = 'En auditoría';
          if (p.accion === 'guardar') {
            registro.notas = p.notas;
            registro.hallazgos = p.hallazgos;
            borrador = null;
          }
          if (p.accion === 'solicitarReapertura')
            registro.reapertura = { motivo: p.motivo, usuario: 7, fecha: new Date().toISOString() };
          if (p.accion === 'reabrir') {
            registro.estado = 'En corrección';
            registro.correccion = true;
          }
          historial.push({
            id: historial.length + 1,
            accion: p.accion,
            responsable: 'Usuario de prueba',
            fecha: new Date().toISOString(),
          });
          body = registro;
        } else if (ruta.endsWith('/borrador')) {
          borrador = { ...p, secuencia: (borrador?.secuencia || 0) + 1 };
          body = borrador;
        } else if (ruta.endsWith('/vista-previa'))
          return req.respond({
            status: 200,
            headers: {
              ...headers,
              'content-type': 'application/pdf',
              'x-preauditoria-vista': '11111111-1111-4111-8111-111111111111',
            },
            body: pdf(),
          });
        else if (ruta.endsWith('/finalizar')) {
          registro = {
            ...registro,
            version: registro.version + 1,
            estado: 'Finalizado',
            revision: registro.revision + 1,
            auditado: registro.auditado || new Date().toISOString(),
            ultimaFinalizacion: new Date().toISOString(),
          };
          revisiones.push({
            id: registro.id,
            numero: registro.revision,
            fecha: registro.ultimaFinalizacion,
          });
          body = registro;
        } else if (ruta.endsWith('/revisiones')) body = revisiones;
        else if (ruta.includes('/historial/'))
          body = { payload: JSON.stringify({ motivo: 'Cambio de prueba' }) };
        else if (ruta.endsWith('/historial'))
          body = { registros: historial, total: historial.length, pagina: 1 };
        else if (ruta.startsWith('auditorias/')) body = { auditoria: registro, borrador };
        else if (ruta === 'equipo' || ruta === 'salarios/usuarios')
          body = [{ id: 7, nombre: 'Usuario de prueba' }];
        else if (ruta === 'servicios') body = [{ code: '890201', name: 'Consulta de prueba' }];
        else if (ruta === 'resumen')
          body = {
            estados: [{ estado: registro.estado, cantidad: 1, valor: 1000 }],
            sedes: [{ centro: 'Centro de prueba', cantidad: 1, valor: 1000, entregado: 0 }],
            productividad: [],
            diarios: [],
          };
        else if (ruta === 'reportes/actividad')
          body = [
            {
              periodo: '2026-10',
              asignados: 1,
              auditados: 1,
              valorAsignado: 1000,
              valorAuditado: 1000,
            },
          ];
        else if (ruta === 'alertas')
          body = {
            registros: [],
            total: 0,
            pagina: 1,
            tamano: 25,
            configuracion: sesion.configuracion,
          };
        else if (ruta === 'entregas' && method === 'POST') {
          const e = {
            id: '22222222-2222-4222-8222-222222222222',
            codigo: 'ENT-PRUEBA',
            contexto: 'ALTACENTRO',
            usuario: 7,
            responsable: 'Usuario de prueba',
            fecha: new Date().toISOString(),
            solicitud: p.solicitud,
            total: 1000,
            items: [
              {
                id: registro.id,
                ingreso: '1234',
                centro: 'Centro de prueba',
                valor: 1000,
                auditor: registro.responsable,
                auditado: registro.auditado,
                revision: registro.revision,
              },
            ],
          };
          entregas.push(e);
          body = e;
          registro.estado = 'Entregado';
        } else if (ruta === 'entregas')
          body = { registros: entregas, total: entregas.length, pagina: 1 };
        else if (ruta === 'configuracion') {
          if (method === 'PATCH') sesion.configuracion = p;
          body = sesion.configuracion;
        } else if (ruta === 'salarios' && method === 'POST') {
          salarios.push(p);
          body = p;
        } else if (ruta === 'salarios') body = salarios;
        else if (ruta === 'horas')
          body = {
            registros: horas,
            salarios,
            total: horas.length,
            pagina: 1,
            tamano: 25,
            totales: { minutos: 0, valor: 0, reportados: 0 },
          };
        else if (ruta.endsWith('/pdf'))
          return req.respond({
            status: 200,
            headers: { ...headers, 'content-type': 'application/pdf' },
            body: pdf(),
          });
        return req.respond({
          status,
          headers: { ...headers, 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (e) {
        errores.push(String(e));
        return req.abort();
      }
    });
    const esperar = async text =>
      page.waitForFunction(t => document.body.innerText.includes(t), { timeout: 20000 }, text);
    const pulsar = async (text, scope = '') => {
      await page.waitForFunction(
        (t, s) =>
          [...document.querySelectorAll(`${s} button,${s} a`)].some(
            e => e.getClientRects().length && e.textContent.trim() === t && !e.disabled
          ),
        { timeout: 20000 },
        text,
        scope
      );
      await page.evaluate(
        (t, s) => {
          const el = [...document.querySelectorAll(`${s} button,${s} a`)].find(
            e => e.getClientRects().length && e.textContent.trim() === t
          );
          el.click();
        },
        text,
        scope
      );
    };
    const llenar = async (selector, value) =>
      page.$eval(
        selector,
        (e, v) => {
          e.value = v;
          e.dispatchEvent(new Event('input', { bubbles: true }));
          e.dispatchEvent(new Event('change', { bubbles: true }));
        },
        value
      );
    sesion.instalado = false;
    await page.goto(base + '/#/preauditoria/recepcion');
    await esperar('Configura Preauditoría para ALTACENTRO');
    await esperar('DGEMPRES99');
    await page.screenshot({ path: path.join(qa, 'instalacion-contexto.png'), fullPage: true });
    assert.equal(await page.$('input[formcontrolname="ingreso"]'), null);
    sesion.instalado = true;
    await pulsar('Comprobar instalación');
    await esperar('Recepción de prefacturas');
    await llenar('input[formcontrolname="ingreso"]', '1234');
    await pulsar('Consultar ingreso');
    await esperar('Paciente de prueba');
    await page.$eval(
      'input[type=file]',
      (el, bytes) => {
        const dt = new DataTransfer();
        dt.items.add(
          new File([Uint8Array.from(bytes)], 'prefactura-prueba.pdf', { type: 'application/pdf' })
        );
        el.files = dt.files;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      [...pdf()]
    );
    await esperar('Comprobar datos de recepción');
    await page.click('input[formcontrolname="netoConfirmado"]');
    await page.screenshot({ path: path.join(qa, 'recepcion-desktop.png'), fullPage: true });
    await pulsar('Registrar recepción');
    await esperar('Ingreso 1234 recibido');
    await pulsar('Continuar con la asignación');
    await esperar('Hallazgos de auditoría');
    await pulsar('Asignar responsable');
    await page.waitForSelector('dialog[open] select[formcontrolname="responsableId"]');
    await page.$eval('dialog[open] select[formcontrolname="responsableId"]', e => {
      e.selectedIndex = 1;
      e.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await pulsar('Confirmar', 'dialog[open]');
    await esperar('Iniciar auditoría');
    await pulsar('Iniciar auditoría');
    await esperar('Agregar hallazgo');
    await pulsar('Agregar hallazgo');
    await page.click('dialog[open] .p-select-dropdown');
    await page.waitForSelector('.p-select-option');
    await page.click('.p-select-option');
    await llenar('dialog[open] input[formcontrolname="servicio"]', 'Consulta de prueba');
    await llenar('dialog[open] input[formcontrolname="motivo"]', 'Revisión de soporte');
    await page.select('dialog[open] select[formcontrolname="area"]', 'Facturación');
    await llenar(
      'dialog[open] textarea[formcontrolname="descripcion"]',
      'Descripción de prueba del hallazgo.'
    );
    await llenar('dialog[open] input[formcontrolname="valorUnitario"]', '100');
    await page.select('dialog[open] select[formcontrolname="destino"]', 'preglosa');
    await pulsar('Aplicar hallazgo', 'dialog[open]');
    await esperar('Descripción de prueba del hallazgo.');
    await pulsar('Guardar cambios');
    await page.waitForFunction(() => !document.body.innerText.includes('Guardando borrador…'));
    await page.screenshot({ path: path.join(qa, 'auditoria-desktop.png'), fullPage: true });
    await pulsar('Vista previa y finalizar');
    await esperar('Confirmar finalización');
    await pulsar('Confirmar finalización', 'dialog[open]');
    await esperar('Auditoría finalizada.');
    await pulsar('Ir a entregas');
    await esperar('Finalizados por entregar');
    await page.waitForSelector('input[type=checkbox]');
    await page.click('input[type=checkbox]');
    await pulsar('Confirmar entrega');
    await esperar('ENT-PRUEBA');
    await pulsar('Cerrar', 'dialog[open]');
    await pulsar('Resumen');
    await esperar('Resumen de preauditoría');
    await page.screenshot({ path: path.join(qa, 'resumen-desktop.png'), fullPage: true });
    for (const [menu, titulo] of [
      ['Reportes y alertas', 'Actividad del período'],
      ['Mis horas extras', 'Horas registradas'],
      ['Configuración', 'Salarios por fecha de vigencia'],
    ]) {
      await pulsar(menu);
      await esperar(titulo);
    }
    await pulsar('Resumen');
    await page.waitForSelector('.pre-cards');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(
      () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    );
    await page.screenshot({ path: path.join(qa, 'resumen-mobile.png'), fullPage: true });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    assert.equal(overflow, false, 'La página no debe desbordar horizontalmente en móvil');
    assert.equal(registro.estado, 'Entregado');
    assert.equal(registro.hallazgos[0].destino, 'preglosa');
    assert.equal(entregas.length, 1);
    assert.deepEqual(errores, []);
    console.log(
      JSON.stringify({
        resultado: 'ok',
        recepcion: true,
        auditoria: true,
        finalizacion: true,
        entrega: true,
        pantallas: 8,
        movilSinDesborde: true,
        capturas: qa,
      })
    );
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
}
main().catch(e => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
