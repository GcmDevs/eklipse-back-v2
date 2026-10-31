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
import { In } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import {
  InvimaFacturaItemOrm,
  InvimaFacturaOrm,
  InvimaProductoOrm,
  InvimaVerificacionOrm,
  InvimaConfirmacionOrm,
  ObservacionInvimaOrm,
} from '@inn/orm/inn/invima';
import {
  advertenciasRenglon,
  cumCompleto,
  RenglonExtraido,
  RenglonFactura,
} from '../domain/factura.models';
import { MedicamentoInput } from '../domain/invima.models';
import { PdfExtractorService } from '../infrastructure/pdf-extractor.service';
import { PedidoExcelService } from '../infrastructure/pedido-excel.service';
import {
  GuardarFacturaDto,
  ListarFacturasDto,
  ObservacionFacturaDto,
} from '../presentation/factura.dto';
import { InvimaService } from './invima.service';

@Injectable()
export class FacturasInvimaService extends BaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private readonly pdf: PdfExtractorService,
    private readonly invima: InvimaService,
    private readonly excel: PedidoExcelService
  ) {
    super(request);
  }

  private async factura(id: number, manager = this.conn.manager, lock = false) {
    const factura = await manager.getRepository(InvimaFacturaOrm).findOne({
      where: { id },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!factura || factura.fechaEliminacion)
      throw new NotFoundException('Factura no encontrada en este contexto.');
    return factura;
  }
  private observacion(row: ObservacionInvimaOrm) {
    return {
      texto: row.observacion || '',
      version: row.observacionVersion || 0,
      usuarioNombre: row.observacionUsuarioNombre || null,
      fecha: row.observacionFecha || null,
    };
  }
  async guardarObservacion(id: number, input: ObservacionFacturaDto) {
    return this.conn.transaction(async manager => {
      const factura = await this.factura(id, manager, true);
      if (factura.estado !== 'REVISADA')
        throw new BadRequestException('Guarde la revisión antes de escribir observaciones.');
      const row = input.renglonId
        ? await manager
            .getRepository(InvimaFacturaItemOrm)
            .findOneBy({ id: input.renglonId, facturaId: id })
        : factura;
      if (!row || ('excluido' in row && (row.excluido || !row.productoId)))
        throw new NotFoundException('Producto no incluido en esta factura.');
      const actual = this.observacion(row);
      // A lost HTTP response can be retried without creating a false conflict.
      if (actual.texto === input.texto) return actual;
      if (actual.version !== input.version)
        throw new ConflictException({
          message: 'Otra persona cambió esta observación. Elija el texto que desea conservar.',
          actual,
        });
      row.observacion = input.texto;
      row.observacionVersion = actual.version + 1;
      row.observacionFecha = new Date();
      row.observacionUsuarioId = Number(this.auth.id);
      const user = this.auth.user as any;
      row.observacionUsuarioNombre = String(
        user.fullName || user.nombreCompleto || user.name || this.auth.id
      ).slice(0, 240);
      if (input.renglonId) await manager.getRepository(InvimaFacturaItemOrm).save(row);
      else await manager.getRepository(InvimaFacturaOrm).save(row);
      return this.observacion(row);
    });
  }
  async informe(id: number) {
    // Parent lock makes notes, products and current verification one consistent snapshot.
    return this.conn.transaction(async manager => {
      const factura = await this.factura(id, manager, true);
      if (factura.estado !== 'REVISADA')
        throw new BadRequestException('Guarde la revisión antes de generar el PDF.');
      const rows = await manager
        .getRepository(InvimaFacturaItemOrm)
        .find({ where: { facturaId: id, excluido: false }, order: { orden: 'ASC' } });
      const ids = rows.flatMap(r => (r.productoId ? [r.productoId] : []));
      const productos = ids.length
        ? await manager.getRepository(InvimaProductoOrm).find({ where: { id: In(ids) } })
        : [];
      const verificationIds = productos.flatMap(p =>
        p.ultimaVerificacionId ? [p.ultimaVerificacionId] : []
      );
      const verificaciones = verificationIds.length
        ? await manager
            .getRepository(InvimaVerificacionOrm)
            .find({ where: { id: In(verificationIds) } })
        : [];
      const confirmaciones = verificationIds.length
        ? await manager
            .getRepository(InvimaConfirmacionOrm)
            .find({ where: { verificacionId: In(verificationIds) } })
        : [];
      return {
        numero: factura.numero,
        tipoDocumento: factura.tipoDocumento || 'FACTURA',
        cliente: factura.cliente || '',
        proveedor: factura.proveedor,
        nitProveedor: factura.nitProveedor,
        fecha: factura.fecha,
        observacion: this.observacion(factura),
        generadoEn: new Date(),
        productos: rows.map(row => {
          const p = productos.find(p => p.id === row.productoId);
          const v =
            p &&
            verificaciones.find(
              v =>
                v.id === p.ultimaVerificacionId &&
                v.productoId === p.id &&
                v.versionProducto === p.version
            );
          const c = v && confirmaciones.find(c => c.verificacionId === v.id);
          const evidencia = v ? JSON.parse(v.evidencia) : null;
          return {
            orden: row.orden,
            datos: JSON.parse(row.datos),
            observacion: this.observacion(row),
            resultado: c ? 'CONFIRMADA' : v?.resultado || 'PENDIENTE',
            candidato: c
              ? JSON.parse(c.candidato)
              : v?.resultado === 'EXACTA'
                ? evidencia?.seleccionado
                : null,
            verificacion: v
              ? {
                  fecha: v.fecha,
                  usuarioNombre: v.usuarioNombre,
                  confirmadoPor: c?.usuarioNombre,
                  confirmadoEn: c?.fecha,
                  fuentes: evidencia?.consultas?.map(q => ({
                    nombre: q.fuente.nombre,
                    dataset: q.fuente.dataset,
                    error: q.error,
                  })),
                  advertencias: evidencia?.advertencias,
                }
              : null,
          };
        }),
      };
    });
  }
  async subir(file: Express.Multer.File, pedido = false) {
    if (!file?.buffer)
      throw new BadRequestException(
        pedido ? 'Seleccione un Excel Disfarma.' : 'Seleccione una factura PDF.'
      );
    if (pedido && !/\.xlsx$/i.test(file.originalname || ''))
      throw new BadRequestException('El documento Disfarma debe ser un archivo .xlsx.');
    const archivoHash = createHash('sha256').update(file.buffer).digest('hex');
    const duplicate = await this.conn.getRepository(InvimaFacturaOrm).findOneBy({ archivoHash });
    if (duplicate)
      throw new ConflictException({
        message: 'Este archivo ya fue cargado. Abra el documento existente.',
        facturaId: duplicate.id,
      });
    const parsed = await (pedido ? this.excel.extraer(file.buffer) : this.pdf.extraer(file.buffer));
    try {
      const id = await this.conn.transaction(async manager => {
        const now = new Date();
        const factura = await manager.getRepository(InvimaFacturaOrm).save({
          numero: parsed.numero,
          tipoDocumento: parsed.tipoDocumento || 'FACTURA',
          cliente: parsed.cliente || '',
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
          fechaEliminacion: null,
          eliminadoPor: null,
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
        throw new ConflictException('Este archivo ya fue cargado. Actualice el listado.');
      throw error;
    }
  }
  private datos(r: RenglonFactura): RenglonFactura {
    return {
      tipo: r.tipo,
      descripcion: r.descripcion.trim(),
      codigoDeclarado: r.codigoDeclarado.trim(),
      registroSanitario: r.registroSanitario.trim(),
      ...(r.unidadMedida != null ? { unidadMedida: r.unidadMedida.trim() } : {}),
      ...(r.lotesDeclarados !== undefined
        ? { lotesDeclarados: [...new Set(r.lotesDeclarados.map(l => l.trim()).filter(Boolean))] }
        : {}),
      ...(r.cantidad !== undefined ? { cantidad: r.cantidad } : {}),
      ...(r.cantidadPresentacion !== undefined
        ? { cantidadPresentacion: r.cantidadPresentacion }
        : {}),
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
      tipoDocumento: factura.tipoDocumento || 'FACTURA',
      cliente: factura.cliente || '',
      observacion: this.observacion(factura),
      advertencias: JSON.parse(factura.advertencias),
      renglones: rows.map(r => {
        const datos = JSON.parse(r.datos) as RenglonFactura;
        const original = JSON.parse(r.original) as RenglonExtraido;
        const originalesDinamicas = advertenciasRenglon(original);
        return {
          id: r.id,
          orden: r.orden,
          excluido: r.excluido,
          observacion: this.observacion(r),
          ...datos,
          original,
          advertencias: [
            ...new Set([
              ...advertenciasRenglon(datos),
              ...(original.advertencias || []).filter(a => !originalesDinamicas.includes(a)),
            ]),
          ],
          producto: productos.get(r.productoId) || null,
        };
      }),
    };
  }
  async listar(input: ListarFacturasDto) {
    const query = this.conn.getRepository(InvimaFacturaOrm).createQueryBuilder('f');
    if (input.q)
      query.where(
        '(f.numero LIKE :q OR f.proveedor LIKE :q OR f.cliente LIKE :q OR f.nitProveedor LIKE :q)',
        {
          q: `%${input.q}%`,
        }
      );
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
          tipoDocumento: f.tipoDocumento || 'FACTURA',
          cliente: f.cliente || '',
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
      if (factura.version !== version)
        throw new ConflictException('La factura cambió. Actualice el listado antes de eliminar.');
      factura.fechaEliminacion = new Date();
      factura.eliminadoPor = Number(this.auth.id);
      factura.fechaActualizacion = factura.fechaEliminacion;
      factura.actualizadoPor = Number(this.auth.id);
      factura.version++;
      await manager.getRepository(InvimaFacturaOrm).save(factura);
    });
  }
  async guardar(id: number, input: GuardarFacturaDto) {
    await this.conn.transaction(async manager => {
      const factura = await this.factura(id, manager, true);
      if (factura.version !== input.version)
        throw new ConflictException('La factura cambió. Recargue antes de guardar.');
      if (factura.estado === 'REVISADA')
        throw new ConflictException(
          'La revisión general está bloqueada. Use la edición individual para corregir productos; cantidades y lotes conservan los datos validados.'
        );
      if (
        input.renglones.some(
          r => !r.excluido && (r.cantidad == null || !Number.isFinite(r.cantidad) || r.cantidad < 0)
        )
      )
        throw new BadRequestException(
          'Complete la cantidad facturada de cada producto incluido antes de validar la revisión.'
        );
      if (factura.tipoDocumento === 'PEDIDO' ? !input.cliente?.trim() : !input.proveedor.trim())
        throw new BadRequestException(
          factura.tipoDocumento === 'PEDIDO'
            ? 'Complete el cliente del pedido.'
            : 'Complete el proveedor de la factura.'
        );
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
        const anteriores = JSON.parse(item.datos || '{}') as RenglonFactura;
        // Clientes antiguos omiten las cantidades: no borrar las que ya se importaron.
        for (const key of [
          'cantidad',
          'cantidadPresentacion',
          'unidadMedida',
          'lotesDeclarados',
        ] as const)
          if (incoming[key] === undefined && anteriores[key] !== undefined)
            Object.assign(datos, { [key]: anteriores[key] });
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
            if (
              ['tipo', 'descripcion', 'codigoDeclarado', 'registroSanitario'].some(
                k => storedRow[k] !== datos[k]
              )
            )
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
      factura.cliente = factura.tipoDocumento === 'PEDIDO' ? input.cliente.trim() : '';
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
