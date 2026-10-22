import { FacturasInvimaService } from './facturas.service';
import { InvimaService } from './invima.service';
import {
  InvimaFacturaItemOrm,
  InvimaFacturaOrm,
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaConfirmacionOrm,
} from '@inn/orm/inn/invima';
import { GuardarFacturaDto } from '../presentation/factura.dto';
import { GRUPOS_REGISTROS, TipoProductoInvima } from '../domain/invima.models';

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
    excluido: r.excluido,
  })),
});
describe('Pedidos Excel y facturas comparten revisión sin confundir cliente y proveedor', () => {
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
    const reload = await service.guardar(f.id, edit);
    expect(reload.cliente).toBe('Disfarma corregido');
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
    const updated = await service.guardar(f.id, edit);
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
    const f = await service.guardar(d.id, input(d));
    await expect(
      service.guardarObservacion(f.id, { texto: 'x', version: 0, renglonId: 999 })
    ).rejects.toThrow('Producto no incluido');
    const edit = input(f);
    edit.renglones[0].excluido = true;
    const updated = await service.guardar(f.id, edit);
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
  it('edita un producto revisado, sincroniza el renglón y conserva historial, originales y otros productos', async () => {
    const { service, invima, file, connection } = setup();
    const draft = await service.subir(file);
    const f = await service.guardar(draft.id, input(draft));
    const p = f.renglones[0].producto;
    const verification = await connection.getRepository(InvimaVerificacionOrm).save({
      productoId: p.id,
      versionProducto: 1,
      entrada: JSON.stringify(p.datos),
      resultado: 'EXACTA',
      evidencia: JSON.stringify({ consultas: [], seleccionado: null, advertencias: [] }),
    });
    const updated = await invima.editar(p.id, {
      ...p.datos,
      version: 1,
      nombre: 'GUANTES CORREGIDOS',
      tipo: 'MEDICO_QUIRURGICOS',
      codigoDeclarado: '0000042',
      laboratorio: 'Laboratorio corregido',
    });
    expect(updated).toMatchObject({
      version: 2,
      resultado: 'PENDIENTE',
      estadoCum: null,
      codigoDeclarado: '0000042',
    });
    const reloaded = await service.detalle(f.id);
    expect(reloaded.version).toBe(f.version + 1);
    expect(reloaded.renglones[0]).toMatchObject({
      tipo: 'MEDICO_QUIRURGICOS',
      descripcion: 'GUANTES CORREGIDOS',
      codigoDeclarado: '0000042',
    });
    expect(reloaded.renglones[0].producto.datos).toMatchObject({
      tipo: 'MEDICO_QUIRURGICOS',
      cum: '',
    });
    expect(reloaded.renglones[0].original).toEqual(f.renglones[0].original);
    expect(reloaded.renglones[1].producto.version).toBe(1);
    expect((await invima.historial(p.id))[0].id).toBe(verification.id);
    await expect(service.guardar(f.id, input(f))).rejects.toMatchObject({ status: 409 });
    await expect(invima.editar(p.id, { ...p.datos, version: 1 })).rejects.toMatchObject({
      status: 409,
    });
    expect((await service.detalle(f.id)).version).toBe(reloaded.version);
    // Saving the review later must not erase the individually edited metadata or reset it again.
    const reviewed = await service.guardar(f.id, input(reloaded));
    expect(reviewed.renglones[0].producto.version).toBe(2);
    expect(reviewed.renglones[0].producto.datos.laboratorio).toBe('Laboratorio corregido');
  });
  it('revierte factura, renglón y producto si falla el guardado individual', async () => {
    const { service, invima, file, connection } = setup();
    const draft = await service.subir(file);
    const f = await service.guardar(draft.id, input(draft));
    const p = f.renglones[0].producto;
    const original = connection.getRepository;
    connection.getRepository = (type: any) => {
      const repository = original(type);
      return type === InvimaProductoOrm
        ? {
            ...repository,
            save: async () => {
              throw new Error('Fallo de escritura');
            },
          }
        : repository;
    };
    connection.manager.getRepository = connection.getRepository;
    await expect(invima.editar(p.id, { ...p.datos, version: 1, nombre: 'Cambio' })).rejects.toThrow(
      'Fallo de escritura'
    );
    expect(await service.detalle(f.id)).toEqual(f);
  });
  it('rechaza editar un producto excluido o perteneciente a otro contexto', async () => {
    const { service, invima, file } = setup();
    const draft = await service.subir(file);
    const f = await service.guardar(draft.id, input(draft));
    const edit = input(f);
    edit.renglones[0].excluido = true;
    await service.guardar(f.id, edit);
    const p = f.renglones[0].producto;
    await expect(invima.editar(p.id, { ...p.datos, version: 1 })).rejects.toMatchObject({
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
  it('editar reinicia solo el producto cambiado y conserva la evidencia original', async () => {
    const { service, file } = setup();
    const draft = await service.subir(file);
    const f = await service.guardar(draft.id, input(draft));
    const edit = input(f);
    edit.renglones[0].descripcion = 'Descripción corregida';
    const updated = await service.guardar(f.id, edit);
    expect(updated.renglones[0].producto.version).toBe(2);
    expect(updated.renglones[1].producto.version).toBe(1);
    expect(updated.renglones[0].original.fragmento).toBe('Texto original 1');
    expect(updated.renglones[0].producto.estadoCum).toBeNull();
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
    await expect(service.guardar(current.id, edit)).rejects.toMatchObject({ status: 400 });
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
