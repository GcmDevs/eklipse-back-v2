import { RecepcionInvimaService } from './recepcion.service';
import { InvimaService } from './invima.service';
import {
  InvimaFacturaOrm as Factura,
  InvimaFacturaItemOrm as Linea,
  InvimaProductoOrm as Producto,
  InvimaRecepcionOrm as Recepcion,
  InvimaRecepcionItemOrm as Item,
  InvimaVerificacionOrm as Verificacion,
  InvimaConfirmacionOrm as Confirmacion,
} from '@inn/orm/inn/invima';
jest.mock('@common/infrastructure/services', () => ({
  BaseSource: class {
    conn: any;
    auth: any;
    constructor(r: any) {
      this.conn = r.connection;
      this.auth = r.auth;
    }
  },
}));
function setup() {
  const tables = new Map<any, any[]>();
  const copy = (v: any) => (v == null ? v : structuredClone(v));
  const getRepository = (type: any): any => {
    if (!tables.has(type)) tables.set(type, []);
    const rows = tables.get(type)!;
    const match = (r: any, w: any) => Object.entries(w || {}).every(([k, v]) => r[k] === v);
    const find = (w: any) => copy(rows.find(r => match(r, w)) || null);
    return {
      findOne: async ({ where }: any) => find(where),
      findOneBy: async (w: any) => find(w),
      findOneByOrFail: async (w: any) => {
        const r = find(w);
        if (!r) throw Error('Missing');
        return r;
      },
      find: async ({ where }: any = {}) => copy(rows.filter(r => match(r, where))),
      save: async (v: any) => {
        const r = { ...v, id: v.id || rows.length + 1 };
        const i = rows.findIndex(x => x.id === r.id);
        i < 0 ? rows.push(copy(r)) : rows.splice(i, 1, copy(r));
        return copy(r);
      },
      createQueryBuilder: () => {
        let ids: number[] | undefined;
        let exclude = false;
        const q: any = {};
        for (const k of [
          'where',
          'andWhere',
          'orderBy',
          'innerJoin',
          'leftJoin',
          'select',
          'addSelect',
        ])
          q[k] = (sql: string, params?: any) => {
            if (params?.ids) ids = params.ids;
            if (
              typeof sql === 'string' &&
              sql.startsWith('NOT EXISTS (SELECT 1 FROM EKINNIVRECEPCIONITEM ri WHERE')
            )
              exclude = true;
            return q;
          };
        q.getRawMany = async () => [];
        q.getMany = async () =>
          copy(
            rows.filter(
              r =>
                (!ids || ids.includes(r.id)) &&
                (!exclude || !(tables.get(Item) || []).some(i => i.productoId === r.id))
            )
          );
        return q;
      },
    };
  };
  const manager = { getRepository };
  const conn: any = {
    manager,
    getRepository,
    transaction: async (fn: any) => {
      const old = [...tables].map(([k, v]) => [k, copy(v)]);
      try {
        return await fn(manager);
      } catch (e) {
        tables.clear();
        for (const [k, v] of old) tables.set(k, v);
        throw e;
      }
    },
  };
  const req: any = { connection: conn, auth: { id: 10, user: { fullName: 'Inspector' } } };
  const socrata: any = {
    consultar: jest.fn(async (f: any, c: any, w: any) => ({
      fuente: f,
      criterio: c,
      where: w,
      consultadaEn: '2026-10-30',
      actualizadaEn: 1,
      paginas: [{ offset: 0, hayMas: false, candidatos: [] }],
    })),
  };
  const invima = new InvimaService(req, socrata);
  const service = new RecepcionInvimaService(req, invima);
  const init = async () => {
    await getRepository(Factura).save({
      id: 1,
      estado: 'REVISADA',
      version: 2,
      fechaEliminacion: null,
    });
    const p = await invima.crear({
      tipo: 'MEDICAMENTO',
      nombre: 'Producto facturado',
      cum: '000123-01',
      registroSanitario: '2020M-123',
    });
    await getRepository(Linea).save({
      id: 1,
      facturaId: 1,
      productoId: p.id,
      orden: 1,
      excluido: false,
      datos: JSON.stringify({
        tipo: 'MEDICAMENTO',
        descripcion: 'Producto facturado',
        codigoDeclarado: '000123-01',
        registroSanitario: '2020M-123',
        cantidad: 50,
        unidadMedida: 'UN',
      }),
    });
    return service.iniciar(1);
  };
  const save = (r: any) =>
    service.guardar(1, r.renglones[0].id, { ...r.renglones[0], recepcionVersion: r.version });
  const draft = (r: any) =>
    service.guardarBorrador(1, r.renglones[0].id, {
      ...r.renglones[0],
      recepcionVersion: r.version,
    });
  const verificarFactura = async (resultado = 'EXACTA') => {
    const v = await invima.verificar(1);
    const guardada = await getRepository(Verificacion).findOneBy({ id: v.id });
    guardada.resultado = resultado;
    await getRepository(Verificacion).save(guardada);
    return guardada;
  };
  return { service, invima, socrata, conn, getRepository, init, save, draft, verificarFactura };
}
function completar(r: any) {
  Object.assign(r.renglones[0].fisico, {
    cantidad: 50,
    descripcion: 'Producto recibido',
    codigoDeclarado: '000123-01',
    registroSanitario: '2020M-123',
    riesgo: 'II',
    marca: 'Marca',
    concentracion: '10',
    unidadConcentracion: 'mg',
    temperatura: 20,
    estadoEmpaque: 'BUENO',
    registroSanitarioRevisado: true,
    etiquetaConforme: true,
    sellosConformes: true,
    fabricanteConforme: true,
    lotes: [{ cantidad: 50, lote: 'L1', vencimiento: '2028-01-01' }],
  });
  r.renglones[0].decision = 'ACEPTADO';
  return r;
}
describe('Recepción de factura INVIMA: persistencia y límites de contexto', () => {
  it('guarda y recarga un borrador incompleto sin alterar la captura, decisión, muestreo o verificación confirmados', async () => {
    const s = setup();
    let r = completar(await s.init());
    expect(r.renglones[0].borrador).toBeNull();
    await s.verificarFactura();
    r = await s.save(r);
    const confirmado = structuredClone(r.renglones[0]);
    const consultas = s.socrata.consultar.mock.calls.length;
    const historial = await s.invima.historial(1);
    const version = r.version;
    Object.assign(r.renglones[0].fisico, {
      cantidad: -2,
      cantidadAveria: null,
      cantidadNoSolicitada: 8,
      erroresCriticos: -1.5,
      lotes: [{ cantidad: 0, lote: '', vencimiento: '2028-' }],
      borradorRecepcion: { usuarioId: 999, texto: 'Metadata no autorizada' },
    });
    r.renglones[0].decision = 'RECHAZADO';
    r.renglones[0].justificacion = '  Captura sin terminar  ';
    r = await s.draft(r);
    expect(r.version).toBe(version + 1);
    expect(r.renglones[0].version).toBe(confirmado.version + 1);
    expect(r.renglones[0].fisico).toEqual(confirmado.fisico);
    expect(r.renglones[0].decision).toBe('ACEPTADO');
    expect(r.renglones[0].justificacion).toBe(confirmado.justificacion);
    expect(r.renglones[0].muestreo).toEqual(confirmado.muestreo);
    expect(r.renglones[0].diferencias).toMatchObject({ faltante: 0, sobrante: 0 });
    expect(r.renglones[0].borrador).toMatchObject({
      fisico: {
        cantidad: -2,
        cantidadAveria: null,
        erroresCriticos: -1.5,
        lotes: [{ cantidad: 0, lote: '', vencimiento: '2028-' }],
      },
      decision: 'RECHAZADO',
      justificacion: '  Captura sin terminar  ',
      usuarioId: 10,
      usuarioNombre: 'Inspector',
      fecha: expect.any(String),
    });
    expect(r.renglones[0].borrador.fisico).not.toHaveProperty('borradorRecepcion');
    expect(Number.isFinite(Date.parse(r.renglones[0].borrador.fecha))).toBe(true);
    expect(await s.service.detalle(1)).toEqual(r);
    expect(s.socrata.consultar).toHaveBeenCalledTimes(consultas);
    expect(await s.invima.historial(1)).toEqual(historial);
    expect(await s.getRepository(Producto).find()).toHaveLength(1);
    const json = JSON.parse(
      (await s.getRepository(Item).findOneBy({ id: r.renglones[0].id })).fisico
    );
    expect(json.cantidad).toBe(50);
    expect(json.borradorRecepcion).toEqual(r.renglones[0].borrador);
    expect(r.renglones[0].fisico).not.toHaveProperty('borradorRecepcion');
  });
  it('no finaliza con borrador pendiente, conserva el borrador ante validación fallida y lo limpia solo al confirmar producto válido', async () => {
    const s = setup();
    let r = completar(await s.init());
    await s.verificarFactura();
    r = await s.save(r);
    r.renglones[0].fisico.cantidadAveria = 60;
    r = await s.draft(r);
    await expect(s.service.finalizar(1, r.version)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('capturas parciales'),
    });
    const draft = structuredClone(r.renglones[0].borrador);
    r.renglones[0].fisico = draft.fisico;
    await expect(s.save(r)).rejects.toMatchObject({ status: 400 });
    r = await s.service.detalle(1);
    expect(r!.renglones[0].borrador).toEqual(draft);
    r.renglones[0].fisico.cantidadAveria = 2;
    r.renglones[0].fisico.borradorRecepcion = { decision: 'RECHAZADO' };
    r = await s.save(r);
    expect(r.renglones[0].borrador).toBeNull();
    expect(r.renglones[0].fisico).not.toHaveProperty('borradorRecepcion');
    expect(
      JSON.parse((await s.getRepository(Item).findOneBy({ id: r.renglones[0].id })).fisico)
    ).not.toHaveProperty('borradorRecepcion');
    expect((await s.service.finalizar(1, r.version)).estado).toBe('FINALIZADA');
  });
  it('no guarda borradores obsoletos de otra recepción ni sobrescribe al perder una respuesta', async () => {
    const s = setup();
    let r = await s.init();
    const anterior = structuredClone(r);
    r.renglones[0].fisico.descripcion = 'Avance protegido';
    r = await s.draft(r);
    await expect(s.draft(anterior)).rejects.toMatchObject({ status: 409 });
    const conflictoRenglon = structuredClone(r);
    conflictoRenglon.renglones[0].version--;
    await expect(s.draft(conflictoRenglon)).rejects.toMatchObject({ status: 409 });
    expect((await s.service.detalle(1))!.renglones[0].borrador!.fisico.descripcion).toBe(
      'Avance protegido'
    );
    await expect(
      s.service.guardarBorrador(1, 999, {
        ...r.renglones[0],
        decision: 'PENDIENTE',
        recepcionVersion: r.version,
      })
    ).rejects.toMatchObject({ status: 404 });
    await expect(setup().draft(r)).rejects.toMatchObject({ status: 404 });
  });
  it('bloquea borradores en documentos eliminados, sin revisar, renglones ajenos y recepciones finalizadas', async () => {
    const s = setup();
    let r = await s.init();
    const factura = await s.getRepository(Factura).findOneBy({ id: 1 });
    factura.fechaEliminacion = new Date();
    await s.getRepository(Factura).save(factura);
    await expect(s.draft(r)).rejects.toMatchObject({ status: 404 });
    factura.fechaEliminacion = null;
    factura.estado = 'BORRADOR';
    await s.getRepository(Factura).save(factura);
    await expect(s.draft(r)).rejects.toMatchObject({ status: 409 });
    factura.estado = 'REVISADA';
    await s.getRepository(Factura).save(factura);
    const linea = await s.getRepository(Linea).findOneBy({ id: 1 });
    linea.facturaId = 999;
    await s.getRepository(Linea).save(linea);
    await expect(s.draft(r)).rejects.toMatchObject({ status: 404 });
    linea.facturaId = 1;
    await s.getRepository(Linea).save(linea);
    r.renglones[0].fisico.cantidad = 0;
    r.renglones[0].decision = 'NO_RECIBIDO';
    r = await s.save(r);
    r = await s.service.finalizar(1, r.version);
    await expect(s.draft(r)).rejects.toMatchObject({ status: 409 });
  });
  it('conserva los valores sanitarios y una captura histórica al reemplazar borradores desde clientes antiguos', async () => {
    const s = setup();
    let r = await s.init();
    const row = await s.getRepository(Item).findOneBy({ id: r.renglones[0].id });
    const fisico = JSON.parse(row.fisico);
    delete fisico.registroSanitarioRevisado;
    row.fisico = JSON.stringify(fisico);
    await s.getRepository(Item).save(row);
    r = await s.service.detalle(1);
    expect(r!.renglones[0].borrador).toBeNull();
    r = await s.draft(r);
    expect(r.renglones[0].borrador!.fisico.registroSanitarioRevisado).toBeUndefined();
    r.renglones[0].fisico.registroSanitarioRevisado = true;
    r = await s.draft(r);
    delete r.renglones[0].fisico.registroSanitarioRevisado;
    r = await s.draft(r);
    expect(r.renglones[0].fisico.registroSanitarioRevisado).toBeUndefined();
    expect(r.renglones[0].borrador!.fisico.registroSanitarioRevisado).toBe(true);
  });
  it('corregir un producto facturado deja pendiente también la decisión del borrador, conservando su captura y justificación', async () => {
    const s = setup();
    let r = completar(await s.init());
    r.renglones[0].justificacion = 'Inspección parcial respaldada';
    r = await s.draft(r);
    const borrador = structuredClone(r.renglones[0].borrador!);
    expect(borrador.decision).toBe('ACEPTADO');
    await s.invima.editar(1, {
      nombre: 'Producto corregido',
      tipo: 'MEDICAMENTO',
      cum: '000124-01',
      codigoDeclarado: '000124-01',
      version: 1,
    });
    r = await s.service.detalle(1);
    expect(r!.renglones[0].decision).toBe('PENDIENTE');
    expect(r!.renglones[0].borrador).toEqual({ ...borrador, decision: 'PENDIENTE' });
  });
  it('acepta y finaliza usando solo la verificación actual de factura sin productos físicos', async () => {
    const s = setup();
    let r = completar(await s.init());
    await s.verificarFactura();
    r = await s.save(r);
    expect(r.renglones[0].productoId).toBeNull();
    expect((await s.service.finalizar(1, r.version)).estado).toBe('FINALIZADA');
    expect(await s.getRepository(Producto).find()).toHaveLength(1);
    expect(await s.invima.historial(1)).toHaveLength(1);
  });
  it('las diferencias físicas conservan la decisión manual y requieren justificación aun con factura exacta', async () => {
    const s = setup();
    let r = completar(await s.init());
    await s.verificarFactura();
    r.renglones[0].fisico.codigoDeclarado = '000122-01';
    await expect(s.save(r)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('Justifique'),
    });
    r.renglones[0].justificacion = 'Inspector documenta diferencia del CUM físico.';
    r = await s.save(r);
    expect(r.renglones[0].diferencias.cum).toBe('DIFIERE');
    expect(r.renglones[0].productoId).toBeNull();
  });
  it('una consulta de factura sin coincidencias permite aceptación solo con justificación', async () => {
    const s = setup();
    let r = completar(await s.init());
    await s.verificarFactura('SIN_COINCIDENCIAS');
    await expect(s.save(r)).rejects.toMatchObject({ status: 400 });
    r.renglones[0].justificacion =
      'Aceptación excepcional documentada; sin coincidencias oficiales.';
    r = await s.save(r);
    expect((await s.service.finalizar(1, r.version)).estado).toBe('FINALIZADA');
  });
  it('usa la asociación actual de factura, ignorando el producto físico y el id del snapshot', async () => {
    const s = setup();
    let r = completar(await s.init());
    const legacy = await s.invima.crear({
      nombre: 'Físico antiguo',
      tipo: 'MEDICAMENTO',
      cum: '000122-01',
    });
    const v = await s.invima.verificar(legacy.id);
    const guardada = await s.getRepository(Verificacion).findOneBy({ id: v.id });
    guardada.resultado = 'EXACTA';
    await s.getRepository(Verificacion).save(guardada);
    const item = await s.getRepository(Item).findOneBy({ id: r.renglones[0].id });
    item.productoId = legacy.id;
    item.facturado = JSON.stringify({ ...JSON.parse(item.facturado), productoId: legacy.id });
    await s.getRepository(Item).save(item);
    r = completar(await s.service.detalle(1));
    r.renglones[0].justificacion = 'Verificación pendiente de los datos facturados.';
    await expect(s.save(r)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('producto facturado'),
    });
  });
  it.each(['versionProducto', 'productoId'])(
    'ignora evidencia y confirmación ajenas a la %s actual',
    async campo => {
      const s = setup();
      const r = completar(await s.init());
      const v = await s.verificarFactura('REVISION');
      v[campo] = 999;
      await s.getRepository(Verificacion).save(v);
      await s.getRepository(Confirmacion).save({ verificacionId: v.id, candidato: '{}' });
      r.renglones[0].justificacion = 'Se requiere consulta vigente del producto facturado.';
      await expect(s.save(r)).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('producto facturado'),
      });
    }
  );
  it('acepta una coincidencia de factura confirmada y revalida su versión al finalizar', async () => {
    const s = setup();
    let r = completar(await s.init());
    const v = await s.verificarFactura('REVISION');
    await s.getRepository(Confirmacion).save({ verificacionId: v.id, candidato: '{}' });
    r.renglones[0].justificacion = 'Referencia revisada y confirmada por inspector.';
    r = await s.save(r);
    const p = await s.getRepository(Producto).findOneBy({ id: 1 });
    p.version++;
    await s.getRepository(Producto).save(p);
    await expect(s.service.finalizar(1, r.version)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('producto facturado'),
    });
  });
  it.each(['excluido', 'facturaId'])(
    'rechaza un renglón de factura fuera del alcance por %s',
    async campo => {
      const s = setup();
      const r = completar(await s.init());
      await s.verificarFactura();
      const linea = await s.getRepository(Linea).findOneBy({ id: 1 });
      linea[campo] = campo === 'excluido' ? true : 999;
      await s.getRepository(Linea).save(linea);
      await expect(s.save(r)).rejects.toMatchObject({ status: 404 });
    }
  );
  it('corregir factura actualiza referencia, audita y deja pendiente solo la decisión, sin tocar captura ni evidencia física', async () => {
    const s = setup();
    let r = await s.init();
    r.renglones[0].fisico.cantidad = 0;
    r.renglones[0].decision = 'NO_RECIBIDO';
    r = await s.save(r);
    await s.invima.verificar(1);
    const anterior = r.renglones[0];
    const version = r.version;
    await s.invima.editar(1, {
      tipo: 'MEDICAMENTO',
      nombre: 'Producto corregido',
      cum: '000124-01',
      codigoDeclarado: '000124-01',
      registroSanitario: '2020M-124',
      version: 1,
    });
    r = await s.service.detalle(1);
    expect(r.version).toBe(version + 1);
    expect(r.renglones[0].version).toBe(anterior.version + 1);
    expect(r.renglones[0]).toMatchObject({
      decision: 'PENDIENTE',
      facturado: { descripcion: 'Producto corregido', cantidad: 50, codigoDeclarado: '000124-01' },
    });
    expect(r.renglones[0].fisico).toEqual(anterior.fisico);
    expect((r.renglones[0].facturado as any).correccionesRecepcion[0]).toMatchObject({
      decisionAnterior: 'NO_RECIBIDO',
      usuarioNombre: 'Inspector',
      anterior: { codigoDeclarado: '000123-01' },
    });
    expect(await s.invima.historial(1)).toHaveLength(1);
    expect((await s.getRepository(Producto).findOneBy({ id: 1 })).ultimaVerificacionId).toBeNull();
    await expect(s.invima.editar(1, { nombre: 'Obsoleto', version: 1 })).rejects.toMatchObject({
      status: 409,
    });
    await expect(s.service.finalizar(1, r.version)).rejects.toMatchObject({ status: 400 });
    r.renglones[0].decision = 'NO_RECIBIDO';
    r = await s.save(r);
    await s.service.finalizar(1, r.version);
    await expect(s.invima.editar(1, { nombre: 'No permitido', version: 2 })).rejects.toMatchObject({
      status: 409,
    });
  });
  it('inicia una sola recepción y deja vacíos los datos físicos, conserva 50 de factura', async () => {
    const s = setup();
    const r = await s.init();
    expect(await s.service.iniciar(1)).toEqual(r);
    expect(r.renglones[0].fisico).toMatchObject({
      cantidad: null,
      descripcion: '',
      codigoDeclarado: '',
      registroSanitarioRevisado: false,
      lotes: [],
    });
    expect(r.renglones[0].facturado.cantidad).toBe(50);
  });
  it('guarda y recarga la revisión manual; omitirla desde un cliente antiguo conserva el valor', async () => {
    const s = setup();
    let r = await s.init();
    r.renglones[0].fisico.registroSanitarioRevisado = true;
    r = await s.save(r);
    expect((await s.service.detalle(1))!.renglones[0].fisico.registroSanitarioRevisado).toBe(true);
    const producto = await s.getRepository(Producto).findOneBy({ id: 1 });
    delete r.renglones[0].fisico.registroSanitarioRevisado;
    r = await s.save(r);
    expect(r.renglones[0].fisico.registroSanitarioRevisado).toBe(true);
    r.renglones[0].fisico.registroSanitarioRevisado = false;
    r = await s.save(r);
    delete r.renglones[0].fisico.registroSanitarioRevisado;
    r = await s.save(r);
    expect(r.renglones[0].fisico.registroSanitarioRevisado).toBe(false);
    expect((await s.getRepository(Producto).findOneBy({ id: producto.id })).version).toBe(
      producto.version
    );
  });
  it('no añade ni marca revisión sanitaria a una captura antigua al leer o guardar sin el campo', async () => {
    const s = setup();
    let r = await s.init();
    const row = await s.getRepository(Item).findOneBy({ id: r.renglones[0].id });
    const legacy = JSON.parse(row.fisico);
    delete legacy.registroSanitarioRevisado;
    row.fisico = JSON.stringify(legacy);
    await s.getRepository(Item).save(row);
    r = await s.service.detalle(1);
    expect(r!.renglones[0].fisico.registroSanitarioRevisado).toBeUndefined();
    r = await s.save(r);
    expect(r.renglones[0].fisico.registroSanitarioRevisado).toBeUndefined();
    expect(
      JSON.parse((await s.getRepository(Item).findOneBy({ id: row.id })).fisico)
    ).not.toHaveProperty('registroSanitarioRevisado');
  });
  it('guarda físico 60 / CUM diferente sin crear productos ni hacer una segunda consulta', async () => {
    const s = setup();
    let r = await s.init();
    Object.assign(r.renglones[0].fisico, {
      cantidad: 60,
      descripcion: 'Producto recibido',
      codigoDeclarado: '000122-01',
    });
    r = await s.save(r);
    expect(r.renglones[0].diferencias).toMatchObject({ sobrante: 10, cum: 'DIFIERE' });
    expect(r.renglones[0].productoId).toBeNull();
    expect(r.renglones[0].producto).toBeNull();
    expect(await s.getRepository(Producto).find()).toHaveLength(1);
    expect(s.socrata.consultar).not.toHaveBeenCalled();
    const original = await s.getRepository(Producto).findOneBy({ id: 1 });
    expect(JSON.parse(original.datos).cum).toBe('000123-01');
    expect(await s.invima.historial(1)).toEqual([]);
  });
  it('conserva productos físicos y evidencia antiguos sin modificarlos al cambiar cantidades o códigos', async () => {
    const s = setup();
    let r = await s.init();
    Object.assign(r.renglones[0].fisico, {
      cantidad: 60,
      descripcion: 'Recibido',
      codigoDeclarado: '000123-01',
    });
    r = await s.save(r);
    const legacy = await s.invima.crear({
      tipo: 'MEDICAMENTO',
      nombre: 'Físico antiguo',
      cum: '000123-01',
    });
    const id = legacy.id;
    const item = await s.getRepository(Item).findOneBy({ id: r.renglones[0].id });
    item.productoId = id;
    await s.getRepository(Item).save(item);
    await s.invima.verificar(id);
    const evidencia = await s.invima.historial(id);
    r = await s.service.detalle(1);
    r!.renglones[0].fisico.cantidad = 61;
    r = await s.save(r);
    let p = await s.getRepository(Producto).findOneBy({ id });
    expect(p.version).toBe(1);
    expect(p.ultimaVerificacionId).not.toBeNull();
    r.renglones[0].fisico.codigoDeclarado = '000122-01';
    r = await s.save(r);
    p = await s.getRepository(Producto).findOneBy({ id });
    expect(p.version).toBe(1);
    expect(p.ultimaVerificacionId).not.toBeNull();
    expect(await s.invima.historial(id)).toEqual(evidencia);
    expect(r.renglones[0].productoId).toBe(id);
    expect(JSON.parse(p.datos).cum).toBe('000123-01');
    expect(await s.invima.listar(undefined, true)).not.toContainEqual(
      expect.objectContaining({ id })
    );
  });
  it('rechaza versiones obsoletas sin sobrescribir y exige decisión en cada renglón', async () => {
    const s = setup();
    let r = await s.init();
    const old = structuredClone(r);
    r.renglones[0].fisico.cantidad = 0;
    r = await s.save(r);
    await expect(s.save(old)).rejects.toMatchObject({ status: 409 });
    await expect(s.service.finalizar(1, r.version)).rejects.toMatchObject({ status: 400 });
    expect((await s.service.detalle(1))!.renglones[0].fisico.cantidad).toBe(0);
  });
  it('finaliza recepción cero sin crear producto físico y bloquea la edición de la factura', async () => {
    const s = setup();
    let r = await s.init();
    r.renglones[0].fisico.cantidad = 0;
    r.renglones[0].decision = 'NO_RECIBIDO';
    r = await s.save(r);
    r = await s.service.finalizar(1, r.version);
    expect(r.estado).toBe('FINALIZADA');
    await expect(s.save(r)).rejects.toMatchObject({ status: 409 });
    expect(r.renglones[0].productoId).toBeNull();
    const p = await s.getRepository(Producto).findOneBy({ id: 1 });
    await expect(
      s.invima.editar(p.id, { ...JSON.parse(p.datos), version: p.version })
    ).rejects.toMatchObject({ status: 409 });
    expect(await s.invima.historial(p.id)).toEqual([]);
  });
  it('documentos borrador, eliminados y otra conexión no acceden a recepción ni a productos físicos', async () => {
    const s = setup();
    let r = await s.init();
    r = await s.save(r);
    await expect(setup().service.detalle(1)).rejects.toMatchObject({ status: 404 });
    let f = await s.getRepository(Factura).findOneBy({ id: 1 });
    f.fechaEliminacion = new Date();
    await s.getRepository(Factura).save(f);
    await expect(s.service.detalle(1)).rejects.toMatchObject({ status: 404 });
    await expect(s.invima.historial(1)).rejects.toMatchObject({
      status: 404,
    });
    f.fechaEliminacion = null;
    f.estado = 'BORRADOR';
    await s.getRepository(Factura).save(f);
    await expect(s.service.iniciar(1)).rejects.toMatchObject({ status: 409 });
  });
  it('validación fallida revierte producto y captura dentro de la transacción', async () => {
    const s = setup();
    const r = await s.init();
    r.renglones[0].fisico.cantidad = 60;
    r.renglones[0].fisico.cantidadAveria = 61;
    await expect(s.save(r)).rejects.toMatchObject({ status: 400 });
    expect(await s.getRepository(Producto).find()).toHaveLength(1);
    expect((await s.service.detalle(1))!.version).toBe(1);
  });
  it('consulta facturada fallida permite decisión documentada sin producto físico y conserva evidencia incompleta', async () => {
    const s = setup();
    let r = await s.init();
    Object.assign(r.renglones[0].fisico, {
      cantidad: 50,
      descripcion: 'Recibido',
      codigoDeclarado: '000123-01',
      registroSanitario: '2020M-123',
      riesgo: 'II',
      marca: 'Marca',
      concentracion: '10',
      unidadConcentracion: 'mg',
      temperatura: 20,
      estadoEmpaque: 'BUENO',
      registroSanitarioRevisado: true,
      etiquetaConforme: true,
      sellosConformes: true,
      fabricanteConforme: true,
      lotes: [{ cantidad: 50, lote: 'L1', vencimiento: '2028-01-01' }],
    });
    r = await s.save(r);
    s.socrata.consultar.mockImplementation(async (fuente, criterio, where) => ({
      fuente,
      criterio,
      where,
      paginas: [],
      error: 'Tiempo agotado',
    }));
    const v = await s.invima.verificar(1);
    expect(v.resultado).toBe('INCOMPLETA');
    r.renglones[0].decision = 'ACEPTADO';
    await expect(s.save(r)).rejects.toMatchObject({ status: 400 });
    r.renglones[0].justificacion =
      'Aceptación excepcional documentada por inspector; consulta oficial no disponible.';
    r.renglones[0].fisico.registroSanitarioRevisado = false;
    await expect(s.save(r)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('controles'),
    });
    r.renglones[0].fisico.registroSanitarioRevisado = true;
    r = await s.save(r);
    const guardado = await s.getRepository(Item).findOneBy({ id: r.renglones[0].id });
    const captura = JSON.parse(guardado.fisico);
    guardado.fisico = JSON.stringify({ ...captura, registroSanitarioRevisado: false });
    await s.getRepository(Item).save(guardado);
    await expect(s.service.finalizar(1, r.version)).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('controles'),
    });
    guardado.fisico = JSON.stringify(captura);
    await s.getRepository(Item).save(guardado);
    expect((await s.service.finalizar(1, r.version)).estado).toBe('FINALIZADA');
    expect(r.renglones[0].productoId).toBeNull();
    expect((await s.invima.historial(1))[0].resultado).toBe('INCOMPLETA');
  });
  it('vital no disponible finaliza mediante comprobación documental sin consultas externas', async () => {
    const s = setup();
    let r = await s.init();
    Object.assign(r.renglones[0].fisico, {
      tipo: 'VITAL_NO_DISPONIBLE',
      cantidad: 5,
      descripcion: 'Vital recibido',
      ium: 'IUM-A001',
      riesgo: 'II',
      marca: 'Marca',
      concentracion: '10',
      unidadConcentracion: 'mg',
      temperatura: 20,
      estadoEmpaque: 'BUENO',
      etiquetaConforme: true,
      sellosConformes: true,
      lotes: [{ cantidad: 5, lote: 'V1', vencimiento: '2028-01-01' }],
    });
    r.renglones[0].decision = 'ACEPTADO';
    r.renglones[0].justificacion = 'Tipo corregido mediante resolución y soporte documental.';
    r = await s.save(r);
    expect((await s.service.finalizar(1, r.version)).estado).toBe('FINALIZADA');
    expect(s.socrata.consultar).not.toHaveBeenCalled();
    expect(r.renglones[0].productoId).toBeNull();
    expect(await s.invima.historial(1)).toEqual([]);
  });
});
