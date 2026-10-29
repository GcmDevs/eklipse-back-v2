import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { fetchAuthsByUser } from '@common/infrastructure/services/authorities';
import { PreauditoriaService } from './preauditoria.service';
import { Actor, Auditoria, Entrega, PERMISOS_PRE, Revision } from '../domain/modelo';
import { CAUSALES_PRE } from '../infrastructure/catalogos';
import { DocumentosPre } from '../infrastructure/documentos';
import { actorPrueba, auditoriaPrueba, pacientePrueba } from '../testing/fixtures';
import { USUARIOS_PRE_SQL } from '../infrastructure/consultas';

jest.mock('@common/infrastructure/services/connections', () => ({ EK_DS: {} }));
jest.mock('@common/infrastructure/services/authorities', () => ({
  fetchAuthsByUser: jest.fn(),
}));
jest.mock('@common/infrastructure/services/base.source', () => {
  const { ADMIN_AUTHORITY } = require('@common/application/constants');
  return {
    BaseSource: class {
      auth = {
        id: 7,
        context: { getCode: () => 'ALTACENTRO' },
        isDim: true,
        user: { fullName: 'Usuario de prueba' },
      };
      conn = { query: jest.fn().mockResolvedValue([{ USUESTADO: 1 }]) };
      testPermisos = [ADMIN_AUTHORITY];
      getTokenDecoded() {
        return { passWasReset: false };
      }
      userCodeAuthorities() {
        return Promise.resolve(this.testPermisos);
      }
    },
  };
});

