import { FacturasInvimaService } from './facturas.service';
import { InvimaService } from './invima.service';
import { InvimaFacturaItemOrm, InvimaFacturaOrm, InvimaProductoOrm } from '@inn/orm/inn/invima';
import { GuardarFacturaDto } from '../presentation/factura.dto';

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
      findOne: async ({ where }: any) => copy(rows.find(r => match(r, where)) || null),
      findOneBy: async (where: any) => copy(rows.find(r => match(r, where)) || null),
      find: async ({ where }: any = {}) => copy(rows.filter(r => match(r, where))),
      createQueryBuilder: () => {
        const q: any = {};
        for (const k of ['innerJoin', 'leftJoin', 'select', 'addSelect', 'andWhere'])
          q[k] = () => q;
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
  const service = new FacturasInvimaService(request, pdf, invima);
  const file: any = { buffer: Buffer.from('pdf-de-prueba'), originalname: 'factura.pdf' };
  return { service, pdf, connection, file };
}
const input = (f: any): GuardarFacturaDto => ({
  version: f.version,
  numero: f.numero,
  proveedor: f.proveedor,
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
describe('Facturas INVIMA, persistencia y revisión', () => {
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
});
