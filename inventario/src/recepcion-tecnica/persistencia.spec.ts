import { prepararInspecciones } from '../../legacy/recepciones-tecnicas/infrastructure/services/inspeccion';
import { DetalleRecepcionTecnicaOrm } from '../../legacy/recepciones-tecnicas/@orm/inn/farmacia/recepcion-tecnica';
import { normalizarInspeccion } from './inspeccion';
jest.mock('@common/application/services', () => ({ RSAServices: {} }));

function setup() {
  const producto: any = {
    itemDetalleId: 20,
    productoId: 30,
    tipoProductoCode: 1,
    cantidadErrores: 0,
    estadoEmbalajeCode: 1,
    verifiRegSanINVIMA: true,
    reviEtiquetaProducto: true,
    reviOrtografiaSellos: true,
    correspFabriExpediSani: true,
    cumpleRecepcionTecnica: false,
    concentracion: 10,
    UMConcentracionId: 1,
    formaFarmaceuticaId: 2,
    temperatura: 22,
    registroInvima: '2022M-001',
    inspeccion: { cantidadFacturada: 10, novedades: [], motivosRechazo: [] },
    lotes: [{ cantidad: 8, lote: 'A', fechaVencimiento: new Date('2027-02-05') }],
  };
  const payload: any = { documentoId: 10, tipoDocumentoCode: 2, detalle: [producto] };
  const recepcion: any = { id: 1, documentoId: 10, tipoDocumentoCode: 2, createdAt: new Date() };
  const anteriores: any[] = [];
  let origen: any = { id: 20 };
  const findOne = jest.fn(async ({ where }: any) =>
    where.id === 20 && where.comprobanteEntradaId === 10 && where.productoId === 30 ? origen : null
  );
  const manager: any = {
    getRepository: (type: any) =>
      type === DetalleRecepcionTecnicaOrm ? { find: async () => anteriores } : { findOne },
  };
  return {
    producto,
    payload,
    recepcion,
    anteriores,
    manager,
    heredado: () => (origen = { itemRemision: { rctProducto: { id: 8 } } }),
  };
}
describe('Persistencia de inspección en el contexto/transacción actual', () => {
  it('serializar nuevamente conserva la inspección y reconoce el tipo vital', () => {
    const s = setup();
    const orm = new DetalleRecepcionTecnicaOrm();
    orm.tipoProductoCode = 4;
    orm.inspeccionJson = JSON.stringify(
      normalizarInspeccion(s.producto.inspeccion, s.producto, s.producto.lotes, 7).inspeccion
    );
    orm.setTypes();
    const inspeccion = orm.inspeccion;
    orm.setTypes();
    expect(orm.tipoProducto.getCode()).toBe(4);
    expect(orm.inspeccion).toEqual(inspeccion);
    expect(orm.inspeccion.cantidadFisica).toBe(8);
    expect(orm.inspeccionJson).toBeUndefined();
  });
  it('recalcula resultado y auditoría, sin aceptar evidencia interna del cliente', async () => {
    const s = setup();
    s.producto.inspeccionPersistida = { actualizadoPor: 999 };
    await prepararInspecciones(s.manager, s.payload, s.recepcion, 7);
    expect(s.producto.cumpleRecepcionTecnica).toBe(true);
    expect(s.producto.inspeccionPersistida).toMatchObject({
      actualizadoPor: 7,
      cantidadFisica: 8,
      novedades: [{ tipo: 'FALTANTE', cantidad: 2 }],
    });
  });
  it('preserva inspección y lotes cuando un cliente anterior omite los campos', async () => {
    const s = setup();
    const guardada = normalizarInspeccion(
      s.producto.inspeccion,
      s.producto,
      s.producto.lotes,
      7
    ).inspeccion;
    s.anteriores.push({
      id: 5,
      itemDetalleId: 20,
      productoId: 30,
      inspeccionJson: JSON.stringify(guardada),
      lotes: [{ ...s.producto.lotes[0], id: 99 }],
    });
    delete s.producto.inspeccion;
    delete s.producto.lotes;
    await prepararInspecciones(s.manager, s.payload, s.recepcion, 8);
    expect(s.producto.lotes[0].id).toBe(99);
    expect(s.producto.inspeccionPersistida.cantidadFacturada).toBe(10);
    expect(s.producto.inspeccionPersistida.novedades).toEqual(guardada.novedades);
  });
  it('normaliza cero físico y vital sin dejar datos sanitarios aplicables', async () => {
    const s = setup();
    s.producto.tipoProductoCode = 4;
    s.producto.inspeccion.ium = '001ABC';
    s.producto.lotes = [];
    s.producto.temperatura = null;
    await prepararInspecciones(s.manager, s.payload, s.recepcion, 7);
    expect(s.producto).toMatchObject({
      temperatura: null,
      registroInvima: null,
      verifiRegSanINVIMA: false,
      correspFabriExpediSani: false,
      tamanioMuestra: 0,
      nivelInspeccion: 'N/A',
      cumpleRecepcionTecnica: false,
    });
  });
  it('dispositivo elimina concentración, unidad y forma farmacéutica del guardado', async () => {
    const s = setup();
    s.producto.tipoProductoCode = 2;
    await prepararInspecciones(s.manager, s.payload, s.recepcion, 7);
    expect(s.producto).toMatchObject({
      concentracion: null,
      UMConcentracionId: null,
      formaFarmaceuticaId: null,
    });
  });
  it('rechaza renglones ajenos, ids de lotes ajenos y remisiones heredadas', async () => {
    const s = setup();
    s.producto.productoId = 31;
    await expect(prepararInspecciones(s.manager, s.payload, s.recepcion, 7)).rejects.toThrow(
      'contexto'
    );
    s.producto.productoId = 30;
    s.producto.lotes[0].id = 999;
    await expect(prepararInspecciones(s.manager, s.payload, s.recepcion, 7)).rejects.toThrow(
      'lote'
    );
    delete s.producto.lotes[0].id;
    s.heredado();
    await expect(prepararInspecciones(s.manager, s.payload, s.recepcion, 7)).rejects.toThrow(
      'solo lectura'
    );
  });
  it('rechaza recepciones cerradas y otro documento del mismo contexto', async () => {
    const s = setup();
    s.recepcion.documentoId = 11;
    await expect(prepararInspecciones(s.manager, s.payload, s.recepcion, 7)).rejects.toThrow(
      'documento'
    );
    s.recepcion.documentoId = 10;
    s.recepcion.createdAt = new Date(Date.now() - 8 * 86400000);
    await expect(prepararInspecciones(s.manager, s.payload, s.recepcion, 7)).rejects.toThrow(
      'cerrada'
    );
  });
});
