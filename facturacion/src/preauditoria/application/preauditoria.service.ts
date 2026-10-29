import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { BaseSource } from '@common/infrastructure/services/base.source';
import { fetchAuthsByUser } from '@common/infrastructure/services/authorities';
import {
  Actor,
  Auditoria,
  CalculoHoras,
  CONFIGURACION_PRE,
  Entrega,
  FiltrosPre,
  HoraExtra,
  PacienteIngreso,
  PERMISOS_PRE,
  PermisoPre,
  Revision,
  Salario,
} from '../domain/modelo';
import {
  ahora,
  consultar,
  decimal,
  editar,
  exigir,
  fechaDia,
  identificador,
  ingresoValido,
  normalizarHallazgos,
  puede,
  recepcion,
  redondear,
  requerido,
  texto,
  versionEsperada,
} from '../domain/reglas';
import { calcularHoras } from '../domain/horas';
import {
  CAUSALES_PRE,
  AREAS_PRE,
  CUPS_PRE,
  FUENTE_CAUSALES,
  FUENTE_CUPS,
} from '../infrastructure/catalogos';
import { leerJson, RepositorioPre, SqlPre } from '../infrastructure/repositorio';
import { PrefacturasPre } from '../infrastructure/prefactura';
import { INGRESO_PRE_SQL, USUARIOS_PRE_SQL } from '../infrastructure/consultas';
import { DocumentosPre } from '../infrastructure/documentos';

