import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { BaseSource } from '@common/infrastructure/services';
import { InvimaFacturaItemOrm, InvimaFacturaOrm, InvimaProductoOrm } from '@inn/orm/inn/invima';
import {
  advertenciasRenglon,
  cumCompleto,
  RenglonExtraido,
  RenglonFactura,
} from '../domain/factura.models';
import { MedicamentoInput } from '../domain/invima.models';
import { PdfExtractorService } from '../infrastructure/pdf-extractor.service';
import { GuardarFacturaDto, ListarFacturasDto } from '../presentation/factura.dto';
import { InvimaService } from './invima.service';

@Injectable()
export class FacturasInvimaService extends BaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private readonly pdf: PdfExtractorService,
    private readonly invima: InvimaService
  ) {
    super(request);
  }

  private async factura(id: number, manager = this.conn.manager, lock = false) {
    const factura = await manager.getRepository(InvimaFacturaOrm).findOne({
      where: { id },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!factura) throw new NotFoundException('Factura no encontrada en este contexto.');
    return factura;
  }
  async subir(file: Express.Multer.File) {
    if (!file?.buffer) throw new BadRequestException('Seleccione una factura PDF.');
    const archivoHash = createHash('sha256').update(file.buffer).digest('hex');
    const duplicate = await this.conn.getRepository(InvimaFacturaOrm).findOneBy({ archivoHash });
    if (duplicate)
      throw new ConflictException({
        message: 'Este PDF ya fue cargado. Abra la factura existente.',
        facturaId: duplicate.id,
      });
    const parsed = await this.pdf.extraer(file.buffer);
    try {
      const id = await this.conn.transaction(async manager => {
        const now = new Date();
        const factura = await manager.getRepository(InvimaFacturaOrm).save({
          numero: parsed.numero,
          proveedor: parsed.proveedor,
          nitProveedor: parsed.nitProveedor,
          fecha: parsed.fecha,
          formato: parsed.formato,
          extractorVersion: parsed.extractorVersion,
          archivoHash,
          archivoNombre: basename(file.originalname).slice(0, 260),
          paginas: parsed.paginas,
          advertencias: JSON.stringify(parsed.advertencias),
          estado: 'BORRADOR',
          version: 1,
          creadoPor: Number(this.auth.id),
          actualizadoPor: Number(this.auth.id),
          fechaCreacion: now,
          fechaActualizacion: now,
        });
        const rows = parsed.renglones.map((r, index) => ({
          facturaId: factura.id,
          orden: index + 1,
          productoId: null,
          excluido: false,
          original: JSON.stringify(r),
          datos: JSON.stringify(this.datos(r)),
        }));
        if (rows.length)
          await manager.getRepository(InvimaFacturaItemOrm).save(rows, { chunk: 100 });
        return factura.id;
      });
      return this.detalle(id);
    } catch (error) {
      if ([2601, 2627].includes(error?.driverError?.number))
        throw new ConflictException('Este PDF ya fue cargado. Actualice el listado.');
      throw error;
    }
  }
  private datos(r: RenglonFactura): RenglonFactura {
    return {
      tipo: r.tipo,
      descripcion: r.descripcion.trim(),
      codigoDeclarado: r.codigoDeclarado.trim(),
      registroSanitario: r.registroSanitario.trim(),
    };
  }
  private entrada(r: RenglonFactura): MedicamentoInput {
    return {
      tipo: r.tipo,
      nombre: r.descripcion,
      cum: r.tipo === 'MEDICAMENTO' && cumCompleto(r.codigoDeclarado) ? r.codigoDeclarado : '',
      registroSanitario: r.registroSanitario,
      laboratorio: '',
      concentracion: '',
      formaFarmaceutica: '',
      presentacion: '',
    };
  }
  async detalle(id: number) {
    const factura = await this.factura(id);
    const rows = await this.conn
      .getRepository(InvimaFacturaItemOrm)
      .find({ where: { facturaId: id }, order: { orden: 'ASC' } });
    const productos = new Map(
      (await this.invima.listar(rows.flatMap(r => (r.productoId ? [r.productoId] : [])))).map(p => [
        p.id,
        p,
      ])
    );
    return {
      ...factura,
      advertencias: JSON.parse(factura.advertencias),
      renglones: rows.map(r => {
        const datos = JSON.parse(r.datos) as RenglonFactura;
        return {
          id: r.id,
          orden: r.orden,
          excluido: r.excluido,
          ...datos,
          original: JSON.parse(r.original) as RenglonExtraido,
          advertencias: advertenciasRenglon(datos),
          producto: productos.get(r.productoId) || null,
        };
      }),
    };
  }
  async listar(input: ListarFacturasDto) {
    const query = this.conn.getRepository(InvimaFacturaOrm).createQueryBuilder('f');
    if (input.q)
      query.where('(f.numero LIKE :q OR f.proveedor LIKE :q OR f.nitProveedor LIKE :q)', {
        q: `%${input.q}%`,
      });
    const estados = await query
      .clone()
      .select('f.estado', 'estado')
      .addSelect('COUNT(*)', 'total')
      .groupBy('f.estado')
      .getRawMany();
    const resumen = {
      total: estados.reduce((sum, row) => sum + Number(row.total), 0),
      borradores: Number(estados.find(row => row.estado === 'BORRADOR')?.total || 0),
      revisadas: Number(estados.find(row => row.estado === 'REVISADA')?.total || 0),
    };
    if (input.estado) query.andWhere('f.estado = :estado', { estado: input.estado });
    const [facturas, total] = await query
      .orderBy('f.id', 'DESC')
      .skip((input.pagina - 1) * input.limite)
      .take(input.limite)
      .getManyAndCount();
    if (!facturas.length)
      return { datos: [], total, resumen, pagina: input.pagina, limite: input.limite };
    const counts = this.conn
      .getRepository(InvimaFacturaItemOrm)
      .createQueryBuilder('i')
      .leftJoin('EKINNIVPRODUCTO', 'p', 'p.OID = i.PRODUCTOID')
      .leftJoin(
        'EKINNIVVERIFICACION',
        'v',
        'v.OID = p.ULTIMAVERIFICACION AND v.PRODUCTOID = p.OID AND v.VERSIONPRODUCTO = p.VERSION'
      )
      .leftJoin('EKINNIVCONFIRMACION', 'c', 'c.VERIFICACIONID = v.OID')
      .select('i.facturaId', 'facturaId')
      .addSelect('COUNT(*)', 'total')
      .where('i.facturaId IN (:...ids)', { ids: facturas.map(f => f.id) })
      .groupBy('i.facturaId');
    const result = `CASE WHEN c.OID IS NOT NULL THEN 'CONFIRMADA' ELSE COALESCE(v.RESULTADO, 'PENDIENTE') END`;
    const selected = `CASE WHEN c.OID IS NOT NULL THEN c.CANDIDATO WHEN v.RESULTADO = 'EXACTA' THEN JSON_QUERY(v.EVIDENCIA, '$.seleccionado') END`;
    counts.addSelect('SUM(CASE WHEN i.EXCLUIDO = 1 THEN 1 ELSE 0 END)', 'excluidos');
    for (const [key, value] of Object.entries({
      pendientes: 'PENDIENTE',
      exactas: 'EXACTA',
      confirmadas: 'CONFIRMADA',
      revision: 'REVISION',
      sinCoincidencias: 'SIN_COINCIDENCIAS',
      incompletas: 'INCOMPLETA',
    }))
      counts.addSelect(
        `SUM(CASE WHEN i.EXCLUIDO = 0 AND ${result} = '${value}' THEN 1 ELSE 0 END)`,
        key
      );
    for (const [key, value] of Object.entries({ activos: 'Activo', inactivos: 'Inactivo' }))
      counts.addSelect(
        `SUM(CASE WHEN i.EXCLUIDO = 0 AND COALESCE(JSON_VALUE(p.DATOS,'$.tipo'),'MEDICAMENTO') = 'MEDICAMENTO' AND JSON_VALUE(${selected},'$.estadoCum') = '${value}' THEN 1 ELSE 0 END)`,
        key
      );
    const byId = new Map((await counts.getRawMany()).map(r => [Number(r.facturaId), r]));
    return {
      datos: facturas.map(f => {
        const raw = byId.get(f.id) || {};
        const conteos = Object.fromEntries(
          [
            'total',
            'excluidos',
            'pendientes',
            'exactas',
            'confirmadas',
            'revision',
            'sinCoincidencias',
            'incompletas',
            'activos',
            'inactivos',
          ].map(k => [k, Number(raw[k] || 0)])
        );
        return {
          id: f.id,
          numero: f.numero,
          proveedor: f.proveedor,
          nitProveedor: f.nitProveedor,
          fecha: f.fecha,
          estado: f.estado,
          version: f.version,
          fechaCreacion: f.fechaCreacion,
          conteos,
        };
      }),
      total,
      resumen,
      pagina: input.pagina,
      limite: input.limite,
    };
  }
  async eliminar(id: number, version: number): Promise<void> {
    await this.conn.transaction(async manager => {
      const factura = await this.factura(id, manager, true);
      if (factura.estado !== 'BORRADOR')
        throw new ConflictException('Solo se pueden eliminar facturas en borrador.');
      if (factura.version !== version)
        throw new ConflictException('La factura cambió. Actualice el listado antes de eliminar.');
      const items = manager.getRepository(InvimaFacturaItemOrm);
      const renglones = await items.find({ where: { facturaId: id } });
      if (renglones.some(r => r.productoId !== null))
        throw new ConflictException('La factura tiene productos asociados y no se puede eliminar.');
      await items.delete({ facturaId: id });
      const deleted = await manager.getRepository(InvimaFacturaOrm).delete({
        id,
        version,
        estado: 'BORRADOR',
      });
      if (deleted.affected !== 1)
        throw new ConflictException('La factura cambió. Actualice el listado antes de eliminar.');
    });
  }
  async guardar(id: number, input: GuardarFacturaDto) {
    await this.conn.transaction(async manager => {
      const factura = await this.factura(id, manager, true);
      if (factura.version !== input.version)
        throw new ConflictException('La factura cambió. Recargue antes de guardar.');
      if (input.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(input.fecha))
        throw new BadRequestException('La fecha debe tener formato AAAA-MM-DD.');
      const repository = manager.getRepository(InvimaFacturaItemOrm);
      const actuales = await repository.find({ where: { facturaId: id }, order: { orden: 'ASC' } });
      const ids = input.renglones.flatMap(r => (r.id ? [r.id] : []));
      if (
        ids.length !== new Set(ids).size ||
        ids.some(i => !actuales.some(r => r.id === i)) ||
        actuales.some(r => !ids.includes(r.id))
      )
        throw new BadRequestException(
          'Renglones inválidos. Use “Excluir” para retirar un producto.'
        );
      let orden = Math.max(0, ...actuales.map(r => r.orden));
      for (const incoming of input.renglones) {
        if (!incoming.excluido && !incoming.descripcion.trim())
          throw new BadRequestException('Complete la descripción de los renglones incluidos.');
        const datos = this.datos(incoming);
        const item = incoming.id
          ? actuales.find(r => r.id === incoming.id)!
          : repository.create({
              facturaId: id,
              orden: ++orden,
              productoId: null,
              original: JSON.stringify({
                ...datos,
                paginas: [],
                fragmento: '',
                advertencias: ['Renglón agregado manualmente.'],
              }),
            });
        if (!incoming.excluido) {
          const entrada = this.entrada(datos);
          if (item.productoId) {
            const p = await manager
              .getRepository(InvimaProductoOrm)
              .findOne({ where: { id: item.productoId }, lock: { mode: 'pessimistic_write' } });
            if (!p || p.version !== incoming.productoVersion)
              throw new ConflictException('Un producto cambió. Recargue la factura.');
            const stored = JSON.parse(p.datos);
            const storedRow = JSON.parse(item.datos) as RenglonFactura;
            if (Object.entries(datos).some(([k, v]) => storedRow[k] !== v))
              await this.invima.editar(
                p.id,
                {
                  ...stored,
                  tipo: entrada.tipo,
                  nombre: entrada.nombre,
                  cum: entrada.cum,
                  registroSanitario: entrada.registroSanitario,
                  version: p.version,
                },
                manager
              );
          } else item.productoId = (await this.invima.crear(entrada, manager)).id;
        }
        item.datos = JSON.stringify(datos);
        item.excluido = incoming.excluido;
        await repository.save(item);
      }
      factura.numero = input.numero;
      factura.proveedor = input.proveedor;
      factura.nitProveedor = input.nitProveedor;
      factura.fecha = input.fecha || null;
      factura.version++;
      factura.estado = 'REVISADA';
      factura.actualizadoPor = Number(this.auth.id);
      factura.fechaActualizacion = new Date();
      await manager.getRepository(InvimaFacturaOrm).save(factura);
    });
    return this.detalle(id);
  }
}
