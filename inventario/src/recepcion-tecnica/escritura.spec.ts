import { CreateRecepcionTecnicaImpl } from '../../legacy/recepciones-tecnicas/infrastructure/services/create.impl';
import { UpdateRecepcionTecnicaImpl } from '../../legacy/recepciones-tecnicas/infrastructure/services/update.impl';
import {
  RecepcionTecnicaOrm,
  DetalleRecepcionTecnicaOrm,
  RTCLoteOrm,
} from '../../legacy/recepciones-tecnicas/@orm/inn/farmacia/recepcion-tecnica';
import {
  ComprobanteEntradaOrm,
  DetalleComprobanteEntradaOrm,
} from '../../legacy/recepciones-tecnicas/@orm/inn/documentos';
jest.mock('@common/application/services', () => ({ RSAServices: {} }));
jest.mock('@common/infrastructure/services', () => ({
  BaseSource: class {
    qr: any;
    auth: any;
    constructor(r: any) {
      this.qr = r.qr;
      this.auth = { id: 7 };
    }
  },
}));
function setup() {
  const copy = (v: any) => structuredClone(v);
  const tables = new Map<any, any[]>([
    [
      RecepcionTecnicaOrm,
      [
        {
          id: 1,
          documentoId: 10,
          tipoDocumentoCode: 2,
          usuarioId: 7,
          centroId: 1,
          transportadoraId: 6,
          createdAt: new Date(),
        },
      ],
    ],
    [
      DetalleRecepcionTecnicaOrm,
      [20, 21].map(i => ({
        id: i + 100,
        itemDetalleId: i,
        productoId: i + 10,
        recepcionTecnicaId: 1,
        inspeccionJson: null,
      })),
    ],
    [
      RTCLoteOrm,
      [20, 21].map(i => ({
        id: i + 200,
        RTCProductoId: i + 100,
        cantidad: 10,
        lote: 'LOTE' + i,
        fechaVencimiento: new Date('2027-02-05'),
      })),
    ],
    [ComprobanteEntradaOrm, [{ id: 10 }]],
    [
      DetalleComprobanteEntradaOrm,
      [20, 21].map(i => ({ id: i, comprobanteEntradaId: 10, productoId: i + 10, cantidad: 10 })),
    ],
  ]);
  const writes: any[] = [];
  const matches = (r: any, where: any) =>
    Object.entries(where || {}).every(([k, v]: any) =>
      v?._type === 'in' ? v._value.includes(r[k]) : r[k] === v
    );
  const repo = (type: any): any => {
    if (!tables.has(type)) tables.set(type, []);
    const rows = () => tables.get(type)!;
    const save = async (input: any): Promise<any> => {
      if (Array.isArray(input)) return Promise.all(input.map(save));
      writes.push(type);
      const data: any = Object.fromEntries(
        Object.entries(copy(input)).filter(([, v]) => v !== undefined)
      );
      if (!data.id) data.id = Math.max(1000, ...rows().map(r => r.id)) + 1;
      const index = rows().findIndex(r => r.id === data.id);
      index < 0 ? rows().push(data) : (rows()[index] = { ...rows()[index], ...data });
      return copy(rows().find(r => r.id === data.id));
    };
    const find = async ({ where, relations }: any) =>
      rows()
        .filter(r => matches(r, where))
        .map(r => ({
          ...copy(r),
          ...(type === DetalleRecepcionTecnicaOrm && relations?.includes('lotes')
            ? { lotes: copy(tables.get(RTCLoteOrm)!.filter(l => l.RTCProductoId === r.id)) }
            : {}),
        }));
    return {
      save,
      find,
      findOne: async (options: any) => (await find(options))[0] || null,
      remove: async (items: any[]) => {
        const ids = items.map(i => i.id);
        tables.set(
          type,
          rows().filter(r => !ids.includes(r.id))
        );
      },
      delete: async (where: any) => {
        if (Object.values(where).some(v => v == null))
          throw new Error('No se permite un borrado sin identificador');
        tables.set(
          type,
          rows().filter(r => !matches(r, where))
        );
      },
    };
  };
  let snapshot: any;
  const qr: any = {
    manager: { getRepository: repo },
    connect: jest.fn(),
    release: jest.fn(),
    startTransaction: jest.fn(
      async () => (snapshot = new Map([...tables].map(([k, v]) => [k, copy(v)])))
    ),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(async () => {
      tables.clear();
      for (const [k, v] of snapshot) tables.set(k, v);
    }),
  };
  const detalle = (i: number): any => ({
    id: i + 100,
    itemDetalleId: i,
    productoId: i + 10,
    tipoProductoCode: 1,
    riesgoProductoCode: 4,
    cantidadErrores: 0,
    estadoEmbalajeCode: 1,
    verifiRegSanINVIMA: true,
    reviEtiquetaProducto: true,
    reviOrtografiaSellos: true,
    correspFabriExpediSani: true,
    cumpleRecepcionTecnica: true,
    concentracion: 10,
    UMConcentracionId: 1,
    formaFarmaceuticaId: 5,
    laboratorioId: 2,
    presentacionId: 4,
    temperatura: 22,
    UMTemperaturaCode: 1,
    registroInvima: '2022M-001',
    inspeccion: { cantidadFacturada: 10, novedades: [], motivosRechazo: [] },
    lotes: [
      { id: i + 200, cantidad: 10, lote: 'LOTE' + i, fechaVencimiento: new Date('2027-02-05') },
    ],
  });
  const payload: any = {
    id: 1,
    documentoId: 10,
    tipoDocumentoCode: 2,
    centroId: 1,
    transportadoraId: 6,
    codigoFactura: 'QA',
    detalle: [detalle(20), detalle(21)],
  };
  return {
    tables,
    qr,
    writes,
    payload,
    create: new CreateRecepcionTecnicaImpl({ qr } as any),
    update: new UpdateRecepcionTecnicaImpl({ qr } as any),
  };
}
describe('Escritura transaccional de recepción técnica', () => {
  it('POST guarda solo el producto inspeccionado y no modifica renglones ni existencias originales', async () => {
    const s = setup();
    s.payload.detalle = [s.payload.detalle[0]];
    s.payload.detalle[0].lotes[0].cantidad = 8;
    const documentoOriginal = structuredClone(s.tables.get(DetalleComprobanteEntradaOrm));
    await s.create.execute(s.payload);
    expect(
      JSON.parse(s.tables.get(DetalleRecepcionTecnicaOrm)![0].inspeccionJson).cantidadFisica
    ).toBe(8);
    expect(s.tables.get(DetalleRecepcionTecnicaOrm)![1].inspeccionJson).toBeNull();
    expect(s.tables.get(RTCLoteOrm)!.find(l => l.RTCProductoId === 121).cantidad).toBe(10);
    expect(s.tables.get(DetalleComprobanteEntradaOrm)).toEqual(documentoOriginal);
    expect(
      s.writes.every(t => [RecepcionTecnicaOrm, DetalleRecepcionTecnicaOrm, RTCLoteOrm].includes(t))
    ).toBe(true);
    expect(s.qr.commitTransaction).toHaveBeenCalledTimes(1);
  });
  it('PUT permite dejar un renglón sin lotes sin conservar lotes antiguos ni borrar los de otro producto', async () => {
    const s = setup();
    s.payload.detalle[0].lotes = [];
    s.payload.detalle[0].temperatura = null;
    await s.update.execute(s.payload);
    expect(s.tables.get(RTCLoteOrm)!.filter(l => l.RTCProductoId === 120)).toEqual([]);
    expect(s.tables.get(RTCLoteOrm)!.filter(l => l.RTCProductoId === 121)).toHaveLength(1);
    const p = s.tables.get(DetalleRecepcionTecnicaOrm)![0];
    expect(p.cumpleRecepcionTecnica).toBe(false);
    expect(JSON.parse(p.inspeccionJson).novedades).toEqual([{ tipo: 'FALTANTE', cantidad: 10 }]);
  });
  it('revierte la transacción ante un lote de otro producto y siempre libera la conexión', async () => {
    const s = setup();
    s.payload.detalle = [s.payload.detalle[0]];
    s.payload.detalle[0].lotes[0].id = 221;
    await expect(s.create.execute(s.payload)).rejects.toThrow('lote');
    expect(s.qr.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(s.qr.commitTransaction).not.toHaveBeenCalled();
    expect(s.qr.release).toHaveBeenCalledTimes(1);
    expect(s.tables.get(RTCLoteOrm)).toHaveLength(2);
    expect(s.tables.get(DetalleRecepcionTecnicaOrm)!.every(p => p.inspeccionJson == null)).toBe(
      true
    );
  });
});