// Doble transaccional: las pruebas nunca inicializan un DataSource ni ejecutan SQL real.
class Memoria {
  baseDatos = 'DGEMPRES99';
  registros = new Map<string, Auditoria>();
  revisiones: Revision[] = [];
  entregas: Entrega[] = [];
  cambios: any[] = [];
  horas = new Map<
    string,
    { contexto: string; usuario: number; payload: any; version: number; eliminado: boolean }
  >();
  salarios = [{ usuario: 7, vigencia: '2025-01-01', salario: 2100000 }];
  asegurar = jest.fn().mockResolvedValue(undefined);
  instalado = jest.fn().mockResolvedValue(true);
  private cola = Promise.resolve();
  async transaccion<T>(f: (sql: any) => Promise<T>): Promise<T> {
    let liberar: () => void;
    const anterior = this.cola;
    this.cola = new Promise(r => (liberar = r));
    await anterior;
    const copia = structuredClone({
      registros: this.registros,
      revisiones: this.revisiones,
      entregas: this.entregas,
      cambios: this.cambios,
      horas: this.horas,
      salarios: this.salarios,
    });
    try {
      return await f(this);
    } catch (e) {
      Object.assign(this, copia);
      throw e;
    } finally {
      liberar();
    }
  }
  async auditoria(contexto: string, id: string) {
    const r = this.registros.get(id);
    if (!r || r.contexto !== contexto) throw new NotFoundException();
    return structuredClone(r);
  }
  async guardar(_sql: any, r: Auditoria, version: number | null) {
    if (version !== null && this.registros.get(r.id)?.version !== version)
      throw new ConflictException();
    this.registros.set(r.id, structuredClone(r));
  }
  async historial(_sql: any, _a: Actor, id: string, accion: string, antes: any, despues: any) {
    this.cambios.push({ id, accion, antes, despues });
  }
  async notificar() {
    return;
  }
  async query(sql: string, p: any[] = []): Promise<any[]> {
    if (sql.includes('FROM dbo.EKSLNPREAUDSALARIO'))
      return this.salarios.filter(s => s.usuario === p[1]);
    if (sql.includes('FROM dbo.EKSLNPREAUDHORA ') && sql.startsWith('SELECT Payload')) {
      const h = this.horas.get(p[2]);
      return h && h.contexto === p[0] && h.usuario === p[1]
        ? [{ Payload: JSON.stringify(h.payload), Version: h.version, Eliminado: h.eliminado }]
        : [];
    }
    if (sql.includes('FROM dbo.EKSLNPREAUDHORA ') && sql.startsWith('SELECT TOP(1) Id')) {
      return [...this.horas.values()]
        .filter(
          h =>
            !h.eliminado &&
            h.contexto === p[0] &&
            h.usuario === p[1] &&
            h.payload.id !== p[2] &&
            h.payload.calculo.inicio < p[3] &&
            h.payload.calculo.fin > p[4]
        )
        .map(h => ({ Id: h.payload.id }));
    }
    if (
      sql.startsWith('INSERT dbo.EKSLNPREAUDHORA(') ||
      sql.startsWith('UPDATE dbo.EKSLNPREAUDHORA SET Version=')
    ) {
      this.horas.set(p[2], {
        contexto: p[0],
        usuario: p[1],
        payload: JSON.parse(p[6]),
        version: p[3],
        eliminado: false,
      });
      return [];
    }
    if (sql.startsWith('SELECT Payload FROM dbo.EKSLNPREAUDENTREGA'))
      return this.entregas
        .filter(e => e.contexto === p[0] && e.usuario === p[1] && e.solicitud === p[2])
        .map(e => ({ Payload: JSON.stringify(e) }));
    if (sql.startsWith('INSERT dbo.EKSLNPREAUDENTREGA(')) {
      this.entregas.push(JSON.parse(p[5]));
      return [];
    }
    if (sql.startsWith('INSERT dbo.EKSLNPREAUDREVISION(')) {
      this.revisiones.push(JSON.parse(p[4]));
      return [];
    }
    if (sql.startsWith('SELECT Payload FROM dbo.EKSLNPREAUDREVISION'))
      return this.revisiones
        .filter(e => e.auditoriaId === p[0] && e.numero === p[1])
        .map(e => ({ Payload: JSON.stringify(e) }));
    return [];
  }
}
describe('Aplicación: proceso completo y límites de acceso', () => {
  let repo: Memoria, svc: PreauditoriaService, pdf: any, docs: DocumentosPre;
  beforeEach(() => {
    (fetchAuthsByUser as jest.Mock).mockReset().mockResolvedValue({ onlyCodes: [ADMIN_AUTHORITY] });
    repo = new Memoria();
    docs = new DocumentosPre();
    pdf = { obtener: jest.fn(), consumir: jest.fn() };
    svc = new PreauditoriaService({} as Request, repo as any, pdf, docs);
  });
  function agregar(r = auditoriaPrueba()) {
    repo.registros.set(r.id, r);
    return r;
  }
  it('carga la sesión administrativa real con todas las capacidades, aunque falte la instalación', async () => {
    repo.instalado.mockResolvedValue(false);
    const sesion = await svc.sesion();
    expect(sesion.contexto).toBe('ALTACENTRO');
    expect(sesion.baseDatos).toBe('DGEMPRES99');
    expect(sesion.permisos).toEqual(
      Object.fromEntries(Object.keys(PERMISOS_PRE).map(permiso => [permiso, true]))
    );
    expect(sesion.instalado).toBe(false);
  });
  it('rechaza la sesión de un usuario sin permisos de Preauditoría ni administración', async () => {
    (svc as any).testPermisos = [];
    await expect(svc.sesion()).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.instalado).not.toHaveBeenCalled();
  });
  it('permite asignar a un administrador sin el permiso específico de auditoría', async () => {
    const r = agregar(auditoriaPrueba({ estado: 'Sin asignar', responsableId: null }));
    (svc as any).conn.query.mockImplementation(async (sql: string) =>
      sql.startsWith('SELECT OID')
        ? [{ id: 99, nombre: 'Administrador de prueba' }]
        : [{ USUESTADO: 1 }]
    );
    const asignada = await svc.accion(r.id, {
      accion: 'asignar',
      version: r.version,
      responsableId: 99,
    });
    expect(asignada.responsableId).toBe(99);
    expect(asignada.estado).toBe('Pendiente');
    expect(fetchAuthsByUser).toHaveBeenCalledWith({ id: 99, ctx: (svc as any).auth.context });
  });
  it('rechaza asignar a un usuario que coordina pero no tiene autoridad de auditor ni administrador', async () => {
    const r = agregar(auditoriaPrueba({ estado: 'Sin asignar', responsableId: null }));
    (fetchAuthsByUser as jest.Mock).mockResolvedValue({ onlyCodes: [PERMISOS_PRE.asignar] });
    (svc as any).conn.query.mockImplementation(async (sql: string) =>
      sql.startsWith('SELECT OID') ? [{ id: 99, nombre: 'Coordinador' }] : [{ USUESTADO: 1 }]
    );
    await expect(
      svc.accion(r.id, { accion: 'asignar', version: r.version, responsableId: 99 })
    ).rejects.toThrow('permiso para auditar');
    expect(repo.registros.get(r.id).responsableId).toBeNull();
  });
  it('incluye la autoridad administrativa real al consultar el equipo y los destinatarios de solicitudes', async () => {
    const r = agregar();
    const consulta = (svc as any).conn.query as jest.Mock;
    consulta.mockImplementation(async (sql: string) =>
      sql === USUARIOS_PRE_SQL ? [{ id: 99, nombre: 'Administrador' }] : [{ USUESTADO: 1 }]
    );
    await svc.equipo();
    expect(consulta).toHaveBeenCalledWith(USUARIOS_PRE_SQL, [
      PERMISOS_PRE.auditar,
      ADMIN_AUTHORITY,
    ]);
    await svc.accion(r.id, {
      accion: 'solicitarReasignacion',
      version: r.version,
      motivo: 'Revisar asignación',
    });
    expect(consulta).toHaveBeenCalledWith(USUARIOS_PRE_SQL, [
      PERMISOS_PRE.asignar,
      ADMIN_AUTHORITY,
    ]);
    expect(consulta).toHaveBeenCalledWith(USUARIOS_PRE_SQL, [PERMISOS_PRE.equipo, ADMIN_AUTHORITY]);
  });
  it('consulta únicamente las constancias propias cuando falta permiso de equipo', async () => {
    (svc as any).testPermisos = [PERMISOS_PRE.entregar];
    const consulta = jest
      .spyOn(repo, 'query')
      .mockImplementation(async sql => (sql.startsWith('SELECT COUNT') ? [{ total: 0 }] : []));
    await svc.entregas();
    expect(consulta.mock.calls[0][0]).toContain('AND Usuario=@1');
    expect(consulta.mock.calls[0][1]).toEqual(['ALTACENTRO', 7]);
    await expect(svc.constancia('11111111-1111-4111-8111-111111111111')).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(consulta.mock.calls.at(-1)[1]).toEqual([
      '11111111-1111-4111-8111-111111111111',
      'ALTACENTRO',
      0,
      7,
    ]);
  });
  it('detecta borradores guardados desde otra pestaña antes de sobrescribirlos', async () => {
    const r = agregar(auditoriaPrueba({ estado: 'En auditoría' }));
    jest
      .spyOn(repo, 'query')
      .mockImplementation(async sql =>
        sql.startsWith('SELECT Secuencia') ? [{ Secuencia: 2 }] : []
      );
    await expect(
      svc.borrador(r.id, { version: r.version, secuencia: 1, hallazgos: [], notas: 'Mis cambios' })
    ).rejects.toThrow('otra pestaña');
  });
  it('no recalcula al marcar reportado y detecta cruces de horarios', async () => {
    const p = { fecha: '2026-10-27', inicio: '18:00', fin: '20:00', descanso: 0 };
    const r = await svc.guardarHora(p);
    expect(r.calculo.valor).toBe(30000);
    repo.salarios = [{ usuario: 7, vigencia: '2025-01-01', salario: 4200000 }];
    const reportado = await svc.guardarHora({
      id: r.id,
      version: r.version,
      soloReporte: true,
      reportado: true,
    });
    expect(reportado.calculo).toEqual(r.calculo);
    expect(reportado.reportado).toBe(true);
    await expect(svc.guardarHora({ ...p, inicio: '19:00', fin: '21:00' })).rejects.toThrow('cruza');
    expect(repo.horas.size).toBe(1);
    const otro = new PreauditoriaService({} as Request, repo as any, pdf, docs);
    (otro as any).auth.id = 99;
    await expect(
      otro.guardarHora({
        id: r.id,
        version: reportado.version,
        soloReporte: true,
        reportado: false,
      })
    ).rejects.toThrow('ya no existe');
  });
  it('inicia, guarda, previsualiza, finaliza, entrega idempotentemente y reabre conservando revisiones', async () => {
    let r = agregar();
    r = await svc.accion(r.id, { accion: 'iniciar', version: r.version });
    expect(r.estado).toBe('En auditoría');
    const h = {
      codigo: CAUSALES_PRE[0].code,
      servicio: 'Prueba',
      cantidad: 2,
      valorUnitario: 100,
      motivo: 'Prueba',
      area: 'Facturación',
      descripcion: 'Prueba',
      destino: 'preglosa',
    };
    r = await svc.accion(r.id, { accion: 'guardar', version: r.version, hallazgos: [h] });
    r = await svc.accion(r.id, { accion: 'guardar', version: r.version, hallazgos: r.hallazgos });
    expect(r.hallazgos[0].preglosa).toBe(200);
    const vista = await svc.vistaPrevia(r.id, r.version);
    expect(vista.contenido.subarray(0, 5).toString()).toBe('%PDF-');
    r = await svc.finalizar(r.id, { version: r.version, vistaPrevia: vista.token });
    expect(r.estado).toBe('Finalizado');
    expect(repo.revisiones).toHaveLength(1);
    const p = {
      solicitud: '11111111-1111-4111-8111-111111111111',
      items: [{ id: r.id, version: r.version }],
    };
    const entrega = await svc.entregar(p),
      reintento = await svc.entregar(p);
    expect(entrega).toEqual(reintento);
    expect(repo.entregas).toHaveLength(1);
    r = repo.registros.get(r.id);
    const auditado = r.auditado;
    r = await svc.accion(r.id, {
      accion: 'solicitarReapertura',
      version: r.version,
      motivo: 'Revisar soporte',
    });
    r = await svc.accion(r.id, { accion: 'reabrir', version: r.version, motivo: 'Autorizado' });
    expect(r.estado).toBe('En corrección');
    expect(r.auditado).toBe(auditado);
    expect(r.primeraEntrega).toBeTruthy();
    expect(r.entregado).toBeNull();
    expect(repo.revisiones[0].auditoria.estado).toBe('Finalizado');
    expect(repo.entregas[0]).toEqual(entrega);
  });
  it('rechaza cambios entre la vista previa y la finalización', async () => {
    let r = agregar(auditoriaPrueba({ estado: 'En auditoría' }));
    const vista = await svc.vistaPrevia(r.id, r.version);
    r = await svc.accion(r.id, { accion: 'guardar', version: r.version, hallazgos: [] });
    await expect(
      svc.finalizar(r.id, { version: r.version, vistaPrevia: vista.token })
    ).rejects.toThrow('vista previa');
    expect(repo.revisiones).toHaveLength(0);
  });
  it('revierte una entrega completa si un ingreso dejó de estar finalizado', async () => {
    const a = agregar(auditoriaPrueba({ estado: 'Finalizado', revision: 1 })),
      b = agregar();
    await expect(
      svc.entregar({
        solicitud: '11111111-1111-4111-8111-111111111111',
        items: [
          { id: a.id, version: a.version },
          { id: b.id, version: b.version },
        ],
      })
    ).rejects.toThrow('No se entregó');
    expect(repo.registros.get(a.id).estado).toBe('Finalizado');
    expect(repo.entregas).toHaveLength(0);
  });
  it('solo permite un guardado de dos solicitudes con la misma versión', async () => {
    const r = agregar(auditoriaPrueba({ estado: 'En auditoría' })),
      p = { accion: 'guardar', version: 1, hallazgos: [] };
    const resultados = await Promise.allSettled([svc.accion(r.id, p), svc.accion(r.id, p)]);
    expect(resultados.filter(x => x.status === 'fulfilled')).toHaveLength(1);
    expect(repo.registros.get(r.id).version).toBe(2);
  });
  it('un auditor no consulta a otro asignado ni otro contexto', async () => {
    (svc as any).testPermisos = [PERMISOS_PRE.auditar];
    const ajeno = agregar(auditoriaPrueba({ responsableId: 99 }));
    await expect(svc.detalle(ajeno.id)).rejects.toBeInstanceOf(ForbiddenException);
    const otraSede = agregar(auditoriaPrueba({ contexto: 'SANJUAN' }));
    await expect(svc.detalle(otraSede.id)).rejects.toBeInstanceOf(NotFoundException);
  });
  it('consulta de equipo no concede salarios, edición ni horas extras', async () => {
    (svc as any).testPermisos = [PERMISOS_PRE.equipo];
    const r = agregar(auditoriaPrueba({ estado: 'En auditoría' }));
    await expect(
      svc.accion(r.id, { accion: 'guardar', version: 1, hallazgos: [] })
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.salarios(99)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.horas()).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('solo recibe con análisis válido, confirmación de neto e identidad, y motivo manual', async () => {
    const paciente = pacientePrueba(),
      id = '11111111-1111-4111-8111-111111111111';
    pdf.obtener.mockReturnValue({
      id,
      paciente,
      neto: null,
      sha256: 'a'.repeat(64),
      bytes: 100,
      identidadCompleta: false,
    });
    jest.spyOn(svc as any, 'paciente').mockResolvedValue(paciente);
    const p = {
      analisisId: id,
      valor: 1000,
      recibido: '2025-01-01T08:00',
      netoConfirmado: true,
      identidadConfirmada: true,
      justificacion: 'Total verificado en el PDF',
    };
    await expect(svc.recibir({ ...p, netoConfirmado: false })).rejects.toThrow('neto');
    await expect(svc.recibir({ ...p, identidadConfirmada: false })).rejects.toThrow('paciente');
    await expect(svc.recibir({ ...p, justificacion: '' })).rejects.toThrow('justificación');
    const r = await svc.recibir(p);
    expect(r.prefactura.metodo).toBe('manual');
    expect(r.prefactura).not.toHaveProperty('buffer');
    expect(pdf.consumir).toHaveBeenCalledWith(id);
  });
  it('no escribe cuando faltan los scripts ni admite usuarios externos/inactivos', async () => {
    repo.asegurar.mockRejectedValue(new ServiceUnavailableException('Instalación pendiente'));
    await expect(svc.listar({})).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repo.cambios).toHaveLength(0);
    const externo = new PreauditoriaService({} as Request, repo as any, pdf, docs);
    (externo as any).auth.isDim = false;
    await expect(externo.listar({})).rejects.toBeInstanceOf(ForbiddenException);
    const inactivo = new PreauditoriaService({} as Request, repo as any, pdf, docs);
    (inactivo as any).conn.query.mockResolvedValue([{ USUESTADO: 0 }]);
    await expect(inactivo.listar({})).rejects.toBeInstanceOf(ForbiddenException);
  });
});
