import { FacturasInvimaService } from './facturas.service';
import { InvimaService } from './invima.service';
import {
  InvimaFacturaItemOrm,
  InvimaFacturaOrm,
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaConfirmacionOrm,
  InvimaRecepcionOrm,
  InvimaRecepcionItemOrm,
} from '@inn/orm/inn/invima';
import { GuardarFacturaDto } from '../presentation/factura.dto';
import { GRUPOS_REGISTROS, TipoProductoInvima } from '../domain/invima.models';
import { fisicoVacio } from '../domain/recepcion.models';

jest.mock('@common/infrastructure/services', () => ({
  BaseSource: class {
    protected conn: any;
    protected auth: any;
    constructor(request: any) {
      this.conn = request.connection;
      this.auth = request.auth;
    }
  },
}));
function setup() {
  const tables = new Map<any, any[]>();
  const copy = (v: any) => (v == null ? v : structuredClone(v));
  const getRepository = (type: any): any => {
    if (!tables.has(type)) tables.set(type, []);
    const rows = tables.get(type)!;
    const activo = (r: any) => type !== InvimaFacturaOrm || !r.fechaEliminacion;
    const match = (r: any, where: any) =>
      Object.entries(where || {}).every(([k, v]: [string, any]) =>
        v?._type === 'in' ? v._value.includes(r[k]) : r[k] === v
      );
    const save = async (input: any): Promise<any> => {
      if (Array.isArray(input)) return Promise.all(input.map(save));
      const row = { ...input, id: input.id || Math.max(0, ...rows.map(r => r.id)) + 1 };
      const index = rows.findIndex(r => r.id === row.id);
      index < 0 ? rows.push(copy(row)) : (rows[index] = copy(row));
      return copy(row);
    };
    return {
      create: copy,
      save,
      findOne: async ({ where, withDeleted }: any) =>
        copy(rows.find(r => (withDeleted || activo(r)) && match(r, where)) || null),
      findOneBy: async (where: any) => copy(rows.find(r => activo(r) && match(r, where)) || null),
      find: async ({ where, withDeleted }: any = {}) =>
        copy(rows.filter(r => (withDeleted || activo(r)) && match(r, where))),
      delete: jest.fn(async (where: any) => {
        let affected = 0;
        for (let i = rows.length - 1; i >= 0; i--)
          if (match(rows[i], where)) {
            rows.splice(i, 1);
            affected++;
          }
        return { affected };
      }),
      createQueryBuilder: () => {
        const q: any = {};
        let sinFactura = false;
        let ids: number[] | undefined;
        for (const k of ['innerJoin', 'leftJoin', 'select', 'addSelect', 'orderBy']) q[k] = () => q;
        for (const k of ['where', 'andWhere'])
          q[k] = (sql: string, params?: any) => {
            if (sql.includes('NOT EXISTS (SELECT 1 FROM EKINNIVFACTURAITEM i WHERE'))
              sinFactura = true;
            if (params?.ids) ids = params.ids;
            return q;
          };
        q.getMany = async () =>
          copy(
            rows.filter(r => {
              const item = (tables.get(InvimaFacturaItemOrm) || []).find(
                i => i.productoId === r.id
              );
              const factura =
                item && (tables.get(InvimaFacturaOrm) || []).find(f => f.id === item.facturaId);
              return (
                (!ids || ids.includes(r.id)) && (!sinFactura || !item) && !factura?.fechaEliminacion
              );
            })
          );
        q.getRawMany = async () => [];
        return q;
      },
    };
  };
  const manager: any = { getRepository };
  const connection: any = {
    getRepository,
    manager,
    transaction: async (fn: any) => {
      const before = new Map([...tables].map(([key, rows]) => [key, copy(rows)]));
      try {
        return await fn(manager);
      } catch (e) {
        tables.clear();
        for (const [key, rows] of before) tables.set(key, rows);
        throw e;
      }
    },
  };
  const request: any = { connection, auth: { id: 12, user: { fullName: 'Revisor' } } };
  const invima = new InvimaService(request, {} as any);
  const parsed = {
    formato: 'PRUEBA',
    extractorVersion: '1',
    proveedor: 'Proveedor',
    nitProveedor: '123',
    numero: 'F-1',
    fecha: null,
    paginas: 1,
    advertencias: [],
    renglones: [1, 2].map(i => ({
      tipo: 'MEDICAMENTO',
      cantidad: 1,
      descripcion: 'PRODUCTO ' + i,
      codigoDeclarado: '000123-01',
      registroSanitario: '',
      paginas: [1],
      fragmento: 'Texto original ' + i,
      advertencias: [],
    })),
  };
  const pdf: any = { extraer: jest.fn(async () => parsed) };
  const excel: any = {
    extraer: jest.fn(async () => ({
      ...parsed,
      tipoDocumento: 'PEDIDO',
      cliente: 'Disfarma',
      proveedor: '',
      formato: 'DISFARMA_EXCEL',
      paginas: 0,
    })),
  };
  const service = new FacturasInvimaService(request, pdf, invima, excel);
  const file: any = { buffer: Buffer.from('pdf-de-prueba'), originalname: 'factura.pdf' };
  return { service, invima, pdf, excel, connection, file };
}
const input = (f: any): GuardarFacturaDto => ({
  version: f.version,
  numero: f.numero,
  proveedor: f.proveedor,
  cliente: f.cliente,
  nitProveedor: f.nitProveedor,
  fecha: f.fecha,
  renglones: f.renglones.map((r: any) => ({
    id: r.id,
    productoVersion: r.producto?.version,
    tipo: r.tipo,
    descripcion: r.descripcion,
    codigoDeclarado: r.codigoDeclarado,
    registroSanitario: r.registroSanitario,
    cantidad: r.cantidad,
    cantidadPresentacion: r.cantidadPresentacion,
    unidadMedida: r.unidadMedida,
    excluido: r.excluido,
  })),
});
describe('Persistencia de lotes declarados', () => {
  it('conserva asociaciones lote/vencimiento en originales, revisión y recepción; clientes antiguos no las borran', async () => {
    const { service, pdf, file } = setup();
    const parsed = await pdf.extraer();
    const lotes = [
      { lote: '000A', vencimiento: '2029-01-31' },
      { lote: '000B', vencimiento: '2028-04' },
    ];
    parsed.renglones[0].lotesDeclarados = ['000A', '000B'];
    parsed.renglones[0].lotesDocumento = lotes;
    pdf.extraer.mockResolvedValue(parsed);
    const d = await service.subir(file);
    expect(d.renglones[0]).toMatchObject({
      lotesDocumento: lotes,
      original: { lotesDocumento: lotes },
    });
    const review = input(d);
    review.renglones[0].lotesDeclarados = ['000A', '000C'];
    const f = await service.guardar(d.id, review);
    expect(f.renglones[0].lotesDocumento).toEqual([
      { lote: '000A', vencimiento: '2029-01-31' },
      { lote: '000C', vencimiento: null },
    ]);
    expect((await service.detalle(f.id)).renglones[0].original.lotesDocumento).toEqual(lotes);
    expect((await service.informe(f.id)).productos[0].datos.lotesDocumento).toEqual(
      f.renglones[0].lotesDocumento
    );
  });
  it('permite corregir la fecha sin separar el par y conserva el original', async () => {
    const { service, pdf, file } = setup();
    const parsed = await pdf.extraer();
    parsed.renglones[0].lotesDocumento = [{ lote: '000A', vencimiento: '2028-04' }];
    pdf.extraer.mockResolvedValue(parsed);
    const d = await service.subir(file),
      review = input(d);
    review.renglones[0].lotesDocumento = [{ lote: '000C', vencimiento: '2028-04-30' }];
    const f = await service.guardar(d.id, review);
    expect(f.renglones[0]).toMatchObject({
      lotesDeclarados: ['000C'],
      lotesDocumento: [{ lote: '000C', vencimiento: '2028-04-30' }],
    });
    expect(f.renglones[0].original.lotesDocumento).toEqual([
      { lote: '000A', vencimiento: '2028-04' },
    ]);
  });
  it('conserva originales y correcciones, y clientes que omiten lotes no los borran', async () => {
    const { service, pdf, file, connection } = setup();
    const parsed = await pdf.extraer();
    parsed.renglones[0].lotesDeclarados = ['000A', '000B'];
    pdf.extraer.mockResolvedValue(parsed);
    const d = await service.subir(file);
    expect(d.renglones[0].lotesDeclarados).toEqual(['000A', '000B']);
    expect(d.renglones[0].original).toMatchObject({ lotesDeclarados: ['000A', '000B'] });
    const review = input(d);
    review.renglones[0].lotesDeclarados = ['000C'];
    const f = await service.guardar(d.id, review);
    expect(f.renglones[0].lotesDeclarados).toEqual(['000C']);
    expect((await service.detalle(f.id)).renglones[0].original).toMatchObject({
      lotesDeclarados: ['000A', '000B'],
    });
    const other = setup();
    const raw = await other.pdf.extraer();
    raw.renglones[0].lotesDeclarados = ['001A'];
    other.pdf.extraer.mockResolvedValue(raw);
    const legacy = await other.service.subir(other.file);
    const saved = await other.service.guardar(legacy.id, input(legacy));
    expect(saved.renglones[0].lotesDeclarados).toEqual(['001A']);
  });
});
describe('Pedidos Excel y facturas comparten revisión sin confundir cliente y proveedor', () => {
  it('conserva la cantidad y unidad de un PDF en originales, revisión, recarga e informe', async () => {
    const { service, pdf, file } = setup();
    const parsed = await pdf.extraer();
    parsed.renglones[0].cantidad = 10;
    parsed.renglones[0].unidadMedida = 'caj x100';
    pdf.extraer.mockResolvedValue(parsed);
    const draft = await service.subir(file);
    expect(draft.renglones[0]).toMatchObject({
      cantidad: 10,
      unidadMedida: 'caj x100',
      original: { cantidad: 10, unidadMedida: 'caj x100' },
    });
    const saved = await service.guardar(draft.id, input(draft));
    const legacy = input(saved);
    delete legacy.renglones[0].cantidad;
    delete legacy.renglones[0].unidadMedida;
    await expect(service.guardar(saved.id, legacy)).rejects.toMatchObject({ status: 409 });
    expect((await service.detalle(saved.id)).renglones[0]).toMatchObject({
      cantidad: 10,
      unidadMedida: 'caj x100',
    });
    expect((await service.informe(saved.id)).productos[0].datos).toMatchObject({
      cantidad: 10,
      unidadMedida: 'caj x100',
    });
  });
  it('bloquea cantidades y permite corregir el producto de Excel tras validar', async () => {
    const { service, invima, excel, file } = setup();
    const parsed = await excel.extraer();
    parsed.renglones[0].cantidad = 42;
    parsed.renglones[0].cantidadPresentacion = 3;
    excel.extraer.mockResolvedValue(parsed);
    file.originalname = 'Disfarma.xlsx';
    const d = await service.subir(file, true);
    const f = await service.guardar(d.id, input(d));
    const next = input(f);
    next.renglones[0].cantidad = 56;
    await expect(service.guardar(f.id, next)).rejects.toMatchObject({ status: 409 });
    const p = f.renglones[0].producto!;
    expect(
      await invima.editar(p.id, {
        ...p.datos,
        codigoDeclarado: f.renglones[0].codigoDeclarado,
        version: p.version,
        nombre: 'Cambio',
      })
    ).toMatchObject({ version: 2, resultado: 'PENDIENTE' });
    expect((await service.informe(f.id)).productos[0].datos).toMatchObject({
      cantidad: 42,
      cantidadPresentacion: 3,
    });
  });
  it('guarda pedido, cliente, observaciones e informe sin inventar proveedor', async () => {
    const { service, file, excel, pdf } = setup();
    file.originalname = 'pedido.xlsx';
    const d = await service.subir(file, true);
    expect(excel.extraer).toHaveBeenCalledTimes(1);
    expect(pdf.extraer).not.toHaveBeenCalled();
    expect(d).toMatchObject({
      tipoDocumento: 'PEDIDO',
      cliente: 'Disfarma',
      proveedor: '',
      estado: 'BORRADOR',
    });
    const invalid = input(d);
    invalid.cliente = '';
    await expect(service.guardar(d.id, invalid)).rejects.toThrow('cliente');
    const f = await service.guardar(d.id, input(d));
    await service.guardarObservacion(f.id, { texto: 'Nota de pedido', version: 0 });
    const report = await service.informe(f.id);
    expect(report).toMatchObject({
      tipoDocumento: 'PEDIDO',
      cliente: 'Disfarma',
      proveedor: '',
      observacion: { texto: 'Nota de pedido' },
    });
    expect(report.productos).toHaveLength(2);
    const edit = input(f);
    edit.cliente = 'Disfarma corregido';
    await expect(service.guardar(f.id, edit)).rejects.toMatchObject({ status: 409 });
    expect((await service.detalle(f.id)).cliente).toBe('Disfarma');
  });
  it('continúa exigiendo proveedor a facturas y no admite cambiar el tipo desde la revisión', async () => {
    const { service, file } = setup();
    const f = await service.subir(file);
    const invalid = input(f);
    invalid.proveedor = '';
    invalid.cliente = 'Disfarma';
    await expect(service.guardar(f.id, invalid)).rejects.toThrow('proveedor');
    const saved = await service.guardar(f.id, {
      ...input(f),
      cliente: 'No es cliente',
      tipoDocumento: 'PEDIDO',
    } as any);
    expect(saved).toMatchObject({ tipoDocumento: 'FACTURA', cliente: '', proveedor: 'Proveedor' });
  });
  it('rechaza archivos con extensión incorrecta y conserva advertencias de extracción tras revisar', async () => {
    const { service, file, excel } = setup();
    await expect(service.subir(file, true)).rejects.toThrow('.xlsx');
    file.originalname = 'pedido.xlsx';
    const value = await excel.extraer();
    value.renglones[0].advertencias = [
      'CUM repetido en el pedido. Se conserva este renglón para revisión.',
    ];
    excel.extraer.mockResolvedValue(value);
    const f = await service.subir(file, true);
    expect(f.renglones[0].advertencias.join(' ')).toContain('CUM repetido');
    await service.eliminar(f.id, f.version);
    const again = await service.subir(file, true);
    expect(again.tipoDocumento).toBe('PEDIDO');
    expect(again.id).not.toBe(f.id);
  });
});
describe('Observaciones e informe de facturas revisadas', () => {
  it('genera el informe sin iniciar una recepción cuando aún no existe', async () => {
    const { service, file, connection } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const report = await service.informe(f.id);
    expect(report.recepcion).toBeNull();
    expect(report.productos.map(p => p.renglonId)).toEqual(f.renglones.map(r => r.id));
    expect(await connection.getRepository(InvimaRecepcionOrm).find()).toEqual([]);
    expect(await connection.getRepository(InvimaRecepcionItemOrm).find()).toEqual([]);
  });
  it('incluye captura confirmada, diferencias y borrador parcial separados, con su auditoría', async () => {
    const { service, file, connection } = setup();
    const d = await service.subir(file);
    const review = input(d);
    review.renglones[0].cantidad = 10;
    const f = await service.guardar(d.id, review);
    const sourceRepo = connection.getRepository(InvimaProductoOrm);
    const sourceProduct = await sourceRepo.findOneBy({ id: f.renglones[0].producto.id });
    sourceProduct.datos = JSON.stringify({
      ...JSON.parse(sourceProduct.datos),
      laboratorio: 'Laboratorio ingresado de la factura',
      presentacion: 'Presentación ingresada de la factura',
      formaFarmaceutica: 'Forma ingresada de la factura',
    });
    await sourceRepo.save(sourceProduct);
    const r = await connection.getRepository(InvimaRecepcionOrm).save({
      facturaId: f.id,
      estado: 'BORRADOR',
      version: 7,
      creadoPor: 11,
      actualizadoPor: 12,
      fechaCreacion: new Date('2026-11-01T13:00:00Z'),
      fechaActualizacion: new Date('2026-11-02T15:00:00Z'),
      fechaFinalizacion: null,
    });
    const fisico = {
      ...fisicoVacio('MEDICAMENTO'),
      descripcion: 'Recibido',
      cantidad: 8,
      codigoDeclarado: '000123-02',
      registroSanitario: 'INVIMA RS-2',
      cantidadAveria: 1,
      cantidadNoSolicitada: 2,
      laboratorio: 'Laboratorio observado físicamente',
      presentacion: 'Presentación observada físicamente',
      formaFarmaceutica: 'Forma observada físicamente',
      estadoEmpaque: 'DETERIORADO',
      motivosRechazo: ['CUM'],
      lotes: [{ cantidad: 8, lote: '000A', vencimiento: '2027-01-01' }],
    };
    const borradorRecepcion = {
      fisico: { ...fisico, cantidad: 12, erroresCriticos: null },
      decision: 'ACEPTADO',
      justificacion: 'Cambio aún sin confirmar',
      usuarioId: 13,
      usuarioNombre: 'Inspector borrador',
      fecha: '2026-11-02T16:00:00Z',
    };
    const original = JSON.stringify({ ...fisico, borradorRecepcion });
    const item = await connection.getRepository(InvimaRecepcionItemOrm).save({
      recepcionId: r.id,
      facturaItemId: f.renglones[0].id,
      facturado: JSON.stringify({
        tipo: 'MEDICAMENTO',
        descripcion: 'PRODUCTO 1',
        cantidad: 10,
        codigoDeclarado: '000123-01',
        registroSanitario: 'RS-1',
        lotesDeclarados: ['000A'],
        unidadMedida: 'UD',
      }),
      fisico: original,
      decision: 'RECHAZADO',
      justificacion: 'Código físico diferente',
      version: 4,
      usuarioId: 12,
      fecha: new Date('2026-11-02T15:00:00Z'),
    });
    const report = await service.informe(f.id);
    expect(report.productos[0].datosProducto).toMatchObject({
      laboratorio: 'Laboratorio ingresado de la factura',
      presentacion: 'Presentación ingresada de la factura',
      formaFarmaceutica: 'Forma ingresada de la factura',
    });
    expect(report.recepcion).toMatchObject({
      id: r.id,
      estado: 'BORRADOR',
      version: 7,
      creadoPor: 11,
      actualizadoPor: 12,
    });
    expect(report.recepcion.renglones).toHaveLength(1);
    const row = report.recepcion.renglones[0];
    expect(row).toMatchObject({
      id: item.id,
      facturaItemId: f.renglones[0].id,
      usuarioId: 12,
      version: 4,
      decision: 'RECHAZADO',
      justificacion: 'Código físico diferente',
      fisico,
      facturado: { cantidad: 10, lotesDeclarados: ['000A'], unidadMedida: 'UD' },
      diferencias: { cum: 'DIFIERE', registro: 'DIFIERE', faltante: 2, sobrante: 0 },
      muestreo: { nivel: 'A', muestra: 2, cumple: true },
      borrador: {
        ...borradorRecepcion,
        diferencias: { faltante: 0, sobrante: 2 },
        muestreo: null,
      },
    });
    expect(row.fisico).not.toHaveProperty('borradorRecepcion');
    expect(
      (await connection.getRepository(InvimaRecepcionItemOrm).findOneBy({ id: item.id })).fisico
    ).toBe(original);
  });
  it('conserva recepción finalizada, cantidades ausentes y no recibido, sin incluir otros documentos', async () => {
    const { service, file, connection } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const r = await connection.getRepository(InvimaRecepcionOrm).save({
      facturaId: f.id,
      estado: 'FINALIZADA',
      version: 3,
      creadoPor: 12,
      actualizadoPor: 12,
      fechaFinalizacion: new Date('2026-11-02T23:00:00Z'),
    });
    const repo = connection.getRepository(InvimaRecepcionItemOrm);
    await repo.save({
      recepcionId: r.id,
      facturaItemId: f.renglones[0].id,
      facturado: JSON.stringify({
        tipo: 'MEDICAMENTO',
        descripcion: 'Antiguo',
        cantidad: null,
        codigoDeclarado: '',
        registroSanitario: '',
      }),
      fisico: JSON.stringify({ ...fisicoVacio('MEDICAMENTO'), cantidad: 0 }),
      decision: 'NO_RECIBIDO',
      justificacion: 'Factura antigua sin cantidad',
      usuarioId: 12,
    });
    await repo.save({
      recepcionId: r.id,
      facturaItemId: 9999,
      facturado: '{"descripcion":"No incluido"}',
      fisico: '{}',
      decision: 'PENDIENTE',
    });
    await repo.save({
      recepcionId: r.id + 1,
      facturaItemId: f.renglones[0].id,
      facturado: '{"descripcion":"Otro documento"}',
      fisico: '{}',
      decision: 'PENDIENTE',
    });
    const report = await service.informe(f.id);
    expect(report.recepcion).toMatchObject({
      estado: 'FINALIZADA',
      fechaFinalizacion: r.fechaFinalizacion,
    });
    expect(report.recepcion.renglones).toHaveLength(1);
    expect(report.recepcion.renglones[0]).toMatchObject({
      facturado: { cantidad: null },
      fisico: { cantidad: 0 },
      borrador: null,
      decision: 'NO_RECIBIDO',
      diferencias: { faltante: null, sobrante: null },
      muestreo: { nivel: 'N/A', muestra: 0 },
    });
  });
  it('rechaza observaciones e informe antes de guardar la revisión', async () => {
    const { service, file } = setup();
    const f = await service.subir(file);
    await expect(service.guardarObservacion(f.id, { texto: 'nota', version: 0 })).rejects.toThrow(
      'Guarde la revisión'
    );
    await expect(service.informe(f.id)).rejects.toThrow('Guarde la revisión');
  });
  it('guarda notas independientes con auditoría sin alterar producto, revisión ni historial', async () => {
    const { service, file } = setup();
    const draft = await service.subir(file);
    const f = await service.guardar(draft.id, input(draft));
    const general = await service.guardarObservacion(f.id, {
      texto: 'General\nSegunda línea',
      version: 0,
    });
    const row = await service.guardarObservacion(f.id, {
      texto: 'Revisar lote',
      version: 0,
      renglonId: f.renglones[0].id,
    });
    expect(general).toMatchObject({
      texto: 'General\nSegunda línea',
      version: 1,
      usuarioNombre: 'Revisor',
    });
    expect(row.version).toBe(1);
    expect(Number.isFinite(general.fecha.getTime())).toBe(true);
    const reload = await service.detalle(f.id);
    expect(reload.version).toBe(f.version);
    expect(reload.renglones[0].producto.version).toBe(f.renglones[0].producto.version);
    expect(reload.renglones[0].observacion.texto).toBe('Revisar lote');
    expect(reload.renglones[1].observacion.version).toBe(0);
    const edit = input(reload);
    edit.renglones[0].descripcion = 'Producto corregido';
    await expect(service.guardar(f.id, edit)).rejects.toMatchObject({ status: 409 });
    const updated = await service.detalle(f.id);
    expect(updated.observacion.texto).toBe(general.texto);
    expect(updated.renglones[0].observacion.texto).toBe(row.texto);
    const report = await service.informe(f.id);
    expect(report.productos[0]).toMatchObject({
      resultado: 'PENDIENTE',
      observacion: { texto: 'Revisar lote' },
      candidato: null,
    });
    expect(report.observacion.texto).toBe(general.texto);
  });
  it('permite limpiar notas y reintentar respuestas perdidas, detecta conflictos sin sobrescribir', async () => {
    const { service, file } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const a = await service.guardarObservacion(f.id, { texto: 'uno', version: 0 });
    expect(await service.guardarObservacion(f.id, { texto: 'uno', version: 0 })).toEqual(a);
    try {
      await service.guardarObservacion(f.id, { texto: 'otro', version: 0 });
      throw new Error('Debió fallar');
    } catch (e) {
      expect(e.getStatus()).toBe(409);
      expect(e.getResponse().actual).toMatchObject({ texto: 'uno', version: 1 });
    }
    const clear = await service.guardarObservacion(f.id, { texto: '', version: 1 });
    expect(clear).toMatchObject({ texto: '', version: 2 });
  });
  it('no permite anotar renglones de otra factura, excluidos, eliminados ni de otro contexto', async () => {
    const { service, file } = setup();
    const d = await service.subir(file);
    const review = input(d);
    review.renglones[0].excluido = true;
    const f = await service.guardar(d.id, review);
    await expect(
      service.guardarObservacion(f.id, { texto: 'x', version: 0, renglonId: 999 })
    ).rejects.toThrow('Producto no incluido');
    const updated = f;
    await expect(
      service.guardarObservacion(f.id, { texto: 'x', version: 0, renglonId: f.renglones[0].id })
    ).rejects.toThrow('Producto no incluido');
    expect((await service.informe(f.id)).productos).toHaveLength(1);
    const other = setup();
    await expect(other.service.informe(f.id)).rejects.toThrow('Factura no encontrada');
    await service.eliminar(f.id, updated.version);
    await expect(service.guardarObservacion(f.id, { texto: 'x', version: 0 })).rejects.toThrow(
      'Factura no encontrada'
    );
    await expect(service.informe(f.id)).rejects.toThrow('Factura no encontrada');
  });
  it('el informe usa únicamente la verificación vigente y el candidato confirmado', async () => {
    const { service, file, connection } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const repo = connection.getRepository(InvimaProductoOrm);
    const p = await repo.findOneBy({ id: f.renglones[0].producto.id });
    const candidate = {
      nombre: 'Encontrado',
      cum: '000123-01',
      estadoCum: 'Inactivo',
      estadoRegistro: 'Vigente',
    };
    const v = await connection.getRepository(InvimaVerificacionOrm).save({
      productoId: p.id,
      versionProducto: p.version,
      resultado: 'REVISION',
      fecha: new Date(),
      evidencia: JSON.stringify({
        consultas: [],
        advertencias: ['Discrepancia'],
        seleccionado: null,
      }),
    });
    await connection.getRepository(InvimaConfirmacionOrm).save({
      verificacionId: v.id,
      candidato: JSON.stringify(candidate),
      usuarioNombre: 'Confirmador',
      fecha: new Date(),
    });
    p.ultimaVerificacionId = v.id;
    await repo.save(p);
    const report = await service.informe(f.id);
    expect(report.productos[0]).toMatchObject({
      resultado: 'CONFIRMADA',
      candidato: candidate,
      verificacion: { confirmadoPor: 'Confirmador', advertencias: ['Discrepancia'] },
    });
    p.version++;
    await repo.save(p);
    expect((await service.informe(f.id)).productos[0]).toMatchObject({
      resultado: 'PENDIENTE',
      candidato: null,
      verificacion: null,
    });
  });
});
describe('Facturas INVIMA, persistencia y revisión', () => {
  it('guarda y recarga todas las categorías en renglones distintos sin reinterpretar los códigos como CUM', async () => {
    const { service, file } = setup();
    const draft = await service.subir(file);
    const edit = input(draft);
    for (const tipo of Object.keys(GRUPOS_REGISTROS) as TipoProductoInvima[])
      edit.renglones.push({
        tipo,
        cantidad: 1,
        descripcion: 'Producto ' + tipo,
        codigoDeclarado: '0000123',
        registroSanitario: 'RS-123',
        excluido: false,
      });
    const saved = await service.guardar(draft.id, edit);
    const reloaded = await service.detalle(saved.id);
    for (const tipo of Object.keys(GRUPOS_REGISTROS)) {
      const row = reloaded.renglones.find(r => r.tipo === tipo);
      expect(row.codigoDeclarado).toBe('0000123');
      expect(row.producto.datos).toMatchObject({ tipo, cum: '' });
    }
    expect(new Set(reloaded.renglones.map(r => r.producto.id)).size).toBe(
      reloaded.renglones.length
    );
  });
  it('corrige el producto validado y conserva original, auditoría e historial', async () => {
    const { service, invima, file, connection } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const p = f.renglones[0].producto;
    const v = await connection.getRepository(InvimaVerificacionOrm).save({
      productoId: p.id,
      versionProducto: 1,
      entrada: JSON.stringify(p.datos),
      resultado: 'EXACTA',
      evidencia: JSON.stringify({ consultas: [], seleccionado: null, advertencias: [] }),
    });
    await invima.editar(p.id, {
      ...p.datos,
      version: 1,
      nombre: 'Cambio',
      tipo: 'DISPOSITIVO',
      codigoDeclarado: '00042',
    });
    const reload = await service.detalle(f.id);
    expect(reload.version).toBe(f.version + 1);
    expect(reload.renglones[0]).toMatchObject({
      descripcion: 'Cambio',
      tipo: 'DISPOSITIVO',
      codigoDeclarado: '00042',
    });
    expect(reload.renglones[0].original).toEqual(f.renglones[0].original);
    expect(reload.renglones[0].correccionesProducto[0]).toMatchObject({
      usuarioNombre: 'Revisor',
      anterior: { descripcion: f.renglones[0].descripcion },
    });
    expect(reload.renglones[1].producto.version).toBe(1);
    expect((await invima.historial(p.id))[0].id).toBe(v.id);
  });
  it('detecta una versión de producto obsoleta sin cambiar la referencia facturada', async () => {
    const { service, invima, file } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const p = f.renglones[0].producto;
    await expect(
      invima.editar(p.id, { ...p.datos, version: 2, nombre: 'Cambio' })
    ).rejects.toMatchObject({ status: 409 });
    expect(await service.detalle(f.id)).toEqual(f);
  });
  it('rechaza exclusiones tras validar, versiones obsoletas y ediciones de otros contextos', async () => {
    const { service, invima, file } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const edit = input(f);
    edit.renglones[0].excluido = true;
    await expect(service.guardar(f.id, edit)).rejects.toMatchObject({ status: 409 });
    const p = f.renglones[0].producto;
    await expect(invima.editar(p.id, { ...p.datos, version: 0 })).rejects.toMatchObject({
      status: 409,
    });
    await expect(setup().invima.editar(p.id, { ...p.datos, version: 1 })).rejects.toMatchObject({
      status: 404,
    });
  });
  it('conserva los dos tipos nuevos al guardar y recargar la revisión', async () => {
    const { service, file } = setup();
    const draft = await service.subir(file);
    const edit = input(draft);
    edit.renglones[0].tipo = 'ALIMENTOS';
    edit.renglones[1].tipo = 'MEDICO_QUIRURGICOS';
    const saved = await service.guardar(draft.id, edit);
    expect(saved.renglones.map(r => r.producto.datos.tipo)).toEqual([
      'ALIMENTOS',
      'MEDICO_QUIRURGICOS',
    ]);
    expect(saved.renglones.every(r => r.producto.datos.cum === '')).toBe(true);
  });
  it('filtra el estado antes de paginar y mantiene el resumen de todos los resultados de la búsqueda', async () => {
    const { service, connection } = setup();
    const summary: any = {};
    for (const name of ['select', 'addSelect', 'groupBy']) summary[name] = jest.fn(() => summary);
    summary.getRawMany = jest.fn(async () => [
      { estado: 'BORRADOR', total: '21' },
      { estado: 'REVISADA', total: '4' },
    ]);
    const query: any = {};
    for (const name of ['where', 'andWhere', 'orderBy', 'skip', 'take'])
      query[name] = jest.fn(() => query);
    query.clone = jest.fn(() => summary);
    query.getManyAndCount = jest.fn(async () => [[], 0]);
    const getRepository = connection.getRepository;
    connection.getRepository = (type: any) =>
      type === InvimaFacturaOrm ? { createQueryBuilder: () => query } : getRepository(type);
    const result = await service.listar({
      pagina: 2,
      limite: 20,
      q: 'Proveedor',
      estado: 'BORRADOR',
    });
    expect(query.where).toHaveBeenCalledWith(expect.any(String), { q: '%Proveedor%' });
    expect(query.andWhere).toHaveBeenCalledWith('f.estado = :estado', { estado: 'BORRADOR' });
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.take).toHaveBeenCalledWith(20);
    expect(result).toMatchObject({
      datos: [],
      total: 0,
      resumen: { total: 25, borradores: 21, revisadas: 4 },
      pagina: 2,
    });
  });
  it('lista el estado real de recepción por documento sin confundirlo con la revisión', async () => {
    const { service, connection } = setup();
    const facturas = [1, 2, 3].map(id => ({ id, estado: 'REVISADA', numero: 'F-' + id }));
    const repositorio = connection.getRepository;
    await repositorio(InvimaRecepcionOrm).save([
      { facturaId: 2, estado: 'BORRADOR' },
      { facturaId: 3, estado: 'FINALIZADA' },
      { facturaId: 99, estado: 'FINALIZADA' },
    ]);
    const recepciones = repositorio(InvimaRecepcionOrm);
    const buscar = jest.fn(recepciones.find);
    const consulta = (factura: boolean) => {
      const q: any = {};
      for (const key of [
        'select',
        'addSelect',
        'where',
        'leftJoin',
        'groupBy',
        'orderBy',
        'skip',
        'take',
      ])
        q[key] = () => q;
      q.clone = () => q;
      q.getRawMany = async () => (factura ? [{ estado: 'REVISADA', total: 3 }] : []);
      q.getManyAndCount = async () => [facturas, facturas.length];
      return q;
    };
    connection.getRepository = (type: any) => {
      if (type === InvimaFacturaOrm) return { createQueryBuilder: () => consulta(true) };
      if (type === InvimaFacturaItemOrm) return { createQueryBuilder: () => consulta(false) };
      if (type === InvimaRecepcionOrm) return { ...recepciones, find: buscar };
      return repositorio(type);
    };
    const r = await service.listar({ pagina: 1, limite: 20 });
    expect(r.datos.map(f => f.estadoRecepcion)).toEqual([null, 'BORRADOR', 'FINALIZADA']);
    expect(r.datos.every(f => f.estado === 'REVISADA')).toBe(true);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar.mock.calls[0][0]).toMatchObject({
      select: { facturaId: true, estado: true },
      where: { facturaId: expect.objectContaining({ _value: [1, 2, 3] }) },
    });
  });
  it('guarda borrador y evidencia sin PDF; crea productos distintos al revisar aunque repitan CUM', async () => {
    const { service, file, connection } = setup();
    const draft = await service.subir(file);
    expect(draft.estado).toBe('BORRADOR');
    expect(draft.renglones[0].producto).toBeNull();
    const stored = await connection.getRepository(InvimaFacturaOrm).findOneBy({ id: draft.id });
    expect(stored).not.toHaveProperty('buffer');
    expect(stored.archivoHash).toHaveLength(64);
    const f = await service.guardar(draft.id, input(draft));
    expect(f.estado).toBe('REVISADA');
    expect(f.renglones[0].producto.id).not.toBe(f.renglones[1].producto.id);
    expect(f.renglones[0].producto.datos.cum).toBe('000123-01');
    expect(f.renglones[0].original.fragmento).toBe('Texto original 1');
  });
  it('impide reabrir la revisión y conserva versiones y evidencia facturadas', async () => {
    const { service, file } = setup();
    const d = await service.subir(file);
    const f = await service.guardar(d.id, input(d));
    const edit = input(f);
    edit.renglones[0].descripcion = 'Cambio';
    await expect(service.guardar(f.id, edit)).rejects.toMatchObject({ status: 409 });
    expect(await service.detalle(f.id)).toEqual(f);
  });
  it('no crea productos excluidos y conserva el código de dispositivo fuera del CUM', async () => {
    const { service, file } = setup();
    const draft = await service.subir(file);
    const edit = input(draft);
    edit.renglones[0].excluido = true;
    edit.renglones[1].tipo = 'DISPOSITIVO';
    edit.renglones[1].codigoDeclarado = '20220067';
    const f = await service.guardar(draft.id, edit);
    expect(f.renglones[0].producto).toBeNull();
    expect(f.renglones[1].codigoDeclarado).toBe('20220067');
    expect(f.renglones[1].producto.datos).toMatchObject({ tipo: 'DISPOSITIVO', cum: '' });
  });
  it('detecta duplicados sin procesar de nuevo el PDF', async () => {
    const { service, file, pdf } = setup();
    await service.subir(file);
    await expect(service.subir(file)).rejects.toMatchObject({ status: 409 });
    expect(pdf.extraer).toHaveBeenCalledTimes(1);
  });
  it('rechaza versiones obsoletas y renglones de otra factura', async () => {
    const { service, file } = setup();
    const draft = await service.subir(file);
    await service.guardar(draft.id, input(draft));
    await expect(service.guardar(draft.id, input(draft))).rejects.toMatchObject({ status: 409 });
    const current = await service.detalle(draft.id);
    const edit = input(current);
    edit.renglones[0].id = 999;
    await expect(service.guardar(current.id, edit)).rejects.toMatchObject({ status: 409 });
    expect((await service.detalle(current.id)).version).toBe(current.version);
  });
  it('revierte todos los cambios cuando un renglón falla a mitad de la revisión', async () => {
    const { service, file, connection } = setup();
    const draft = await service.subir(file);
    const edit = input(draft);
    edit.renglones[1].descripcion = '';
    await expect(service.guardar(draft.id, edit)).rejects.toMatchObject({ status: 400 });
    expect(await connection.getRepository(InvimaProductoOrm).find()).toHaveLength(0);
    expect((await service.detalle(draft.id)).estado).toBe('BORRADOR');
  });
  it('no accede a las facturas de otra conexión de contexto', async () => {
    const a = setup(),
      b = setup();
    const factura = await a.service.subir(a.file);
    await expect(b.service.detalle(factura.id)).rejects.toMatchObject({ status: 404 });
    expect(await b.connection.getRepository(InvimaFacturaItemOrm).find()).toEqual([]);
  });
  it.each(['BORRADOR', 'REVISADA'])(
    'oculta %s con auditoría, conserva sus datos y permite volver a cargar el mismo PDF',
    async estado => {
      const { service, invima, file, connection, pdf } = setup();
      const draft = await service.subir(file);
      const factura = estado === 'REVISADA' ? await service.guardar(draft.id, input(draft)) : draft;
      const otro = await service.subir({ ...file, buffer: Buffer.from('otro-pdf') });
      const items = await connection
        .getRepository(InvimaFacturaItemOrm)
        .find({ where: { facturaId: factura.id } });
      if (estado === 'REVISADA') {
        const producto = factura.renglones[0].producto;
        await connection.getRepository(InvimaVerificacionOrm).save({
          productoId: producto.id,
          versionProducto: 1,
          entrada: JSON.stringify(producto.datos),
          evidencia: JSON.stringify({ consultas: [], seleccionado: null }),
          resultado: 'REVISION',
        });
        await connection
          .getRepository(InvimaConfirmacionOrm)
          .save({ verificacionId: 1, candidato: '{}' });
      }
      await service.eliminar(factura.id, factura.version);
      await expect(service.detalle(factura.id)).rejects.toMatchObject({ status: 404 });
      await expect(service.guardar(factura.id, input(factura))).rejects.toMatchObject({
        status: 404,
      });
      await expect(service.eliminar(factura.id, factura.version)).rejects.toMatchObject({
        status: 404,
      });
      expect(
        await connection
          .getRepository(InvimaFacturaItemOrm)
          .find({ where: { facturaId: factura.id } })
      ).toEqual(items);
      const eliminado = await connection
        .getRepository(InvimaFacturaOrm)
        .findOne({ where: { id: factura.id }, withDeleted: true });
      expect(eliminado).toMatchObject({
        estado,
        eliminadoPor: 12,
        version: factura.version + 1,
      });
      expect(Number.isFinite(eliminado.fechaEliminacion.getTime())).toBe(true);
      expect(await invima.listar()).toEqual([]);
      expect(await invima.listar(undefined, true)).toEqual([]);
      if (estado === 'REVISADA') {
        const p = factura.renglones[0].producto;
        expect(await connection.getRepository(InvimaProductoOrm).find()).toHaveLength(2);
        expect(await connection.getRepository(InvimaVerificacionOrm).find()).toHaveLength(1);
        expect(await connection.getRepository(InvimaConfirmacionOrm).find()).toHaveLength(1);
        await expect(invima.editar(p.id, { ...p.datos, version: 1 })).rejects.toMatchObject({
          status: 404,
        });
        await expect(invima.verificar(p.id)).rejects.toMatchObject({ status: 404 });
        await expect(invima.historial(p.id)).rejects.toMatchObject({ status: 404 });
        await expect(invima.candidatos(p.id, 1, 'vigentes', 0)).rejects.toMatchObject({
          status: 404,
        });
        await expect(invima.confirmar(p.id, 1, 'x')).rejects.toMatchObject({ status: 404 });
      }
      expect((await service.detalle(otro.id)).renglones).toHaveLength(2);
      expect((await service.subir(file)).id).not.toBe(factura.id);
      expect(pdf.extraer).toHaveBeenCalledTimes(3);
    }
  );
  it('rechaza versiones obsoletas en borradores y revisadas sin modificar sus datos', async () => {
    const { service, file } = setup();
    const draft = await service.subir(file);
    await expect(service.eliminar(draft.id, draft.version + 1)).rejects.toMatchObject({
      status: 409,
    });
    expect((await service.detalle(draft.id)).renglones).toHaveLength(2);
    const revisada = await service.guardar(draft.id, input(draft));
    await expect(service.eliminar(revisada.id, draft.version)).rejects.toMatchObject({
      status: 409,
    });
    expect((await service.detalle(revisada.id)).renglones[0].producto.id).toBe(
      revisada.renglones[0].producto.id
    );
  });
  it('no elimina facturas ajenas al contexto', async () => {
    const a = setup(),
      b = setup();
    const draft = await a.service.subir(a.file);
    await expect(b.service.eliminar(draft.id, draft.version)).rejects.toMatchObject({
      status: 404,
    });
    expect((await a.service.detalle(draft.id)).renglones).toHaveLength(2);
  });
  it('conserva factura y renglones si falla el marcado de eliminación', async () => {
    const { service, file, connection } = setup();
    const draft = await service.subir(file);
    const getRepository = connection.manager.getRepository;
    connection.manager.getRepository = (type: any) => {
      const repo = getRepository(type);
      if (type === InvimaFacturaOrm)
        repo.save = async () => {
          throw new Error('Fallo SQL');
        };
      return repo;
    };
    await expect(service.eliminar(draft.id, draft.version)).rejects.toThrow('Fallo SQL');
    expect((await service.detalle(draft.id)).renglones).toHaveLength(2);
  });
  it('una verificación en curso no guarda resultados después de eliminar su factura', async () => {
    const { service, invima, file, connection } = setup();
    const draft = await service.subir(file);
    const factura = await service.guardar(draft.id, input(draft));
    (invima as any).socrata = {
      consultar: async (fuente: any, criterio: any, where: any) => {
        if (!(await connection.getRepository(InvimaFacturaOrm).findOneBy({ id: factura.id })))
          return { fuente, criterio, where, paginas: [] };
        await service.eliminar(factura.id, factura.version);
        return { fuente, criterio, where, paginas: [] };
      },
    };
    await expect(invima.verificar(factura.renglones[0].producto.id)).rejects.toMatchObject({
      status: 404,
    });
    expect(await connection.getRepository(InvimaVerificacionOrm).find()).toEqual([]);
  });
});
