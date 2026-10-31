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
  return { service, invima, socrata, conn, getRepository, init, save };
}
describe('Recepción de factura INVIMA: persistencia y límites de contexto', () => {
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
      lotes: [],
    });
    expect(r.renglones[0].facturado.cantidad).toBe(50);
  });
  it('guarda físico 60 / CUM diferente en otro producto, no lo lista Sin factura y consulta solo sus códigos', async () => {
    const s = setup();
    let r = await s.init();
    Object.assign(r.renglones[0].fisico, {
      cantidad: 60,
      descripcion: 'Producto recibido',
      codigoDeclarado: '000122-01',
    });
    r = await s.save(r);
    expect(r.renglones[0].diferencias).toMatchObject({ sobrante: 10, cum: 'DIFIERE' });
    expect(r.renglones[0].productoId).not.toBe(1);
    await s.invima.verificar(r.renglones[0].productoId!);
    expect(s.socrata.consultar.mock.calls[0][2]).toContain('expedientecum = 122');
    expect(await s.invima.listar(undefined, true)).not.toContainEqual(
      expect.objectContaining({ id: r.renglones[0].productoId })
    );
    const original = await s.getRepository(Producto).findOneBy({ id: 1 });
    expect(JSON.parse(original.datos).cum).toBe('000123-01');
    expect(await s.invima.historial(1)).toEqual([]);
  });
  it('cambiar cantidades conserva consulta; cambiar código la deja pendiente, conserva historial', async () => {
    const s = setup();
    let r = await s.init();
    Object.assign(r.renglones[0].fisico, {
      cantidad: 60,
      descripcion: 'Recibido',
      codigoDeclarado: '000123-01',
    });
    r = await s.save(r);
    const id = r.renglones[0].productoId!;
    await s.invima.verificar(id);
    r = await s.service.detalle(1);
    r!.renglones[0].fisico.cantidad = 61;
    r = await s.save(r);
    let p = await s.getRepository(Producto).findOneBy({ id });
    expect(p.version).toBe(1);
    expect(p.ultimaVerificacionId).not.toBeNull();
    r.renglones[0].fisico.codigoDeclarado = '000122-01';
    r = await s.save(r);
    p = await s.getRepository(Producto).findOneBy({ id });
    expect(p.version).toBe(2);
    expect(p.ultimaVerificacionId).toBeNull();
    expect(await s.invima.historial(id)).toHaveLength(1);
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
  it('finaliza recepción cero, bloquea edición/verificación física, conserva historial de lectura', async () => {
    const s = setup();
    let r = await s.init();
    r.renglones[0].fisico.cantidad = 0;
    r.renglones[0].decision = 'NO_RECIBIDO';
    r = await s.save(r);
    r = await s.service.finalizar(1, r.version);
    expect(r.estado).toBe('FINALIZADA');
    await expect(s.save(r)).rejects.toMatchObject({ status: 409 });
    const p = await s.getRepository(Producto).findOneBy({ id: r.renglones[0].productoId });
    await expect(
      s.invima.editar(p.id, { ...JSON.parse(p.datos), version: p.version })
    ).rejects.toMatchObject({ status: 409 });
    await expect(s.invima.verificar(p.id)).rejects.toMatchObject({ status: 400 });
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
    await expect(s.invima.historial(r.renglones[0].productoId!)).rejects.toMatchObject({
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
  it('consulta física fallida permite decisión documentada y conserva el resultado oficial incompleto', async () => {
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
    const v = await s.invima.verificar(r.renglones[0].productoId!);
    expect(v.resultado).toBe('INCOMPLETA');
    r.renglones[0].decision = 'ACEPTADO';
    await expect(s.save(r)).rejects.toMatchObject({ status: 400 });
    r.renglones[0].justificacion =
      'Aceptación excepcional documentada por inspector; consulta oficial no disponible.';
    r = await s.save(r);
    expect((await s.service.finalizar(1, r.version)).estado).toBe('FINALIZADA');
    expect((await s.invima.historial(r.renglones[0].productoId!))[0].resultado).toBe('INCOMPLETA');
    expect(await s.invima.historial(1)).toEqual([]);
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
    expect(await s.invima.historial(r.renglones[0].productoId!)).toEqual([]);
  });
});
