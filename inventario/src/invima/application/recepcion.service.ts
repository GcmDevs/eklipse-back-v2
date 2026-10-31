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
} from '../domain/recepcion.models';
import { cumCompleto, RenglonFactura } from '../domain/factura.models';
import { MedicamentoInput } from '../domain/invima.models';
import { GuardarRecepcionItemDto } from '../presentation/recepcion.dto';
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
    const f = await manager
      .getRepository(InvimaFacturaOrm)
      .findOne({
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
    return manager
      .getRepository(InvimaRecepcionOrm)
      .findOne({
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
      const r = await manager
        .getRepository(InvimaRecepcionOrm)
        .save({
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
        await manager
          .getRepository(InvimaRecepcionItemOrm)
          .save({
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
        const fisico = JSON.parse(i.fisico) as FisicoRecepcion;
        return {
          ...i,
          facturado,
          fisico,
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
  private datosProducto(f: FisicoRecepcion): MedicamentoInput {
    return {
      tipo: f.tipo,
      codigoDeclarado: f.codigoDeclarado.trim(),
      nombre: f.descripcion.trim() || 'Producto físico pendiente de identificar',
      cum:
        f.tipo === 'MEDICAMENTO' && cumCompleto(f.codigoDeclarado) ? f.codigoDeclarado.trim() : '',
      registroSanitario: f.tipo === 'VITAL_NO_DISPONIBLE' ? '' : f.registroSanitario.trim(),
      laboratorio: f.laboratorio.trim(),
      concentracion: f.concentracion.trim(),
      formaFarmaceutica: f.formaFarmaceutica.trim(),
      presentacion: f.presentacion.trim(),
    };
  }
  private async oficial(item: InvimaRecepcionItemOrm, manager: EntityManager) {
    if (!item.productoId) return 'PENDIENTE';
    const p = await manager.getRepository(InvimaProductoOrm).findOneBy({ id: item.productoId });
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
      const f = input.fisico;
      const datos = this.datosProducto(f);
      const previo = JSON.parse(i.fisico) as FisicoRecepcion;
      // Editing quantities or packaging does not invalidate the independent official evidence.
      if (!i.productoId) i.productoId = (await this.invima.crear(datos, manager)).id;
      else if (JSON.stringify(this.datosProducto(previo)) !== JSON.stringify(datos)) {
        const p = await manager
          .getRepository(InvimaProductoOrm)
          .findOneByOrFail({ id: i.productoId });
        await this.invima.editar(p.id, { ...datos, version: p.version }, manager);
      }
      try {
        validarDecision(
          JSON.parse(i.facturado),
          f,
          input.decision,
          input.justificacion,
          await this.oficial(i, manager)
        );
      } catch (e) {
        throw new BadRequestException(e.message);
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
  async finalizar(id: number, version: number) {
    await this.conn.transaction(async manager => {
      await this.factura(id, manager, true);
      const r = await this.recepcion(id, manager, true);
      this.abierta(r, version);
      const items = await manager
        .getRepository(InvimaRecepcionItemOrm)
        .find({ where: { recepcionId: r!.id } });
      if (!items.length || items.some(i => i.decision === 'PENDIENTE'))
        throw new BadRequestException(
          'Guarde una decisión para todos los productos antes de finalizar.'
        );
      for (const i of items) {
        try {
          validarDecision(
            JSON.parse(i.facturado),
            JSON.parse(i.fisico),
            i.decision as DecisionRecepcion,
            i.justificacion,
            await this.oficial(i, manager)
          );
        } catch (e) {
          throw new BadRequestException(`Producto ${i.facturaItemId}: ${e.message}`);
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