@Injectable({ scope: Scope.REQUEST })
export class PreauditoriaService extends BaseSource {
  private identidad?: Promise<Actor>;
  constructor(
    @Inject(REQUEST) request: Request,
    private readonly repo: RepositorioPre,
    private readonly pdf: PrefacturasPre,
    private readonly documentos: DocumentosPre
  ) {
    super(request);
  }
  private async actor(instalacion = true): Promise<Actor> {
    if (!this.identidad)
      this.identidad = (async () => {
        const auth = this.auth;
        if (!auth.isDim || this.getTokenDecoded().passWasReset)
          throw new ForbiddenException('Se requiere una sesión interna activa de Eklipse.');
        const [usuario] = await this.conn.query('SELECT USUESTADO FROM GENUSUARIO WHERE OID=@0', [
          auth.id,
        ]);
        if (usuario?.USUESTADO !== 1) throw new ForbiddenException('El usuario ya no está activo.');
        const a: Actor = {
          id: auth.id,
          nombre: auth.user.fullName,
          contexto: auth.context.getCode(),
          permisos: await this.userCodeAuthorities(),
        };
        exigir(a, ...(Object.keys(PERMISOS_PRE) as PermisoPre[]));
        return a;
      })();
    const a = await this.identidad;
    if (instalacion) await this.repo.asegurar();
    return a;
  }
  async sesion() {
    const a = await this.actor(false),
      instalado = await this.repo.instalado();
    return {
      id: a.id,
      nombre: a.nombre,
      contexto: a.contexto,
      baseDatos: puede(a, 'configurar') ? this.repo.baseDatos : undefined,
      instalado,
      permisos: Object.fromEntries(
        Object.keys(PERMISOS_PRE).map(k => [k, puede(a, k as PermisoPre)])
      ),
      causales: CAUSALES_PRE,
      areas: AREAS_PRE,
      fuentes: { causales: FUENTE_CAUSALES, cups: FUENTE_CUPS },
      configuracion: instalado ? await this.repo.configuracion(a.contexto) : CONFIGURACION_PRE,
    };
  }
  private async paciente(ingreso: unknown): Promise<PacienteIngreso> {
    const filas = await this.conn.query(INGRESO_PRE_SQL, [ingresoValido(ingreso)]);
    if (!filas.length)
      throw new NotFoundException('El ingreso no existe en el contexto de tu sesión.');
    if (filas.length > 1)
      throw new ConflictException(
        'Hay varios registros con ese consecutivo. Revisa el ingreso en Dinámica.'
      );
    const r = filas[0];
    if (r.estadoClinico === 2)
      throw new BadRequestException('El ingreso está anulado en Dinámica.');
    const tipos: Record<number, string> = {
      1: 'CC',
      2: 'CE',
      3: 'TI',
      4: 'RC',
      5: 'PA',
      6: 'AS',
      7: 'MS',
      8: 'NU',
      9: 'SC',
      10: 'CN',
      11: 'CD',
      12: 'PE',
    };
    return {
      ...r,
      nombre: String(r.nombre || '')
        .replace(/\s+/g, ' ')
        .trim(),
      documento: String(r.documento || '').trim(),
      tipoDocumento: tipos[r.tipoDocumento] || String(r.tipoDocumento),
      centro: String(r.centro || 'Sin centro'),
      entidadCodigo: String(r.entidadCodigo || '').trim(),
      entidad: String(r.entidad || '').trim(),
    };
  }
  async consultarIngreso(ingreso: unknown) {
    const a = await this.actor();
    exigir(a, 'recibir');
    const paciente = await this.paciente(ingreso);
    if (await this.repo.existe(a.contexto, paciente.ingreso))
      throw new ConflictException('Este ingreso ya está registrado en preauditoría.');
    return paciente;
  }
  async analizar(ingreso: unknown, file: Express.Multer.File) {
    const a = await this.actor();
    exigir(a, 'recibir');
    const paciente = await this.consultarIngreso(ingreso);
    return this.pdf.analizar(a, paciente, file);
  }
  async recibir(p: Record<string, unknown>): Promise<Auditoria> {
    const a = await this.actor();
    exigir(a, 'recibir');
    const analisis = this.pdf.obtener(a, identificador(p.analisisId));
    if (p.netoConfirmado !== true)
      throw new BadRequestException('Confirma el neto de la prefactura.');
    if (!analisis.identidadCompleta && p.identidadConfirmada !== true)
      throw new BadRequestException('Comprueba y confirma el paciente e ingreso del PDF.');
    const valor = decimal(p.valor, 'neto de prefactura'),
      manual = analisis.neto === null || valor !== analisis.neto;
    const justificacion = manual ? requerido(p.justificacion, 'justificación del neto', 1000) : '';
    const paciente = await this.paciente(analisis.paciente.ingreso);
    if (JSON.stringify(paciente) !== JSON.stringify(analisis.paciente))
      throw new ConflictException(
        'El ingreso cambió en Dinámica. Vuelve a consultar y adjuntar el PDF.'
      );
    const stamp = ahora();
    const r: Auditoria = {
      id: randomUUID(),
      contexto: a.contexto,
      paciente,
      valor,
      recibido: recepcion(p.recibido),
      registrado: stamp,
      recibidoPor: a.id,
      responsableId: null,
      responsable: '',
      asignado: null,
      iniciado: null,
      auditado: null,
      ultimaFinalizacion: null,
      entregado: null,
      primeraEntrega: null,
      estado: 'Sin asignar',
      version: 1,
      actualizado: stamp,
      notas: '',
      facturador: texto(p.facturador),
      hallazgos: [],
      revision: 0,
      correccion: false,
      esperaMotivo: '',
      esperaDesde: null,
      reapertura: null,
      reasignacion: null,
      correccionDesde: null,
      anulacionMotivo: '',
      prefactura: {
        sha256: analisis.sha256,
        bytes: analisis.bytes,
        metodo: manual ? 'manual' : 'automatico',
        netoDetectado: analisis.neto,
        justificacion,
        identidadConfirmada: analisis.identidadCompleta || p.identidadConfirmada === true,
      },
    };
    await this.repo.transaccion(async sql => {
      await this.repo.guardar(sql, r, null);
      await this.repo.historial(sql, a, r.id, 'recibir', null, r);
    });
    this.pdf.consumir(analisis.id);
    return r;
  }
  async listar(f: FiltrosPre) {
    const a = await this.actor();
    exigir(a, 'equipo', 'auditar');
    return this.repo.listado(a, f);
  }
  async detalle(id: string) {
    const a = await this.actor();
    const r = await this.repo.auditoria(a.contexto, identificador(id));
    consultar(a, r);
    const [borrador] = await this.repo.query(
      'SELECT Payload,Version,Secuencia,Actualizado FROM dbo.EKSLNPREAUDBORRADOR WHERE Contexto=@0 AND Usuario=@1 AND AuditoriaId=@2',
      [a.contexto, a.id, r.id]
    );
    return {
      auditoria: r,
      borrador: borrador
        ? {
            ...leerJson<any>(borrador.Payload),
            version: borrador.Version,
            secuencia: borrador.Secuencia,
            actualizado: borrador.Actualizado,
          }
        : null,
    };
  }
  async equipo() {
    const a = await this.actor();
    exigir(a, 'equipo', 'asignar', 'salarios');
    return this.conn.query(USUARIOS_PRE_SQL, [PERMISOS_PRE.auditar, ADMIN_AUTHORITY]);
  }
  private async destinatarios(permiso: PermisoPre): Promise<{ id: number; nombre: string }[]> {
    return this.conn.query(USUARIOS_PRE_SQL, [PERMISOS_PRE[permiso], ADMIN_AUTHORITY]);
  }
  async accion(id: string, p: Record<string, any>): Promise<Auditoria> {
    const a = await this.actor(),
      accion = requerido(p.accion, 'acción', 30),
      motivo = texto(p.motivo, 1000);
    let destino: { id: number; nombre: string } | null = null;
    if (accion === 'asignar') {
      exigir(a, 'asignar');
      const usuario = Number(p.responsableId);
      if (!Number.isSafeInteger(usuario) || usuario < 1)
        throw new BadRequestException('Selecciona el responsable.');
      const [u] = await this.conn.query(
        'SELECT OID id,USUDESCRI nombre FROM GENUSUARIO WHERE OID=@0 AND USUESTADO=1',
        [usuario]
      );
      const permisos = u ? await fetchAuthsByUser({ id: usuario, ctx: this.auth.context }) : null;
      if (
        !u ||
        !puede(
          {
            id: usuario,
            nombre: u.nombre,
            contexto: a.contexto,
            permisos: permisos.onlyCodes,
          },
          'auditar'
        )
      )
        throw new BadRequestException(
          'El responsable debe estar activo y tener permiso para auditar en este contexto.'
        );
      destino = u;
    }
    let coordinadores =
      accion === 'solicitarReapertura' || accion === 'solicitarReasignacion'
        ? await this.destinatarios(accion === 'solicitarReapertura' ? 'reabrir' : 'asignar')
        : [];
    if (coordinadores.length) {
      const equipo = new Set((await this.destinatarios('equipo')).map(u => u.id));
      coordinadores = coordinadores.filter(u => equipo.has(u.id));
    }
    return this.repo.transaccion(async sql => {
      const anterior = await this.repo.auditoria(a.contexto, identificador(id), sql, true);
      consultar(a, anterior);
      versionEsperada(anterior, p.version);
      const r = structuredClone(anterior),
        stamp = ahora();
      switch (accion) {
        case 'asignar':
          if (['Finalizado', 'Entregado', 'Anulado', 'En corrección'].includes(r.estado))
            throw new BadRequestException('No se puede reasignar en este estado.');
          if (r.responsableId && r.responsableId !== destino.id && !motivo)
            throw new BadRequestException('Justifica la reasignación.');
          r.responsableId = destino.id;
          r.responsable = destino.nombre;
          r.asignado = stamp;
          r.estado = 'Pendiente';
          r.reasignacion = null;
          await this.repo.notificar(
            sql,
            a,
            destino.id,
            r.id,
            `Ingreso ${r.paciente.ingreso} asignado por ${a.nombre}.`
          );
          break;
        case 'iniciar':
          exigir(a, 'auditar');
          if (
            r.responsableId !== a.id ||
            !['Pendiente', 'En espera de información'].includes(r.estado)
          )
            throw new ForbiddenException('No puedes iniciar esta auditoría.');
          r.estado = r.correccion ? 'En corrección' : 'En auditoría';
          r.iniciado = r.iniciado || stamp;
          r.esperaMotivo = '';
          r.esperaDesde = null;
          break;
        case 'guardar':
          editar(a, r);
          r.hallazgos = normalizarHallazgos(p.hallazgos, CAUSALES_PRE);
          r.notas = texto(p.notas, 3000);
          r.facturador = texto(p.facturador);
          break;
        case 'esperar':
          editar(a, r);
          if (!motivo) throw new BadRequestException('Indica la información faltante.');
          r.estado = 'En espera de información';
          r.esperaMotivo = motivo;
          r.esperaDesde = stamp;
          break;
        case 'solicitarReasignacion':
          exigir(a, 'auditar');
          if (
            r.responsableId !== a.id ||
            ['Finalizado', 'Entregado', 'Anulado'].includes(r.estado) ||
            !motivo
          )
            throw new BadRequestException(
              'La solicitud requiere tu ingreso pendiente y un motivo.'
            );
          r.reasignacion = { motivo, usuario: a.id, fecha: stamp };
          break;
        case 'solicitarReapertura':
          exigir(a, 'auditar');
          if (
            r.responsableId !== a.id ||
            !['Finalizado', 'Entregado'].includes(r.estado) ||
            !motivo
          )
            throw new BadRequestException(
              'Solicita la reapertura de tu auditoría finalizada e indica el motivo.'
            );
          r.reapertura = { motivo, usuario: a.id, fecha: stamp };
          break;
        case 'reabrir':
          exigir(a, 'reabrir');
          if (!['Finalizado', 'Entregado'].includes(r.estado) || !motivo)
            throw new BadRequestException(
              'La reapertura requiere una auditoría finalizada y justificación.'
            );
          if (r.responsableId !== a.id && !r.reapertura)
            throw new BadRequestException('El auditor debe solicitar la reapertura.');
          r.estado = 'En corrección';
          r.correccion = true;
          r.correccionDesde = stamp;
          r.entregado = null;
          r.reapertura = null;
          await this.repo.notificar(
            sql,
            a,
            r.responsableId,
            r.id,
            `Reapertura autorizada para el ingreso ${r.paciente.ingreso}.`
          );
          break;
        case 'anular':
          exigir(a, 'reabrir');
          if (r.estado === 'Anulado' || !motivo)
            throw new BadRequestException('Justifica la anulación de una auditoría vigente.');
          r.estado = 'Anulado';
          r.anulacionMotivo = motivo;
          break;
        case 'corregirRecepcion':
          exigir(a, 'recibir');
          if (['Finalizado', 'Entregado', 'Anulado'].includes(r.estado) || !motivo)
            throw new BadRequestException(
              'Justifica la corrección antes de finalizar la auditoría.'
            );
          if (p.recibido !== undefined) r.recibido = recepcion(p.recibido);
          r.facturador = texto(p.facturador);
          break;
        default:
          throw new BadRequestException('Acción no disponible.');
      }
      r.version++;
      r.actualizado = stamp;
      await this.repo.guardar(sql, r, anterior.version);
      if (accion === 'guardar')
        await sql.query('DELETE FROM dbo.EKSLNPREAUDBORRADOR WHERE AuditoriaId=@0 AND Usuario=@1', [
          r.id,
          a.id,
        ]);
      await this.repo.historial(sql, a, r.id, accion, anterior, r, motivo);
      for (const c of coordinadores)
        await this.repo.notificar(
          sql,
          a,
          c.id,
          r.id,
          `${accion === 'solicitarReapertura' ? 'Reapertura' : 'Reasignación'} solicitada para ${r.paciente.ingreso}: ${motivo}`
        );
      return r;
    });
  }
  async borrador(id: string, p: Record<string, any>) {
    const a = await this.actor();
    return this.repo.transaccion(async sql => {
      const r = await this.repo.auditoria(a.contexto, identificador(id), sql, true);
      editar(a, r);
      versionEsperada(r, p.version);
      const hallazgos = normalizarHallazgos(p.hallazgos, CAUSALES_PRE),
        payload = JSON.stringify({
          hallazgos,
          notas: texto(p.notas, 3000),
          facturador: texto(p.facturador),
        });
      const [previo] = await sql.query(
        'SELECT Secuencia FROM dbo.EKSLNPREAUDBORRADOR WITH(UPDLOCK,HOLDLOCK) WHERE Contexto=@0 AND Usuario=@1 AND AuditoriaId=@2',
        [a.contexto, a.id, r.id]
      );
      if ((previo?.Secuencia ?? 0) !== (p.secuencia ?? 0))
        throw new ConflictException(
          'El borrador cambió en otra pestaña. Recarga para recuperarlo.'
        );
      const secuencia = (previo?.Secuencia ?? 0) + 1;
      if (previo)
        await sql.query(
          `UPDATE dbo.EKSLNPREAUDBORRADOR SET Payload=@3,Version=@4,Secuencia=@5,Actualizado=SYSUTCDATETIME() WHERE Contexto=@0 AND Usuario=@1 AND AuditoriaId=@2`,
          [a.contexto, a.id, r.id, payload, r.version, secuencia]
        );
      else
        await sql.query(
          `INSERT dbo.EKSLNPREAUDBORRADOR(Contexto,Usuario,AuditoriaId,Payload,Version,Secuencia,Actualizado) VALUES(@0,@1,@2,@3,@4,@5,SYSUTCDATETIME())`,
          [a.contexto, a.id, r.id, payload, r.version, secuencia]
        );
      return { secuencia, actualizado: ahora() };
    });
  }
  async vistaPrevia(id: string, version: number) {
    const a = await this.actor(),
      r = await this.repo.auditoria(a.contexto, identificador(id));
    editar(a, r);
    versionEsperada(r, version);
    const revision: Revision = {
      id: randomUUID(),
      auditoriaId: r.id,
      numero: r.revision + 1,
      fecha: ahora(),
      responsable: a.nombre,
      formato: 1,
      auditoria: { ...r, responsable: a.nombre },
    };
    const contenido = this.documentos.auditoria(revision, true);
    const token = this.documentos.autorizar(a, r.id, r.version);
    return { contenido, token };
  }
  async finalizar(id: string, p: Record<string, any>) {
    const a = await this.actor();
    this.documentos.comprobar(a, identificador(id), p.version, texto(p.vistaPrevia, 100));
    return this.repo.transaccion(async sql => {
      const previo = await this.repo.auditoria(a.contexto, id, sql, true);
      editar(a, previo);
      versionEsperada(previo, p.version);
      const r = structuredClone(previo),
        stamp = ahora();
      r.estado = 'Finalizado';
      r.correccion = false;
      r.reapertura = null;
      r.auditado = r.auditado || stamp;
      r.ultimaFinalizacion = stamp;
      r.responsable = a.nombre;
      r.revision++;
      r.version++;
      r.actualizado = stamp;
      const revision: Revision = {
        id: randomUUID(),
        auditoriaId: r.id,
        numero: r.revision,
        fecha: stamp,
        responsable: a.nombre,
        formato: 1,
        auditoria: r,
      };
      await this.repo.guardar(sql, r, previo.version);
      await sql.query(
        'INSERT dbo.EKSLNPREAUDREVISION(Id,AuditoriaId,Numero,Fecha,Payload) VALUES(@0,@1,@2,@3,@4)',
        [revision.id, r.id, revision.numero, stamp, JSON.stringify(revision)]
      );
      await sql.query('DELETE FROM dbo.EKSLNPREAUDBORRADOR WHERE AuditoriaId=@0', [r.id]);
      await this.repo.historial(sql, a, r.id, 'finalizar', previo, r);
      return r;
    });
  }
  async revisiones(id: string) {
    await this.detalle(id);
    return this.repo.query(
      'SELECT Id id,Numero numero,Fecha fecha FROM dbo.EKSLNPREAUDREVISION WHERE AuditoriaId=@0 ORDER BY Numero DESC',
      [id]
    );
  }
  async pdfRevision(id: string, numero: number) {
    await this.detalle(id);
    const [r] = await this.repo.query(
      'SELECT Payload FROM dbo.EKSLNPREAUDREVISION WHERE AuditoriaId=@0 AND Numero=@1',
      [id, numero]
    );
    if (!r) throw new NotFoundException('Revisión no encontrada.');
    return this.documentos.auditoria(leerJson<Revision>(r.Payload));
  }
  async historial(id: string, pagina = 1) {
    const a = await this.actor();
    await this.detalle(id);
    if (!Number.isSafeInteger(pagina) || pagina < 1)
      throw new BadRequestException('Página inválida.');
    const [total] = await this.repo.query(
      'SELECT COUNT(*) total FROM dbo.EKSLNPREAUDHISTORIAL WHERE Contexto=@0 AND Objetivo=@1',
      [a.contexto, id]
    );
    const registros = await this.repo.query(
      `SELECT Id id,Responsable responsable,Accion accion,Fecha fecha
      FROM dbo.EKSLNPREAUDHISTORIAL WHERE Contexto=@0 AND Objetivo=@1 ORDER BY Id DESC OFFSET @2 ROWS FETCH NEXT 25 ROWS ONLY`,
      [a.contexto, id, (pagina - 1) * 25]
    );
    return { registros, total: total.total, pagina };
  }
  async cambioHistorial(id: string, evento: number) {
    const a = await this.actor();
    await this.detalle(id);
    if (!Number.isSafeInteger(evento) || evento < 1)
      throw new BadRequestException('Evento inválido.');
    const [r] = await this.repo.query(
      'SELECT Payload payload FROM dbo.EKSLNPREAUDHISTORIAL WHERE Contexto=@0 AND Objetivo=@1 AND Id=@2',
      [a.contexto, id, evento]
    );
    if (!r) throw new NotFoundException('Evento no encontrado.');
    return r;
  }
  async entregar(p: Record<string, any>) {
    const a = await this.actor();
    exigir(a, 'entregar');
    if (!Array.isArray(p.items) || p.items.length < 1 || p.items.length > 500)
      throw new BadRequestException('Selecciona entre 1 y 500 auditorías.');
    const items = p.items
      .map(i => ({ id: identificador(i.id), version: i.version }))
      .sort((x, y) => x.id.localeCompare(y.id));
    if (new Set(items.map(i => i.id)).size !== items.length)
      throw new BadRequestException('Hay auditorías repetidas.');
    const solicitud = identificador(p.solicitud);
    return this.repo.transaccion(async sql => {
      const [existente] = await sql.query(
        'SELECT Payload FROM dbo.EKSLNPREAUDENTREGA WITH(UPDLOCK,HOLDLOCK) WHERE Contexto=@0 AND Usuario=@1 AND Solicitud=@2',
        [a.contexto, a.id, solicitud]
      );
      if (existente) {
        const e = leerJson<Entrega>(existente.Payload);
        if (
          e.items
            .map(i => i.id)
            .sort()
            .join() !== items.map(i => i.id).join()
        )
          throw new ConflictException('Esta solicitud corresponde a otra selección.');
        return e;
      }
      const registros: Auditoria[] = [];
      for (const i of items) {
        const r = await this.repo.auditoria(a.contexto, i.id, sql, true);
        consultar(a, r);
        versionEsperada(r, i.version);
        if (r.estado !== 'Finalizado')
          throw new ConflictException(
            `El ingreso ${r.paciente.ingreso} ya no está finalizado. No se entregó ningún ingreso.`
          );
        registros.push(r);
      }
      const stamp = ahora(),
        id = randomUUID();
      const entrega: Entrega = {
        id,
        codigo: `ENT-${stamp.slice(0, 10).replace(/-/g, '')}-${id.slice(0, 8).toUpperCase()}`,
        contexto: a.contexto,
        usuario: a.id,
        responsable: a.nombre,
        fecha: stamp,
        solicitud,
        total: redondear(registros.reduce((t, r) => t + r.valor, 0)),
        items: registros.map(r => ({
          id: r.id,
          ingreso: r.paciente.ingreso,
          centro: r.paciente.centro,
          valor: r.valor,
          auditor: r.responsable,
          auditado: r.auditado,
          revision: r.revision,
        })),
      };
      await sql.query(
        'INSERT dbo.EKSLNPREAUDENTREGA(Id,Contexto,Usuario,Solicitud,Fecha,Payload) VALUES(@0,@1,@2,@3,@4,@5)',
        [id, a.contexto, a.id, solicitud, stamp, JSON.stringify(entrega)]
      );
      for (const anterior of registros) {
        const r = {
          ...anterior,
          estado: 'Entregado' as const,
          entregado: stamp,
          primeraEntrega: anterior.primeraEntrega || stamp,
          version: anterior.version + 1,
          actualizado: stamp,
        };
        await this.repo.guardar(sql, r, anterior.version);
        await this.repo.historial(sql, a, r.id, 'entregar', anterior, r, entrega.codigo);
        await sql.query(
          'INSERT dbo.EKSLNPREAUDENTREGADETALLE(EntregaId,AuditoriaId,Revision,Valor) VALUES(@0,@1,@2,@3)',
          [id, r.id, r.revision, r.valor]
        );
      }
      return entrega;
    });
  }
  async entregas(pagina = 1) {
    const a = await this.actor();
    exigir(a, 'entregar');
    if (!Number.isSafeInteger(pagina) || pagina < 1)
      throw new BadRequestException('Página inválida.');
    const p: any[] = [a.contexto],
      where = 'Contexto=@0' + (puede(a, 'equipo') ? '' : ' AND Usuario=@1');
    if (!puede(a, 'equipo')) p.push(a.id);
    const [total] = await this.repo.query(
      `SELECT COUNT(*) total FROM dbo.EKSLNPREAUDENTREGA WHERE ${where}`,
      p
    );
    const filas = await this.repo.query(
      `SELECT Payload FROM dbo.EKSLNPREAUDENTREGA WHERE ${where} ORDER BY Fecha DESC,Id OFFSET @${p.length} ROWS FETCH NEXT 25 ROWS ONLY`,
      [...p, (pagina - 1) * 25]
    );
    return { registros: filas.map(r => leerJson<Entrega>(r.Payload)), total: total.total, pagina };
  }
  async constancia(id: string) {
    const a = await this.actor();
    exigir(a, 'entregar');
    const [e] = await this.repo.query(
      'SELECT Payload FROM dbo.EKSLNPREAUDENTREGA WHERE Id=@0 AND Contexto=@1 AND (@2=1 OR Usuario=@3)',
      [identificador(id), a.contexto, puede(a, 'equipo') ? 1 : 0, a.id]
    );
    if (!e) throw new NotFoundException('Constancia no encontrada.');
    return this.documentos.entrega(leerJson<Entrega>(e.Payload));
  }
  async catalogoServicios(buscar: unknown) {
    const a = await this.actor();
    exigir(a, 'auditar', 'recibir', 'configurar');
    const q = texto(buscar, 100).toLocaleLowerCase('es');
    const propios = await this.repo.query(
      'SELECT Codigo code,Nombre name FROM dbo.EKSLNPREAUDCUP WHERE Contexto=@0',
      [a.contexto]
    );
    return [...CUPS_PRE, ...propios]
      .filter(
        c => !q || c.code.toLowerCase().includes(q) || c.name.toLocaleLowerCase('es').includes(q)
      )
      .slice(0, 50);
  }
  async crearCup(p: Record<string, unknown>) {
    const a = await this.actor();
    exigir(a, 'auditar', 'configurar');
    const codigo = requerido(p.codigo, 'código', 30).toUpperCase().replace(/\./g, ''),
      nombre = requerido(p.nombre, 'nombre', 600);
    if (!/^[A-Z0-9_-]+$/.test(codigo) || CUPS_PRE.some(c => c.code === codigo))
      throw new BadRequestException('Código inválido o ya registrado como oficial.');
    await this.repo.transaccion(async sql => {
      await sql.query('INSERT dbo.EKSLNPREAUDCUP(Contexto,Codigo,Nombre) VALUES(@0,@1,@2)', [
        a.contexto,
        codigo,
        nombre,
      ]);
      await this.repo.historial(sql, a, codigo, 'crear_cup', null, { codigo, nombre });
    });
    return { code: codigo, name: nombre };
  }
  async notificaciones() {
    const a = await this.actor();
    return this.repo.query(
      'SELECT TOP(100) Id id,AuditoriaId auditoriaId,Mensaje mensaje,Fecha fecha,Vista vista FROM dbo.EKSLNPREAUDNOTIFICACION WHERE Contexto=@0 AND Usuario=@1 ORDER BY Fecha DESC',
      [a.contexto, a.id]
    );
  }
  async verNotificacion(id: string) {
    const a = await this.actor();
    await this.repo.query(
      'UPDATE dbo.EKSLNPREAUDNOTIFICACION SET Vista=1 WHERE Id=@0 AND Contexto=@1 AND Usuario=@2',
      [identificador(id), a.contexto, a.id]
    );
    return { ok: true };
  }
  async configuracion() {
    const a = await this.actor();
    exigir(a, 'configurar', 'salarios', 'equipo');
    return this.repo.configuracion(a.contexto);
  }
  async configurar(p: Record<string, unknown>) {
    const a = await this.actor();
    exigir(a, 'configurar');
    const config = {
      sinAsignar: decimal(p.sinAsignar, 'plazo sin asignar', 0, 8760),
      auditoria: decimal(p.auditoria, 'plazo auditoría', 0, 8760),
      entrega: decimal(p.entrega, 'plazo entrega', 0, 8760),
    };
    if (Object.values(config).some(n => n < 1))
      throw new BadRequestException('Los plazos deben ser de al menos una hora.');
    await this.repo.transaccion(async sql => {
      const antes = await this.repo.configuracion(a.contexto, sql);
      const filas = await sql.query(
        'UPDATE dbo.EKSLNPREAUDCONFIGURACION SET Payload=@1 OUTPUT INSERTED.Contexto WHERE Contexto=@0',
        [a.contexto, JSON.stringify(config)]
      );
      if (!filas.length)
        await sql.query('INSERT dbo.EKSLNPREAUDCONFIGURACION(Contexto,Payload) VALUES(@0,@1)', [
          a.contexto,
          JSON.stringify(config),
        ]);
      await this.repo.historial(sql, a, 'configuracion', 'configurar', antes, config);
    });
    return config;
  }
  async resumen(f: FiltrosPre) {
    const a = await this.actor();
    exigir(a, 'informes', 'equipo', 'auditar');
    const { where, p } = this.repo.filtros(a, f);
    const estados = await this.repo.query(
      `SELECT Estado estado,COUNT(*) cantidad,COALESCE(SUM(Valor),0) valor FROM dbo.EKSLNPREAUDITORIA WHERE ${where} AND Estado<>'Anulado' GROUP BY Estado`,
      p
    );
    const sedes = await this.repo.query(
      `SELECT Centro centro,COUNT(*) cantidad,SUM(Valor) valor,SUM(CASE WHEN Estado='Entregado' THEN Valor ELSE 0 END) entregado FROM dbo.EKSLNPREAUDITORIA WHERE ${where} AND Estado<>'Anulado' GROUP BY Centro`,
      p
    );
    const productividad = await this.repo.query(
      `SELECT ResponsableId usuario,MAX(JSON_VALUE(Payload,'$.responsable')) responsable,COUNT(*) cantidad,SUM(Valor) valor FROM dbo.EKSLNPREAUDITORIA WHERE ${where} AND Auditado IS NOT NULL AND Estado<>'Anulado' GROUP BY ResponsableId`,
      p
    );
    const diarios = await this.repo.query(
      `SELECT CONVERT(char(10),SWITCHOFFSET(CONVERT(datetimeoffset,JSON_VALUE(Payload,'$.primeraEntrega')),'-05:00'),23) fecha,COUNT(*) cantidad,SUM(Valor) valor FROM dbo.EKSLNPREAUDITORIA WHERE ${where} AND JSON_VALUE(Payload,'$.primeraEntrega') IS NOT NULL AND Estado<>'Anulado' GROUP BY CONVERT(char(10),SWITCHOFFSET(CONVERT(datetimeoffset,JSON_VALUE(Payload,'$.primeraEntrega')),'-05:00'),23) ORDER BY fecha DESC`,
      p
    );
    return { estados, sedes, productividad, diarios };
  }
  async alertas(f: FiltrosPre) {
    const a = await this.actor();
    exigir(a, 'equipo', 'auditar', 'informes');
    const config = await this.repo.configuracion(a.contexto),
      { where, p } = this.repo.filtros(a, f);
    const sql = `FROM dbo.EKSLNPREAUDITORIA CROSS APPLY (SELECT CASE WHEN Estado='Sin asignar' THEN Recibido WHEN Estado='Finalizado' THEN CONVERT(datetimeoffset,JSON_VALUE(Payload,'$.ultimaFinalizacion')) WHEN Estado='En corrección' THEN CONVERT(datetimeoffset,JSON_VALUE(Payload,'$.correccionDesde')) ELSE COALESCE(Asignado,Recibido) END Desde,
      CASE WHEN Estado='Sin asignar' THEN @${p.length} WHEN Estado='Finalizado' THEN @${p.length + 1} ELSE @${p.length + 2} END Limite) plazos
      WHERE ${where} AND Estado NOT IN('Entregado','Anulado') AND DATEDIFF_BIG(minute,Desde,SYSUTCDATETIME())>=Limite*60`;
    const parametros = [...p, config.sinAsignar, config.entrega, config.auditoria];
    const pagina = Number(f.pagina || 1),
      tamano = Number(f.tamano || 25);
    if (!Number.isSafeInteger(pagina) || pagina < 1 || ![10, 25, 50, 100].includes(tamano))
      throw new BadRequestException('Paginación inválida.');
    const [total] = await this.repo.query(`SELECT COUNT(*) total ${sql}`, parametros);
    const registros = await this.repo.query(
      `SELECT Id id,Ingreso ingreso,PacienteNombre paciente,Centro centro,Estado estado,ResponsableId responsableId,Valor valor,Desde desde,Limite limite,CAST(DATEDIFF_BIG(minute,Desde,SYSUTCDATETIME())/60.0 AS decimal(12,1)) horas ${sql} ORDER BY Desde,Id OFFSET @${parametros.length} ROWS FETCH NEXT @${parametros.length + 1} ROWS ONLY`,
      [...parametros, (pagina - 1) * tamano, tamano]
    );
    return { registros, total: total.total, pagina, tamano, configuracion: config };
  }
  async excel(f: FiltrosPre) {
    const a = await this.actor();
    exigir(a, 'informes');
    const registros = (await this.repo.listado(a, f, true)).registros;
    // Una corrección abierta no publica hallazgos hasta finalizar una nueva revisión.
    const revisiones = await this.repo.query(
      `SELECT r.AuditoriaId,r.Payload FROM dbo.EKSLNPREAUDREVISION r
      INNER JOIN dbo.EKSLNPREAUDITORIA a ON a.Id=r.AuditoriaId
      WHERE a.Contexto=@0 AND r.Numero=TRY_CONVERT(int,JSON_VALUE(a.Payload,'$.revision'))
      AND r.AuditoriaId IN(SELECT CONVERT(uniqueidentifier,value) FROM OPENJSON(@1))`,
      [a.contexto, JSON.stringify(registros.map(r => r.id))]
    );
    const publicadas = new Map<string, Auditoria>(
      revisiones.map((r: any) => [
        r.AuditoriaId.toLowerCase(),
        leerJson<Revision>(r.Payload).auditoria,
      ])
    );
    return this.documentos.excel(
      registros.map(r => {
        const publicada = publicadas.get(r.id.toLowerCase());
        return publicada ? { ...r, hallazgos: publicada.hallazgos, notas: publicada.notas } : r;
      })
    );
  }
  async actividad(f: FiltrosPre, grupo = 'mes') {
    const a = await this.actor();
    exigir(a, 'informes', 'equipo', 'auditar');
    if (!['dia', 'semana', 'mes', 'anio'].includes(grupo))
      throw new BadRequestException('Agrupación inválida.');
    // Validar también el rango antes de aplicar las fechas a cada evento, no a la recepción.
    this.repo.filtros(a, f);
    const { where, p } = this.repo.filtros(a, { ...f, desde: undefined, hasta: undefined });
    const condiciones = [where, "Estado<>'Anulado'", 'ev.Fecha IS NOT NULL'];
    if (f.desde) {
      condiciones.push(`ev.Fecha>=CONVERT(datetimeoffset,@${p.length})`);
      p.push(fechaDia(f.desde) + 'T00:00:00-05:00');
    }
    if (f.hasta) {
      condiciones.push(`ev.Fecha<DATEADD(day,1,CONVERT(datetimeoffset,@${p.length}))`);
      p.push(fechaDia(f.hasta) + 'T00:00:00-05:00');
    }
    const dia = "CONVERT(date,SWITCHOFFSET(ev.Fecha,'-05:00'))";
    const periodo =
      grupo === 'semana'
        ? `CONVERT(char(10),DATEADD(day,-(DATEDIFF(day,'19000101',${dia})%7),${dia}),23)`
        : `LEFT(CONVERT(char(10),${dia},23),${grupo === 'anio' ? 4 : grupo === 'mes' ? 7 : 10})`;
    return this.repo.query(
      `SELECT ${periodo} periodo,SUM(CASE WHEN ev.Tipo='asignado' THEN 1 ELSE 0 END) asignados,
      SUM(CASE WHEN ev.Tipo='auditado' THEN 1 ELSE 0 END) auditados,
      SUM(CASE WHEN ev.Tipo='asignado' THEN Valor ELSE 0 END) valorAsignado,SUM(CASE WHEN ev.Tipo='auditado' THEN Valor ELSE 0 END) valorAuditado
      FROM dbo.EKSLNPREAUDITORIA CROSS APPLY(VALUES('asignado',Asignado),('auditado',Auditado)) ev(Tipo,Fecha)
      WHERE ${condiciones.join(' AND ')} GROUP BY ${periodo} ORDER BY periodo DESC`,
      p
    );
  }
  private async salariosUsuario(
    a: Actor,
    usuario: number,
    sql: SqlPre = this.repo
  ): Promise<Salario[]> {
    return (
      await sql.query(
        'SELECT Usuario usuario,CONVERT(char(10),Vigencia,23) vigencia,Salario salario FROM dbo.EKSLNPREAUDSALARIO WHERE Contexto=@0 AND Usuario=@1 ORDER BY Vigencia',
        [a.contexto, usuario]
      )
    ).map(r => ({ ...r, salario: Number(r.salario) }));
  }
  async salarios(usuario?: number) {
    const a = await this.actor();
    const id = usuario === undefined ? a.id : usuario;
    if (!Number.isSafeInteger(id) || id < 1) throw new BadRequestException('Usuario inválido.');
    if (id !== a.id) exigir(a, 'salarios');
    else exigir(a, 'salarios', 'horas');
    return this.salariosUsuario(a, id);
  }
  async guardarSalario(p: Record<string, unknown>) {
    const a = await this.actor();
    exigir(a, 'salarios');
    const usuario = Number(p.usuario),
      vigencia = fechaDia(p.vigencia),
      salario = decimal(p.salario, 'salario', 2, 1e9);
    if (!Number.isSafeInteger(usuario) || usuario < 1 || salario <= 0)
      throw new BadRequestException('Selecciona usuario y salario positivo.');
    if (!(await this.destinatarios('horas')).some(u => u.id === usuario))
      throw new BadRequestException('El usuario debe estar activo y habilitado para horas extras.');
    return this.repo.transaccion(async sql => {
      const anteriores = await this.salariosUsuario(a, usuario, sql);
      const previo = anteriores.find(s => s.vigencia === vigencia);
      if (previo)
        await sql.query(
          'UPDATE dbo.EKSLNPREAUDSALARIO SET Salario=@3 WHERE Contexto=@0 AND Usuario=@1 AND Vigencia=@2',
          [a.contexto, usuario, vigencia, salario]
        );
      else
        await sql.query(
          'INSERT dbo.EKSLNPREAUDSALARIO(Contexto,Usuario,Vigencia,Salario) VALUES(@0,@1,@2,@3)',
          [a.contexto, usuario, vigencia, salario]
        );
      await this.repo.historial(sql, a, `salario:${usuario}`, 'salario', previo || null, {
        usuario,
        vigencia,
        salario,
      });
      return { usuario, vigencia, salario };
    });
  }
  async usuariosSalario() {
    const a = await this.actor();
    exigir(a, 'salarios');
    return this.destinatarios('horas');
  }
  async horas(f: FiltrosPre = {}, exportar = false) {
    const a = await this.actor();
    exigir(a, 'horas');
    const p: any[] = [a.contexto, a.id],
      condiciones = ['Contexto=@0', 'Usuario=@1', 'Eliminado=0'];
    if (f.desde) {
      condiciones.push(`JSON_VALUE(Payload,'$.fecha')>=@${p.length}`);
      p.push(fechaDia(f.desde));
    }
    if (f.hasta) {
      condiciones.push(`JSON_VALUE(Payload,'$.fecha')<=@${p.length}`);
      p.push(fechaDia(f.hasta));
    }
    if (f.desde && f.hasta && f.desde > f.hasta)
      throw new BadRequestException('Rango de fechas inválido.');
    const pagina = Number(f.pagina || 1),
      tamano = Number(f.tamano || 25),
      where = condiciones.join(' AND ');
    if (!Number.isSafeInteger(pagina) || pagina < 1 || ![10, 25, 50, 100].includes(tamano))
      throw new BadRequestException('Paginación inválida.');
    const [totales] = await this.repo.query(
      `SELECT COUNT(*) total,COALESCE(SUM(CONVERT(int,JSON_VALUE(Payload,'$.calculo.minutos'))),0) minutos,
      COALESCE(SUM(CONVERT(decimal(19,2),JSON_VALUE(Payload,'$.calculo.valor'))),0) valor,
      COALESCE(SUM(CASE WHEN JSON_VALUE(Payload,'$.reportado')='true' THEN CONVERT(int,JSON_VALUE(Payload,'$.calculo.minutos')) ELSE 0 END),0) reportados
      FROM dbo.EKSLNPREAUDHORA WHERE ${where}`,
      p
    );
    if (exportar && totales.total > 5000)
      throw new BadRequestException('La exportación admite 5000 registros. Acota las fechas.');
    const registros = await this.repo.query(
      `SELECT Payload FROM dbo.EKSLNPREAUDHORA WHERE ${where} ORDER BY Inicio DESC,Id OFFSET @${p.length} ROWS FETCH NEXT @${p.length + 1} ROWS ONLY`,
      [...p, exportar ? 0 : (pagina - 1) * tamano, exportar ? 5000 : tamano]
    );
    return {
      registros: registros.map(r => leerJson<HoraExtra>(r.Payload)),
      salarios: await this.salariosUsuario(a, a.id),
      totales,
      total: totales.total,
      pagina,
      tamano,
    };
  }
  async calcular(p: Record<string, unknown>): Promise<CalculoHoras> {
    const a = await this.actor();
    exigir(a, 'horas');
    return calcularHoras(p, await this.salariosUsuario(a, a.id));
  }
  async guardarHora(p: Record<string, any>) {
    const a = await this.actor();
    exigir(a, 'horas');
    const id = p.id ? identificador(p.id) : randomUUID();
    return this.repo.transaccion(async sql => {
      const [previa] = await sql.query(
        'SELECT Payload,Version,Eliminado FROM dbo.EKSLNPREAUDHORA WITH(UPDLOCK,HOLDLOCK) WHERE Contexto=@0 AND Usuario=@1 AND Id=@2',
        [a.contexto, a.id, id]
      );
      const anterior: HoraExtra = previa ? leerJson<HoraExtra>(previa.Payload) : null;
      if (previa) {
        if (previa.Eliminado) throw new ConflictException('El registro fue eliminado.');
        versionEsperada(previa ? { version: previa.Version } : null, p.version);
      } else if (p.id || p.version) throw new ConflictException('El registro ya no existe.');
      const soloReporte = p.soloReporte === true;
      if (soloReporte && !anterior)
        throw new BadRequestException('No existe un registro para marcar.');
      const calculo = soloReporte
        ? anterior.calculo
        : calcularHoras(p, await this.salariosUsuario(a, a.id, sql));
      const [cruce] = await sql.query(
        `SELECT TOP(1) Id FROM dbo.EKSLNPREAUDHORA WITH(UPDLOCK,HOLDLOCK) WHERE Contexto=@0 AND Usuario=@1 AND Eliminado=0 AND Id<>@2 AND Inicio<@3 AND Fin>@4`,
        [a.contexto, a.id, id, calculo.fin, calculo.inicio]
      );
      if (cruce)
        throw new ConflictException('El horario se cruza con otro registro de horas extras.');
      const registro: HoraExtra = soloReporte
        ? {
            ...anterior,
            reportado: p.reportado === true,
            version: anterior.version + 1,
            actualizado: ahora(),
          }
        : {
            id,
            version: (anterior?.version || 0) + 1,
            fecha: fechaDia(p.fecha),
            inicio: texto(p.inicio, 5),
            fin: texto(p.fin, 5),
            diaSiguiente: p.diaSiguiente === true,
            descanso: Number(p.descanso),
            divisor: p.divisor == null || p.divisor === '' ? null : Number(p.divisor),
            recargoCompleto: p.recargoCompleto === true,
            nota: texto(p.nota, 1000),
            reportado: p.reportado === true,
            actualizado: ahora(),
            calculo,
          };
      if (anterior)
        await sql.query(
          'UPDATE dbo.EKSLNPREAUDHORA SET Version=@3,Inicio=@4,Fin=@5,Payload=@6 WHERE Contexto=@0 AND Usuario=@1 AND Id=@2',
          [
            a.contexto,
            a.id,
            id,
            registro.version,
            calculo.inicio,
            calculo.fin,
            JSON.stringify(registro),
          ]
        );
      else
        await sql.query(
          'INSERT dbo.EKSLNPREAUDHORA(Contexto,Usuario,Id,Version,Inicio,Fin,Payload,Eliminado) VALUES(@0,@1,@2,@3,@4,@5,@6,0)',
          [
            a.contexto,
            a.id,
            id,
            registro.version,
            calculo.inicio,
            calculo.fin,
            JSON.stringify(registro),
          ]
        );
      await sql.query(
        'INSERT dbo.EKSLNPREAUDHORAHISTORIAL(Contexto,Usuario,HoraId,Fecha,Payload) VALUES(@0,@1,@2,SYSUTCDATETIME(),@3)',
        [a.contexto, a.id, id, JSON.stringify({ antes: anterior, despues: registro })]
      );
      return registro;
    });
  }
  async eliminarHora(id: string, version: number) {
    const a = await this.actor();
    exigir(a, 'horas');
    return this.repo.transaccion(async sql => {
      const [r] = await sql.query(
        'SELECT Payload,Version FROM dbo.EKSLNPREAUDHORA WITH(UPDLOCK,HOLDLOCK) WHERE Contexto=@0 AND Usuario=@1 AND Id=@2 AND Eliminado=0',
        [a.contexto, a.id, identificador(id)]
      );
      if (!r) throw new NotFoundException('Registro no encontrado.');
      versionEsperada({ version: r.Version }, version);
      await sql.query(
        'UPDATE dbo.EKSLNPREAUDHORA SET Eliminado=1,Version=Version+1 WHERE Contexto=@0 AND Usuario=@1 AND Id=@2',
        [a.contexto, a.id, id]
      );
      await sql.query(
        'INSERT dbo.EKSLNPREAUDHORAHISTORIAL(Contexto,Usuario,HoraId,Fecha,Payload) VALUES(@0,@1,@2,SYSUTCDATETIME(),@3)',
        [a.contexto, a.id, id, JSON.stringify({ antes: leerJson(r.Payload), eliminado: true })]
      );
      return { ok: true };
    });
  }
  async historialHora(id: string) {
    const a = await this.actor();
    exigir(a, 'horas');
    return this.repo.query(
      'SELECT TOP(100) Fecha fecha,Payload payload FROM dbo.EKSLNPREAUDHORAHISTORIAL WHERE Contexto=@0 AND Usuario=@1 AND HoraId=@2 ORDER BY Id DESC',
      [a.contexto, a.id, identificador(id)]
    );
  }
  async excelHoras(f: FiltrosPre = {}) {
    const a = await this.actor();
    exigir(a, 'horas');
    const datos = await this.horas(f, true);
    return this.documentos.excelHoras(datos.registros);
  }
}
