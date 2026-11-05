import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { EntityManager } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import {
  InvimaFacturaOrm,
  InvimaFacturaItemOrm,
  InvimaRecepcionOrm,
  InvimaRecepcionItemOrm,
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaConfirmacionOrm,
} from '@inn/orm/inn/invima';
import { InvimaService } from './invima.service';
import {
  compararRecepcion,
  fisicoVacio,
  FisicoRecepcion,
  validarDecision,
  DecisionRecepcion,
  BorradorRecepcion,
  FisicoBorradorRecepcion,
  ErrorValidacionRecepcion,
} from '../domain/recepcion.models';
import { RenglonFactura } from '../domain/factura.models';
import {
  GuardarBorradorRecepcionDto,
  GuardarRecepcionItemDto,
} from '../presentation/recepcion.dto';
import { calcularMuestreo } from '../../recepcion-tecnica/inspeccion';

@Injectable()
export class RecepcionInvimaService extends BaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private readonly invima: InvimaService
  ) {
    super(request);
  }
  private async factura(id: number, manager: EntityManager, lock = false) {
    const f = await manager.getRepository(InvimaFacturaOrm).findOne({
      where: { id },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!f || f.fechaEliminacion)
      throw new NotFoundException('Documento no encontrado en este contexto.');
    if (f.estado !== 'REVISADA')
      throw new ConflictException('Primero valide y guarde la revisión del documento.');
    return f;
  }
  private async recepcion(facturaId: number, manager: EntityManager, lock = false) {
    return manager.getRepository(InvimaRecepcionOrm).findOne({
      where: { facturaId },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
  }
  private abierta(r: InvimaRecepcionOrm | null, version: number) {
    if (!r) throw new NotFoundException('Inicie la recepción del documento.');
    if (r.estado === 'FINALIZADA')
      throw new ConflictException('La recepción finalizada es de solo lectura.');
    if (r.version !== version)
      throw new ConflictException(
        'La recepción cambió. Recargue antes de guardar; su captura no se ha sobrescrito.'
      );
  }
  private leerFisico(json: string) {
    const { borradorRecepcion, ...fisico } = JSON.parse(json) as FisicoRecepcion & {
      borradorRecepcion?: BorradorRecepcion;
    };
    return { fisico, borrador: borradorRecepcion || null };
  }
  private copiarFisico<T extends FisicoRecepcion | FisicoBorradorRecepcion>(fisico: T): T {
    // Never accept reserved draft metadata or arbitrary JSON from request bodies.
    const copia = Object.fromEntries(
      Object.keys(fisicoVacio(fisico.tipo))
        .filter(key => fisico[key] !== undefined)
        .map(key => [key, fisico[key]])
    );
    copia.lotes = fisico.lotes.map(l => ({
      cantidad: l.cantidad,
      lote: l.lote,
      vencimiento: l.vencimiento,
    }));
    return copia as T;
  }
  private errorValidacion(error: Error, item: InvimaRecepcionItemOrm, prefijo = '') {
    return new BadRequestException({
      message: `${prefijo}${error.message}`,
      ...(error instanceof ErrorValidacionRecepcion ? { campos: error.campos } : {}),
      facturaItemId: item.facturaItemId,
    });
  }
  async iniciar(id: number) {
    await this.conn.transaction(async manager => {
      await this.factura(id, manager, true);
      if (await this.recepcion(id, manager, true)) return;
      const items = await manager
        .getRepository(InvimaFacturaItemOrm)
        .find({ where: { facturaId: id, excluido: false }, order: { orden: 'ASC' } });
      if (!items.length)
        throw new BadRequestException('El documento no tiene productos incluidos.');
      const now = new Date();
      const r = await manager.getRepository(InvimaRecepcionOrm).save({
        facturaId: id,
        estado: 'BORRADOR',
        version: 1,
        creadoPor: Number(this.auth.id),
        actualizadoPor: Number(this.auth.id),
        fechaCreacion: now,
        fechaActualizacion: now,
        fechaFinalizacion: null,
      });
      for (const i of items) {
        const datos = JSON.parse(i.datos) as RenglonFactura;
        await manager.getRepository(InvimaRecepcionItemOrm).save({
          recepcionId: r.id,
          facturaItemId: i.id,
          productoId: null,
          facturado: JSON.stringify({ ...datos, productoId: i.productoId, numeroDocumento: id }),
          fisico: JSON.stringify(fisicoVacio(datos.tipo)),
          decision: 'PENDIENTE',
          justificacion: '',
          version: 1,
          usuarioId: Number(this.auth.id),
          fecha: now,
        });
      }
    });
    return this.detalle(id);
  }
  async detalle(id: number) {
    await this.factura(id, this.conn.manager);
    const r = await this.recepcion(id, this.conn.manager);
    if (!r) return null;
    const items = await this.conn
      .getRepository(InvimaRecepcionItemOrm)
      .find({ where: { recepcionId: r.id }, order: { id: 'ASC' } });
    const productos = await this.invima.listar(
      items.filter(i => i.productoId).map(i => i.productoId!)
    );
    return {
      ...r,
      renglones: items.map(i => {
        const facturado = JSON.parse(i.facturado) as RenglonFactura;
        const { fisico, borrador } = this.leerFisico(i.fisico);
        return {
          ...i,
          facturado,
          fisico,
          borrador,
          diferencias: compararRecepcion(facturado, fisico),
          muestreo:
            fisico.cantidad === null
              ? null
              : calcularMuestreo(fisico.cantidad, fisico.erroresCriticos),
          producto: productos.find(p => p.id === i.productoId) || null,
        };
      }),
    };
  }
  private async oficialFactura(
    facturaId: number,
    item: InvimaRecepcionItemOrm,
    manager: EntityManager
  ) {
    // Resolve the current invoice association inside this context, never the physical product
    // or the product id preserved in the historical snapshot.
    const linea = await manager.getRepository(InvimaFacturaItemOrm).findOneBy({
      id: item.facturaItemId,
      facturaId,
      excluido: false,
    });
    if (!linea) throw new NotFoundException('Renglón no encontrado en este documento.');
    if (!linea.productoId) return 'PENDIENTE';
    const p = await manager.getRepository(InvimaProductoOrm).findOneBy({ id: linea.productoId });
    if (!p?.ultimaVerificacionId) return 'PENDIENTE';
    const v = await manager
      .getRepository(InvimaVerificacionOrm)
      .findOneBy({ id: p.ultimaVerificacionId, productoId: p.id, versionProducto: p.version });
    if (!v) return 'PENDIENTE';
    const c = await manager
      .getRepository(InvimaConfirmacionOrm)
      .findOneBy({ verificacionId: v.id });
    return c ? 'CONFIRMADA' : v.resultado;
  }
  async guardar(id: number, itemId: number, input: GuardarRecepcionItemDto) {
    await this.conn.transaction(async manager => {
      await this.factura(id, manager, true);
      const r = await this.recepcion(id, manager, true);
      this.abierta(r, input.recepcionVersion);
      const repo = manager.getRepository(InvimaRecepcionItemOrm);
      const i = await repo.findOneBy({ id: itemId, recepcionId: r!.id });
      if (!i) throw new NotFoundException('Renglón no encontrado en esta recepción.');
      if (i.version !== input.version)
        throw new ConflictException('El renglón cambió. Recargue la recepción.');
      const { fisico: previo } = this.leerFisico(i.fisico);
      const f: FisicoRecepcion = this.copiarFisico({
        ...input.fisico,
        ...(input.fisico.registroSanitarioRevisado === undefined &&
        previo.registroSanitarioRevisado !== undefined
          ? { registroSanitarioRevisado: previo.registroSanitarioRevisado }
          : {}),
      });
      // Physical capture no longer creates or updates official verification products.
      // Keep previous physical links and their history untouched for legacy receipts.
      const oficial = await this.oficialFactura(id, i, manager);
      try {
        validarDecision(JSON.parse(i.facturado), f, input.decision, input.justificacion, oficial);
      } catch (e) {
        throw this.errorValidacion(e, i);
      }
      i.fisico = JSON.stringify(f);
      i.decision = input.decision;
      i.justificacion = input.justificacion.trim();
      i.version++;
      i.usuarioId = Number(this.auth.id);
      i.fecha = new Date();
      await repo.save(i);
      r!.version++;
      r!.actualizadoPor = Number(this.auth.id);
      r!.fechaActualizacion = i.fecha;
      await manager.getRepository(InvimaRecepcionOrm).save(r!);
    });
    return this.detalle(id);
  }
  async guardarBorrador(id: number, itemId: number, input: GuardarBorradorRecepcionDto) {
    await this.conn.transaction(async manager => {
      await this.factura(id, manager, true);
      const r = await this.recepcion(id, manager, true);
      this.abierta(r, input.recepcionVersion);
      const repo = manager.getRepository(InvimaRecepcionItemOrm);
      const i = await repo.findOneBy({ id: itemId, recepcionId: r!.id });
      if (!i) throw new NotFoundException('Renglón no encontrado en esta recepción.');
      if (i.version !== input.version)
        throw new ConflictException('El renglón cambió. Recargue la recepción.');
      const linea = await manager.getRepository(InvimaFacturaItemOrm).findOneBy({
        id: i.facturaItemId,
        facturaId: id,
        excluido: false,
      });
      if (!linea) throw new NotFoundException('Renglón no encontrado en este documento.');
      const { fisico, borrador: anterior } = this.leerFisico(i.fisico);
      const previo = anterior?.fisico || fisico;
      const captura = this.copiarFisico({
        ...input.fisico,
        ...(input.fisico.registroSanitarioRevisado === undefined &&
        previo.registroSanitarioRevisado !== undefined
          ? { registroSanitarioRevisado: previo.registroSanitarioRevisado }
          : {}),
      });
      const user = this.auth.user as any;
      const now = new Date();
      const borrador: BorradorRecepcion = {
        fisico: captura,
        decision: input.decision,
        justificacion: input.justificacion,
        fecha: now.toISOString(),
        usuarioId: Number(this.auth.id),
        usuarioNombre: String(user?.fullName || user?.nombreCompleto || user?.name || this.auth.id),
      };
      i.fisico = JSON.stringify({ ...fisico, borradorRecepcion: borrador });
      i.version++;
      i.usuarioId = Number(this.auth.id);
      i.fecha = now;
      await repo.save(i);
      r!.version++;
      r!.actualizadoPor = Number(this.auth.id);
      r!.fechaActualizacion = now;
      await manager.getRepository(InvimaRecepcionOrm).save(r!);
    });
    return this.detalle(id);
  }
  async finalizar(id: number, version: number) {
    await this.conn.transaction(async manager => {
      await this.factura(id, manager, true);
      const r = await this.recepcion(id, manager, true);
      this.abierta(r, version);
      const items = await manager
        .getRepository(InvimaRecepcionItemOrm)
        .find({ where: { recepcionId: r!.id } });
      const parcial = items.find(i => this.leerFisico(i.fisico).borrador);
      if (parcial)
        throw this.errorValidacion(
          new ErrorValidacionRecepcion(
            'Hay capturas parciales pendientes. Guarde cada producto antes de finalizar la recepción.',
            ['borrador']
          ),
          parcial
        );
      const pendiente = items.find(i => i.decision === 'PENDIENTE');
      if (!items.length || pendiente) {
        const message = 'Guarde una decisión para todos los productos antes de finalizar.';
        if (pendiente)
          throw this.errorValidacion(
            new ErrorValidacionRecepcion(message, ['decision']),
            pendiente
          );
        throw new BadRequestException(message);
      }
      for (const i of items) {
        const oficial = await this.oficialFactura(id, i, manager);
        try {
          validarDecision(
            JSON.parse(i.facturado),
            this.leerFisico(i.fisico).fisico,
            i.decision as DecisionRecepcion,
            i.justificacion,
            oficial
          );
        } catch (e) {
          throw this.errorValidacion(e, i, `Producto ${i.facturaItemId}: `);
        }
      }
      r!.estado = 'FINALIZADA';
      r!.version++;
      r!.actualizadoPor = Number(this.auth.id);
      r!.fechaFinalizacion = r!.fechaActualizacion = new Date();
      await manager.getRepository(InvimaRecepcionOrm).save(r!);
    });
    return this.detalle(id);
  }
}
