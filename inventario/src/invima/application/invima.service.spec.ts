import { InvimaService } from './invima.service';
import {
  InvimaConfirmacionOrm,
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaFacturaItemOrm,
  InvimaFacturaOrm,
} from '@inn/orm/inn/invima';
import { CandidatoInvima, GRUPOS_REGISTROS, TipoProductoInvima } from '../domain/invima.models';
import { SocrataClient } from '../infrastructure/socrata.client';

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
const candidato = {
  clave: 'a'.repeat(64),
  fuenteId: 'vigentes',
  dataset: 'i7cb-raxc',
  cum: '20048021-41',
  nombre: 'CARDIK',
  registroSanitario: 'INVIMA 2023M-0013598-R2',
  estadoRegistro: 'Vigente',
  estadoCum: 'Inactivo',
  presentacion: 'Caja x 10',
  formaFarmaceutica: 'Tableta',
  titular: 'Laboratorio',
} as CandidatoInvima;
function database() {
  const tables = new Map<any, any[]>();
  const copy = <T>(value: T): T => (value == null ? value : structuredClone(value));
  const getRepository = (type: any): any => {
    if (!tables.has(type)) tables.set(type, []);
    const rows = tables.get(type)!;
    const matches = (row: any, where: any) =>
      Object.entries(where ?? {}).every(([key, value]) => row[key] === value);
    return {
      findOne: async ({ where }: any) => copy(rows.find(row => matches(row, where)) ?? null),
      findOneBy: async (where: any) => copy(rows.find(row => matches(row, where)) ?? null),
      find: async ({ where }: any = {}) =>
        copy(rows.filter(row => matches(row, where)).sort((a, b) => b.id - a.id)),
      save: async (input: any) => {
        const row = { ...input, id: input.id ?? rows.length + 1 };
        const index = rows.findIndex(r => r.id === row.id);
        index < 0 ? rows.push(copy(row)) : (rows[index] = copy(row));
        return copy(row);
      },
      createQueryBuilder: () => {
        const builder: any = {};
        let sinFactura = false;
        let ids: number[] | undefined;
        for (const key of ['innerJoin', 'leftJoin', 'select', 'addSelect', 'orderBy'])
          builder[key] = () => builder;
        for (const key of ['where', 'andWhere'])
          builder[key] = (sql: string, params?: any) => {
            if (sql.includes('NOT EXISTS (SELECT 1 FROM EKINNIVFACTURAITEM i WHERE'))
              sinFactura = true;
            if (params?.ids) ids = params.ids;
            return builder;
          };
        builder.getMany = async () =>
          copy(
            rows
              .filter(r => {
                const item = (tables.get(InvimaFacturaItemOrm) || []).find(
                  i => i.productoId === r.id
                );
                const factura =
                  item && (tables.get(InvimaFacturaOrm) || []).find(f => f.id === item.facturaId);
                return (
                  (!ids || ids.includes(r.id)) &&
                  (!sinFactura || !item) &&
                  !factura?.fechaEliminacion
                );
              })
              .sort((a, b) => b.id - a.id)
          );
        builder.getRawMany = async () =>
          (tables.get(InvimaProductoOrm) ?? [])
            .filter(p =>
              (tables.get(InvimaVerificacionOrm) ?? []).some(
                v =>
                  v.id === p.ultimaVerificacionId &&
                  v.productoId === p.id &&
                  v.versionProducto === p.version
              )
            )
            .map(p => {
              const v = (tables.get(InvimaVerificacionOrm) ?? []).find(
                v => v.id === p.ultimaVerificacionId
              );
              const c = (tables.get(InvimaConfirmacionOrm) ?? []).find(
                c => c.verificacionId === v.id
              );
              const seleccionado = c
                ? JSON.parse(c.candidato)
                : v.resultado === 'EXACTA'
                  ? JSON.parse(v.evidencia).seleccionado
                  : null;
              return {
                productoId: p.id,
                id: v.id,
                resultado: v.resultado,
                fecha: v.fecha,
                usuarioNombre: v.usuarioNombre,
                confirmacionId: c?.id,
                cumVerificado: seleccionado?.cum ?? null,
                estadoCum: seleccionado?.estadoCum ?? null,
                estadoRegistro: seleccionado?.estadoRegistro ?? null,
                registroSanitarioVerificado: seleccionado?.registroSanitario ?? null,
                titularInvima: seleccionado?.titular ?? null,
                presentacionInvima: seleccionado?.presentacion ?? null,
                formaFarmaceuticaInvima: seleccionado?.formaFarmaceutica ?? null,
              };
            });
        return builder;
      },
    };
  };
  const manager = { getRepository };
  return { manager, getRepository, transaction: async (work: any) => work(manager) };
}
function setup(encontrado = candidato) {
  const connection = database();
  const socrata = {
    consultar: jest.fn(async (fuente, criterio, where) => ({
      fuente,
      criterio,
      where,
      consultadaEn: new Date().toISOString(),
      actualizadaEn: 100,
      paginas: [
        { offset: 0, hayMas: false, candidatos: fuente.id === 'vigentes' ? [encontrado] : [] },
      ],
    })),
    validarFuente: jest.fn(async () => 100),
    pagina: jest.fn(async () => ({
      offset: 20,
      hayMas: false,
      candidatos: [{ ...candidato, clave: 'b'.repeat(64), cum: '20048021-42' }],
    })),
  };
  const request: any = { connection, auth: { id: 15, user: { fullName: 'Usuario de prueba' } } };
  return {
    connection,
    socrata,
    service: new InvimaService(request, socrata as unknown as SocrataClient),
  };
}
describe('Flujo de registro, consulta e historial INVIMA', () => {
  it.each([false, true])(
    'proyecta registro y titular solo desde la coincidencia vigente y los limpia al editar (%s)',
    async exacta => {
      const { service, socrata } = setup();
      const p = await service.crear({
        nombre: 'CARDIK',
        ...(exacta ? { cum: candidato.cum } : {}),
        laboratorio: 'Laboratorio ingresado',
      });
      const v = await service.verificar(p.id);
      if (!exacta) {
        expect((await service.listar())[0]).toMatchObject({
          registroSanitarioVerificado: null,
          titularInvima: null,
          presentacionInvima: null,
          formaFarmaceuticaInvima: null,
        });
        await service.confirmar(p.id, v.id, candidato.clave);
      }
      socrata.consultar.mockClear();
      const saved = (await service.listar())[0];
      expect(saved).toMatchObject({
        registroSanitarioVerificado: candidato.registroSanitario,
        titularInvima: candidato.titular,
        presentacionInvima: candidato.presentacion,
        formaFarmaceuticaInvima: candidato.formaFarmaceutica,
        datos: { laboratorio: 'Laboratorio ingresado' },
      });
      expect(socrata.consultar).not.toHaveBeenCalled();
      expect(await service.editar(p.id, { nombre: 'Corregido', version: p.version })).toMatchObject(
        { registroSanitarioVerificado: null, titularInvima: null }
      );
      expect((await service.listar())[0]).toMatchObject({
        registroSanitarioVerificado: null,
        titularInvima: null,
      });
      expect(await service.historial(p.id)).toHaveLength(1);
    }
  );
  it.each(['DISPOSITIVO', 'MEDICO_QUIRURGICOS'] as const)(
    'consulta %s por registro en su fuente y exige confirmación manual',
    async tipo => {
      const { service, socrata } = setup();
      socrata.consultar.mockImplementation(async (fuente, criterio, where) => ({
        fuente,
        criterio,
        where,
        consultadaEn: new Date().toISOString(),
        actualizadaEn: 100,
        paginas: [
          {
            offset: 0,
            hayMas: false,
            candidatos: [
              {
                ...candidato,
                fuenteId: fuente.id,
                grupo: fuente.grupo,
                cum: null,
                estadoCum: null,
              },
            ],
          },
        ],
      }));
      const p = await service.crear({
        tipo,
        nombre: 'GUANTES',
        registroSanitario: candidato.registroSanitario,
      });
      const v = await service.verificar(p.id);
      expect(v.resultado).toBe('REVISION');
      expect(v.evidencia.seleccionado).toBeNull();
      expect(socrata.consultar).toHaveBeenCalledTimes(1);
      expect(socrata.consultar.mock.calls[0][0].id).toBe(
        tipo === 'DISPOSITIVO' ? 'dispositivos' : 'registros'
      );
      expect(socrata.consultar.mock.calls[0][2]).toContain(
        tipo === 'DISPOSITIVO' ? 'registro_sanitario' : 'rsynso'
      );
      const confirmed = await service.confirmar(p.id, v.id, candidato.clave);
      expect(confirmed.confirmacion.candidato.estadoCum).toBeNull();
    }
  );
  it('no consulta fuentes para un producto sin clasificar', async () => {
    const { service, socrata } = setup();
    const p = await service.crear({ tipo: 'SIN_CLASIFICAR', nombre: 'Producto' });
    await expect(service.verificar(p.id)).rejects.toMatchObject({ status: 400 });
    expect(socrata.consultar).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    'RS/NSO distingue una búsqueda vacía de un fallo de fuente (%s)',
    async fallo => {
      const { service, socrata } = setup();
      socrata.consultar.mockImplementation(async (fuente, criterio, where) => ({
        fuente,
        criterio,
        where,
        consultadaEn: '',
        actualizadaEn: 100,
        paginas: [{ offset: 0, hayMas: false, candidatos: [] }],
        ...(fallo ? { error: 'HTTP 503' } : {}),
      }));
      const p = await service.crear({
        tipo: 'ALIMENTOS',
        nombre: 'Alimento',
        registroSanitario: 'RSA-123',
      });
      const v = await service.verificar(p.id);
      expect(v.resultado).toBe(fallo ? 'INCOMPLETA' : 'SIN_COINCIDENCIAS');
      expect(socrata.consultar.mock.calls.map(c => c[1])).toEqual(['REGISTRO', 'NOMBRE']);
      expect(socrata.consultar.mock.calls.every(c => c[0].grupo === 'ALIMENTOS')).toBe(true);
    }
  );
  it('pagina RS/NSO con el grupo guardado y confirma un candidato de la segunda página', async () => {
    const { service, socrata } = setup();
    socrata.consultar.mockImplementation(async (fuente, criterio, where) => ({
      fuente,
      criterio,
      where,
      consultadaEn: '',
      actualizadaEn: 100,
      paginas: [
        {
          offset: 0,
          hayMas: true,
          candidatos: [
            { ...candidato, fuenteId: 'registros', grupo: 'ALIMENTOS', cum: null, estadoCum: null },
          ],
        },
      ],
    }));
    socrata.pagina.mockImplementation(async () => ({
      offset: 20,
      hayMas: false,
      candidatos: [
        {
          ...candidato,
          clave: 'b'.repeat(64),
          fuenteId: 'registros',
          grupo: 'ALIMENTOS',
          cum: null,
          estadoCum: null,
        },
      ],
    }));
    const p = await service.crear({ tipo: 'ALIMENTOS', nombre: 'Alimento' });
    const v = await service.verificar(p.id);
    await service.candidatos(p.id, v.id, 'registros', 20);
    expect(socrata.validarFuente).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'registros', grupo: 'ALIMENTOS' }),
      true
    );
    const confirmed = await service.confirmar(p.id, v.id, 'b'.repeat(64));
    expect(confirmed.confirmacion.candidato.grupo).toBe('ALIMENTOS');
  });
  it.each(Object.keys(GRUPOS_REGISTROS) as TipoProductoInvima[])(
    'verifica %s solo en su grupo, guarda candidatos y confirma manualmente',
    async tipo => {
      const { service, socrata } = setup();
      socrata.consultar.mockImplementation(async (fuente, criterio, where) => ({
        fuente,
        criterio,
        where,
        consultadaEn: new Date().toISOString(),
        actualizadaEn: 100,
        paginas: [
          {
            offset: 0,
            hayMas: false,
            candidatos: [
              {
                ...candidato,
                fuenteId: 'registros',
                grupo: fuente.grupo,
                cum: null,
                estadoCum: null,
              },
            ],
          },
        ],
      }));
      const p = await service.crear({
        tipo,
        nombre: 'Producto',
        cum: '000123-01',
        registroSanitario: candidato.registroSanitario,
      });
      const v = await service.verificar(p.id);
      expect(v.resultado).toBe('REVISION');
      expect(v.evidencia.seleccionado).toBeNull();
      expect(socrata.consultar).toHaveBeenCalledTimes(1);
      const [fuente, criterio, where] = socrata.consultar.mock.calls[0];
      expect(fuente).toMatchObject({ id: 'registros', grupo: GRUPOS_REGISTROS[tipo] });
      expect(criterio).toBe('REGISTRO');
      expect(where).toContain(`grupo = '${GRUPOS_REGISTROS[tipo]}'`);
      const confirmed = await service.confirmar(p.id, v.id, candidato.clave);
      expect(confirmed.confirmacion.candidato.grupo).toBe(GRUPOS_REGISTROS[tipo]);
      expect((await service.historial(p.id))[0].entrada.tipo).toBe(tipo);
    }
  );
  it.each(['Activo', '', 'Otro estado publicado'])(
    'devuelve el estado CUM exacto guardado: %s',
    async estadoCum => {
      const { service, socrata } = setup({ ...candidato, estadoCum });
      const p = await service.crear({ nombre: 'CARDIK', cum: candidato.cum });
      expect(p).toMatchObject({ estadoCum: null, cumVerificado: null });
      await service.verificar(p.id);
      socrata.consultar.mockClear();
      expect((await service.listar())[0]).toMatchObject({
        resultado: 'EXACTA',
        estadoCum: estadoCum || null,
        cumVerificado: candidato.cum,
      });
      expect(socrata.consultar).not.toHaveBeenCalled();
    }
  );
  it('no muestra el estado de una verificación correspondiente a otra versión', async () => {
    const { service, connection } = setup();
    const p = await service.crear({ nombre: 'CARDIK', cum: candidato.cum });
    const v = await service.verificar(p.id);
    await connection
      .getRepository(InvimaProductoOrm)
      .save({ ...p, datos: JSON.stringify(p.datos), version: 2, ultimaVerificacionId: v.id });
    expect((await service.listar())[0]).toMatchObject({
      resultado: 'PENDIENTE',
      estadoCum: null,
      cumVerificado: null,
    });
  });
  it('registra, consulta por CUM exacto y conserva usuario, fuente y estados', async () => {
    const { service } = setup();
    const p = await service.crear({ nombre: 'CARDIK', cum: '00020048021-00041' });
    expect(p.resultado).toBe('PENDIENTE');
    const v = await service.verificar(p.id);
    expect(v.resultado).toBe('EXACTA');
    expect(v.evidencia.seleccionado.estadoCum).toBe('Inactivo');
    expect(v.evidencia.consultas).toHaveLength(4);
    expect(v.usuarioNombre).toBe('Usuario de prueba');
    expect((await service.listar())[0].resultado).toBe('EXACTA');
    expect((await service.listar())[0]).toMatchObject({
      estadoCum: 'Inactivo',
      cumVerificado: candidato.cum,
      registroSanitarioVerificado: candidato.registroSanitario,
      titularInvima: candidato.titular,
    });
    expect((await service.historial(p.id))[0].entrada.cum).toBe('00020048021-00041');
  });
  it('selecciona candidatos por nombre y confirma sin reescribir evidencia original', async () => {
    const { service } = setup();
    const p = await service.crear({ nombre: 'CARDIK' });
    const v = await service.verificar(p.id);
    expect(v.resultado).toBe('REVISION');
    expect((await service.listar())[0]).toMatchObject({ estadoCum: null, cumVerificado: null });
    const confirmed = await service.confirmar(p.id, v.id, candidato.clave);
    expect(confirmed.resultado).toBe('CONFIRMADA');
    expect(confirmed.evidencia.seleccionado).toBeNull();
    expect(confirmed.confirmacion.usuarioId).toBe(15);
    expect(confirmed.confirmacion.candidato.cum).toBe(candidato.cum);
    expect((await service.listar())[0].resultado).toBe('CONFIRMADA');
    expect((await service.listar())[0]).toMatchObject({
      estadoCum: 'Inactivo',
      cumVerificado: candidato.cum,
    });
    await expect(service.confirmar(p.id, v.id, candidato.clave)).rejects.toThrow(
      'ya fue confirmada'
    );
  });
  it('editar invalida la última consulta, preserva historial y evita confirmar una versión antigua', async () => {
    const { service } = setup();
    const p = await service.crear({ nombre: 'CARDIK' });
    const v = await service.verificar(p.id);
    const edited = await service.editar(p.id, { nombre: 'Nuevo nombre', version: p.version });
    expect(edited.version).toBe(2);
    expect(edited.ultimaVerificacionId).toBeNull();
    expect(edited).toMatchObject({ estadoCum: null, cumVerificado: null });
    expect((await service.listar())[0]).toMatchObject({
      resultado: 'PENDIENTE',
      estadoCum: null,
      cumVerificado: null,
    });
    expect((await service.historial(p.id))[0].entrada.nombre).toBe('CARDIK');
    await expect(service.confirmar(p.id, v.id, candidato.clave)).rejects.toThrow('versión actual');
    await expect(service.editar(p.id, { nombre: 'Perdido', version: 1 })).rejects.toThrow('cambió');
  });
  it('una edición concurrente no recibe el resultado de la versión previa', async () => {
    const { service, socrata } = setup();
    const p = await service.crear({ nombre: 'CARDIK', cum: candidato.cum });
    const original = socrata.consultar.getMockImplementation()!;
    let changed = false;
    socrata.consultar.mockImplementation(async (...args) => {
      if (!changed) {
        changed = true;
        await service.editar(p.id, { nombre: 'Otro', version: 1 });
      }
      return original(...args);
    });
    await service.verificar(p.id);
    expect((await service.listar())[0].resultado).toBe('PENDIENTE');
    expect(await service.historial(p.id)).toHaveLength(1);
  });
  it('distingue ausencia de resultados de una fuente caída y continúa con otras consultas', async () => {
    const { service, socrata } = setup();
    socrata.consultar.mockImplementation(async (fuente, criterio, where) => ({
      fuente,
      criterio,
      where,
      consultadaEn: '',
      actualizadaEn: 100,
      paginas: [{ offset: 0, hayMas: false, candidatos: [] }],
      ...(fuente.id === 'otros' ? { error: 'HTTP 503' } : {}),
    }));
    const p = await service.crear({ nombre: 'Ausente', cum: '111-1', registroSanitario: 'OTRO' });
    const v = await service.verificar(p.id);
    expect(v.resultado).toBe('INCOMPLETA');
    expect((await service.listar())[0]).toMatchObject({ estadoCum: null, cumVerificado: null });
    expect(socrata.consultar).toHaveBeenCalledTimes(12);
    await expect(service.confirmar(p.id, v.id, candidato.clave)).rejects.toThrow('cobertura');
  });
  it('página siguiente se guarda y solo admite candidatos de la evidencia consultada', async () => {
    const { service, socrata } = setup();
    const original = socrata.consultar.getMockImplementation()!;
    socrata.consultar.mockImplementation(async (...args) => {
      const c = await original(...args);
      c.paginas[0].hayMas = args[0].id === 'vigentes';
      return c;
    });
    const p = await service.crear({ nombre: 'CARDIK' });
    const v = await service.verificar(p.id);
    await expect(service.candidatos(p.id, v.id, 'vigentes', 40)).rejects.toThrow('Página');
    await expect(service.confirmar(p.id, v.id, 'b'.repeat(64))).rejects.toThrow('evidencia');
    const page = await service.candidatos(p.id, v.id, 'vigentes', 20);
    expect(page.candidatos[0].cum).toBe('20048021-42');
    await service.candidatos(p.id, v.id, 'vigentes', 20);
    expect(socrata.pagina).toHaveBeenCalledTimes(1);
    expect((await service.confirmar(p.id, v.id, 'b'.repeat(64))).resultado).toBe('CONFIRMADA');
    expect((await service.listar())[0]).toMatchObject({
      estadoCum: 'Inactivo',
      cumVerificado: '20048021-42',
    });
  });
  it('no mezcla páginas de una fuente actualizada con evidencia histórica', async () => {
    const { service, socrata } = setup();
    const original = socrata.consultar.getMockImplementation()!;
    socrata.consultar.mockImplementation(async (...args) => {
      const c = await original(...args);
      c.paginas[0].hayMas = true;
      return c;
    });
    const p = await service.crear({ nombre: 'CARDIK' });
    const v = await service.verificar(p.id);
    socrata.validarFuente.mockResolvedValue(200);
    await expect(service.candidatos(p.id, v.id, 'vigentes', 20)).rejects.toThrow('actualizó');
  });
  it('aísla productos e historial entre conexiones de contextos', async () => {
    const a = setup(),
      b = setup();
    const p = await a.service.crear({ nombre: 'Contexto A' });
    await expect(b.service.verificar(p.id)).rejects.toThrow('contexto');
    await expect(b.service.historial(p.id)).rejects.toThrow('contexto');
    expect(await b.service.listar()).toEqual([]);
  });
});
