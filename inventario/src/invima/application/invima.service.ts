import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseSource } from '@common/infrastructure/services';
import {
  InvimaConfirmacionOrm,
  InvimaProductoOrm,
  InvimaVerificacionOrm,
} from '@inn/orm/inn/invima';
import { construirFiltro, evaluarCoincidencias } from '../domain/comparacion';
import { CriterioInvima, EvidenciaInvima, MedicamentoInput } from '../domain/invima.models';
import { fuentesInvima, SocrataClient, TAMANO_PAGINA } from '../infrastructure/socrata.client';

@Injectable()
export class InvimaService extends BaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private readonly socrata: SocrataClient
  ) {
    super(request);
  }

  private usuario() {
    const user = this.auth.user as any;
    return {
      usuarioId: Number(this.auth.id),
      usuarioNombre: String(
        user.fullName || user.nombreCompleto || user.name || user.document || this.auth.id
      ).slice(0, 240),
    };
  }
  private async producto(id: number, manager = this.conn.manager, lock = false) {
    const producto = await manager.getRepository(InvimaProductoOrm).findOne({
      where: { id },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!producto) throw new NotFoundException('Medicamento no encontrado en este contexto.');
    return producto;
  }
  private async verificacion(
    productoId: number,
    id: number,
    manager = this.conn.manager,
    lock = false
  ) {
    const v = await manager.getRepository(InvimaVerificacionOrm).findOne({
      where: { id, productoId },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!v) throw new NotFoundException('Verificación no encontrada en este contexto.');
    return v;
  }
  private async detalle(v: InvimaVerificacionOrm, manager = this.conn.manager) {
    const confirmacion = await manager
      .getRepository(InvimaConfirmacionOrm)
      .findOneBy({ verificacionId: v.id });
    return {
      ...v,
      entrada: JSON.parse(v.entrada) as MedicamentoInput,
      evidencia: JSON.parse(v.evidencia) as EvidenciaInvima,
      resultado: confirmacion ? 'CONFIRMADA' : v.resultado,
      confirmacion: confirmacion
        ? { ...confirmacion, candidato: JSON.parse(confirmacion.candidato) }
        : null,
    };
  }
  async listar() {
    const productos = await this.conn
      .getRepository(InvimaProductoOrm)
      .find({ order: { id: 'DESC' } });
    // One joined query avoids loading the (potentially large) complete evidence for the list.
    const candidatoSql = `CASE WHEN c.id IS NOT NULL THEN c.candidato
      WHEN v.resultado = 'EXACTA' THEN JSON_QUERY(v.evidencia, '$.seleccionado') END`;
    const ultimas = await this.conn
      .getRepository(InvimaProductoOrm)
      .createQueryBuilder('p')
      .innerJoin(
        InvimaVerificacionOrm,
        'v',
        'v.id = p.ultimaVerificacionId AND v.productoId = p.id AND v.versionProducto = p.version'
      )
      .leftJoin(InvimaConfirmacionOrm, 'c', 'c.verificacionId = v.id')
      .select('p.id', 'productoId')
      .addSelect('v.id', 'id')
      .addSelect('v.resultado', 'resultado')
      .addSelect('v.fecha', 'fecha')
      .addSelect('v.usuarioNombre', 'usuarioNombre')
      .addSelect('c.id', 'confirmacionId')
      .addSelect(`JSON_VALUE(${candidatoSql}, '$.cum')`, 'cumVerificado')
      .addSelect(`JSON_VALUE(${candidatoSql}, '$.estadoCum')`, 'estadoCum')
      .getRawMany();
    const byProducto = new Map(ultimas.map(v => [Number(v.productoId), v]));
    return productos.map(p => {
      const ultima = byProducto.get(p.id);
      return {
        ...p,
        datos: JSON.parse(p.datos),
        resultado: ultima?.confirmacionId ? 'CONFIRMADA' : (ultima?.resultado ?? 'PENDIENTE'),
        cumVerificado: ultima?.cumVerificado?.trim() || null,
        estadoCum: ultima?.estadoCum?.trim() || null,
        ultimaVerificacion: ultima ?? null,
      };
    });
  }
  async crear(input: MedicamentoInput) {
    const now = new Date();
    const p = await this.conn.getRepository(InvimaProductoOrm).save({
      datos: JSON.stringify(this.datos(input)),
      version: 1,
      ultimaVerificacionId: null,
      creadoPor: Number(this.auth.id),
      fechaCreacion: now,
      fechaActualizacion: now,
    });
    return {
      ...p,
      datos: JSON.parse(p.datos),
      resultado: 'PENDIENTE',
      ultimaVerificacion: null,
      cumVerificado: null,
      estadoCum: null,
    };
  }
  private datos(input: MedicamentoInput): MedicamentoInput {
    return Object.fromEntries(
      [
        'nombre',
        'cum',
        'registroSanitario',
        'laboratorio',
        'concentracion',
        'formaFarmaceutica',
        'presentacion',
      ].map(key => [key, (input[key] ?? '').trim()])
    ) as unknown as MedicamentoInput;
  }
  async editar(id: number, input: MedicamentoInput & { version?: number }) {
    return this.conn.transaction(async manager => {
      const p = await this.producto(id, manager, true);
      if (input.version !== p.version)
        throw new ConflictException('El medicamento cambió. Actualice el listado antes de editar.');
      p.datos = JSON.stringify(this.datos(input));
      p.version++;
      p.ultimaVerificacionId = null;
      p.fechaActualizacion = new Date();
      await manager.getRepository(InvimaProductoOrm).save(p);
      return {
        ...p,
        datos: JSON.parse(p.datos),
        resultado: 'PENDIENTE',
        ultimaVerificacion: null,
        cumVerificado: null,
        estadoCum: null,
      };
    });
  }
  async verificar(productoId: number) {
    const p = await this.producto(productoId);
    const entrada = JSON.parse(p.datos) as MedicamentoInput;
    const criterios: CriterioInvima[] = [
      ...(entrada.cum ? ['CUM' as const] : []),
      ...(entrada.registroSanitario ? ['REGISTRO' as const] : []),
      'NOMBRE',
    ];
    const evidencia: EvidenciaInvima = { consultas: [], advertencias: [], seleccionado: null };
    let ultima: Awaited<ReturnType<SocrataClient['consultar']>>[] = [];
    let criterio: CriterioInvima = 'NOMBRE';
    for (criterio of criterios) {
      const where = construirFiltro(entrada, criterio);
      ultima = await Promise.all(
        fuentesInvima().map(f => this.socrata.consultar(f, criterio, where))
      );
      evidencia.consultas.push(...ultima);
      if (ultima.some(c => c.paginas.some(page => page.candidatos.length))) break;
    }
    const candidatos = ultima.flatMap(c => c.paginas.flatMap(page => page.candidatos));
    const evaluacion = evaluarCoincidencias(
      entrada,
      candidatos,
      criterio,
      evidencia.consultas.every(c => !c.error),
      !ultima.some(c => c.paginas.some(page => page.hayMas))
    );
    evidencia.advertencias = evaluacion.advertencias;
    evidencia.seleccionado = evaluacion.seleccionado;
    return this.conn.transaction(async manager => {
      const actual = await this.producto(productoId, manager, true);
      const v = await manager.getRepository(InvimaVerificacionOrm).save({
        productoId,
        versionProducto: p.version,
        entrada: JSON.stringify(entrada),
        resultado: evaluacion.resultado,
        evidencia: JSON.stringify(evidencia),
        fecha: new Date(),
        ...this.usuario(),
      });
      if (actual.version === p.version) {
        actual.ultimaVerificacionId = v.id;
        await manager.getRepository(InvimaProductoOrm).save(actual);
      }
      return this.detalle(v, manager);
    });
  }
  async historial(productoId: number) {
    await this.producto(productoId);
    const verificaciones = await this.conn
      .getRepository(InvimaVerificacionOrm)
      .find({ where: { productoId }, order: { id: 'DESC' } });
    return Promise.all(verificaciones.map(v => this.detalle(v)));
  }
  async candidatos(productoId: number, id: number, fuenteId: string, offset: number) {
    const v = await this.verificacion(productoId, id);
    const evidencia = JSON.parse(v.evidencia) as EvidenciaInvima;
    const consulta = [...evidencia.consultas].reverse().find(c => c.fuente.id === fuenteId);
    if (!consulta || consulta.error)
      throw new BadRequestException('Esta fuente no se pudo consultar. Inicie otra verificación.');
    const cached = consulta.paginas.find(page => page.offset === offset);
    if (cached) return cached;
    if (
      offset % TAMANO_PAGINA !== 0 ||
      !consulta.paginas.some(page => page.offset === offset - TAMANO_PAGINA && page.hayMas)
    )
      throw new BadRequestException('Página de candidatos inválida.');
    const updated = await this.socrata.validarFuente(consulta.fuente, true);
    if (updated !== consulta.actualizadaEn)
      throw new ConflictException(
        'La fuente se actualizó. Inicie otra verificación para consultar los nuevos datos.'
      );
    const page = await this.socrata.pagina(consulta.fuente, consulta.where, offset);
    await this.conn.transaction(async manager => {
      const locked = await this.verificacion(productoId, id, manager, true);
      const current = JSON.parse(locked.evidencia) as EvidenciaInvima;
      const target = [...current.consultas].reverse().find(c => c.fuente.id === fuenteId)!;
      if (!target.paginas.some(p => p.offset === offset)) {
        target.paginas.push(page);
        locked.evidencia = JSON.stringify(current);
        await manager.getRepository(InvimaVerificacionOrm).save(locked);
      }
    });
    return page;
  }
  async confirmar(productoId: number, id: number, clave: string) {
    return this.conn.transaction(async manager => {
      const producto = await this.producto(productoId, manager, true);
      const v = await this.verificacion(productoId, id, manager, true);
      if (producto.version !== v.versionProducto || producto.ultimaVerificacionId !== v.id)
        throw new ConflictException(
          'Esta verificación ya no corresponde a la versión actual del medicamento.'
        );
      const evidencia = JSON.parse(v.evidencia) as EvidenciaInvima;
      if (evidencia.consultas.some(c => c.error))
        throw new BadRequestException(
          'La cobertura está incompleta. Reintente la verificación antes de confirmar.'
        );
      const candidato = evidencia.consultas
        .flatMap(c => c.paginas.flatMap(p => p.candidatos))
        .find(c => c.clave === clave);
      if (!candidato)
        throw new BadRequestException('El candidato no pertenece a la evidencia consultada.');
      if (await manager.getRepository(InvimaConfirmacionOrm).findOneBy({ verificacionId: id }))
        throw new ConflictException('Esta verificación ya fue confirmada.');
      await manager.getRepository(InvimaConfirmacionOrm).save({
        verificacionId: id,
        candidato: JSON.stringify(candidato),
        fecha: new Date(),
        ...this.usuario(),
      });
      return this.detalle(v, manager);
    });
  }
}
