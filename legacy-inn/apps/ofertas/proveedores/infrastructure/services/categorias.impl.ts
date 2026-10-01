import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { GCM_CONTEXTS } from '@common/domain/types';
import { EkinnoferCategoriaOrm } from '@orm/inn/ofertas/categoria.orm';
import { CategoriaMapper } from '../../mapper/categoria.mapper';
import { GuardarOfertasDto } from '../../presentation/dtos/guardar-ofertas.dto';
import { EkinnoferOfertaOrm } from '@orm/inn/ofertas/ofertas.orm';
import { In } from 'typeorm';
import { EkinnoferProductoOrm, EkinnoferProveedorOrm } from '@orm/inn/ofertas';
import { EkinnoferOfertaDocOrm } from '@orm/inn/ofertas/oferta-doc.orm';
// import { existsSync, unlinkSync } from 'fs';
import { copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { OFERTAS_DOCS_ROOT } from '../../domain/config/file-paths.config';

@Injectable()
export class CategoriasImpl extends BaseSource {
  // ============================
  // Helpers privados
  // ============================

  private toDecimalStr(n: number | null | undefined): string | null {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return null;
    return Number(n).toFixed(2);
  }

  private toDateOnly(ymd: string | null | undefined): Date | null {
    if (!ymd) return null;
    const s = String(ymd).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    return new Date(`${s}T00:00:00.000Z`);
  }

  private normalizeRegulado(v: any): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s) return null;

    const low = s.toLowerCase();
    if (['si', 'sí', 's', '1', 'true'].includes(low)) return 'SI';
    if (['no', 'n', '0', 'false'].includes(low)) return 'NO';

    return s;
  }

  public async categorias() {
    const ctx = GCM_CONTEXTS.AMMEDICAL;
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const proveedorOid = this.auth.id;

      if (!proveedorOid) {
        throw new BadRequestException('Proveedor no autenticado');
      }

      const proveedorRp = qr.manager.getRepository(EkinnoferProveedorOrm);
      const categoriaRp = qr.manager.getRepository(EkinnoferCategoriaOrm);

      // 1️⃣ Obtener el proveedor logueado (para sacar el TERNUMDOC)
      const proveedorBase = await proveedorRp.findOne({
        where: { id: proveedorOid, estado: 1 },
      });

      if (!proveedorBase?.terNumDoc) {
        throw new NotFoundException('Proveedor sin documento');
      }

      const terNumDoc = proveedorBase.terNumDoc;

      // 2️⃣ Traer TODAS las relaciones proveedor-categoría por TERNUMDOC
      const proveedores = await proveedorRp.find({
        where: {
          terNumDoc,
          estado: 1,
        },
        select: ['id', 'categoriaId', 'terNumDoc'],
      });

      const categoriaIds = [
        ...new Set(proveedores.map(p => p.categoriaId).filter((id): id is number => !!id)),
      ];

      if (!categoriaIds.length) {
        throw new NotFoundException(`Proveedor ${terNumDoc} no tiene categorías asociadas`);
      }

      // 3️⃣ Refactorización: Queries separadas para evitar cartesian products
      const proveedorIds = proveedores.map(p => p.id);

      // const categorias = await categoriaRp
      //   .createQueryBuilder('c')
      //   .leftJoinAndSelect('c.proveedores', 'p', 'p.estado = 1 AND p.terNumDoc = :terNumDoc', {
      //     terNumDoc,
      //   })
      //   .leftJoinAndSelect('c.productos', 'prod', 'prod.estado = 1')
      //   .leftJoinAndSelect(
      //     'c.ofertas',
      //     'o',
      //     'o.estado = 1 AND o.proveedorId IN (:...proveedorIds)',
      //     { proveedorIds: proveedores.map(p => p.id) }
      //   )
      //   .leftJoinAndSelect('o.producto', 'oprod')
      //   .leftJoinAndSelect('o.proveedor', 'oprov')
      //   .leftJoinAndSelect(
      //     'o.documentos',
      //     'doc',
      //     'doc.estado = 1 AND doc.proveedorId IN (:...proveedorIds)',
      //     { proveedorIds: proveedores.map(p => p.id) }
      //   )
      //   .where('c.estado = 1')
      //   .andWhere('c.id IN (:...categoriaIds)', { categoriaIds })
      //   .getMany();

      // Query 1: Categorías + Productos (sin ofertas/documentos primero)
      const categorias = await categoriaRp
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.productos', 'prod', 'prod.estado = 1')
        .where('c.estado = 1')
        .andWhere('c.id IN (:...categoriaIds)', { categoriaIds })
        .getMany();

      // Query 2: Ofertas con sus relaciones (separado para evitar duplicación)
      const ofertaRp = qr.manager.getRepository(EkinnoferOfertaOrm);
      const ofertas = await ofertaRp
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.producto', 'oprod')
        .leftJoinAndSelect('o.proveedor', 'oprov')
        .leftJoinAndSelect(
          'o.documentos',
          'doc',
          'doc.estado = 1 AND doc.proveedorId = :proveedorOid',
          { proveedorOid }
        )
        .where('o.estado = 1')
        .andWhere('o.EKINNOFERCATEGORIA IN (:...categoriaIds)', { categoriaIds })
        .andWhere('o.EKINNOFERPROVEEDOR IN (:...proveedorIds)', { proveedorIds })
        .getMany();

      // Query 3: Proveedores de categorías (solo del terNumDoc actual)
      const proveedoresCategoria = await proveedorRp
        .createQueryBuilder('p')
        .where('p.estado = 1')
        .andWhere('p.terNumDoc = :terNumDoc', { terNumDoc })
        .andWhere('p.categoriaId IN (:...categoriaIds)', { categoriaIds })
        .getMany();

      // Mapear ofertas a categorías para mejor performance
      const ofertasByCategory = new Map<number, any[]>();
      ofertas.forEach(o => {
        const catId = o.categoriaId || o.producto?.categoriaId;
        if (!ofertasByCategory.has(catId)) {
          ofertasByCategory.set(catId, []);
        }
        ofertasByCategory.get(catId)?.push(o);
      });

      // Asignar ofertas, proveedores a categorías
      categorias.forEach(c => {
        c.ofertas = ofertasByCategory.get(c.id) || [];
        c.proveedores = proveedoresCategoria.filter(p => p.categoriaId === c.id);
      });

      return CategoriaMapper.toCategoria(categorias);
    } catch (error: any) {
      Logger.error('Error fetching categoriasImpl:', error);
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async guardarOfertas(dto: GuardarOfertasDto) {
    const ctx = GCM_CONTEXTS.AMMEDICAL;
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      const ofertaRp = qr.manager.getRepository(EkinnoferOfertaOrm);
      const productoRp = qr.manager.getRepository(EkinnoferProductoOrm);
      const proveedorRp = qr.manager.getRepository(EkinnoferProveedorOrm);

      const { categoriaId, proveedorId, ofertas } = dto;

      if (!ofertas?.length) {
        throw new BadRequestException('No hay ofertas para guardar.');
      }

      const proveedor = await proveedorRp.findOne({
        where: { id: proveedorId, estado: 1 },
      });
      if (!proveedor) {
        throw new NotFoundException(`Proveedor ${proveedorId} no existe o está inactivo.`);
      }

      const productoIds = [...new Set(ofertas.map(o => o.productoId))];

      const productos = await productoRp.find({
        where: { id: In(productoIds) },
      });

      if (productos.length !== productoIds.length) {
        const found = new Set(productos.map(p => p.id));
        const missing = productoIds.filter(id => !found.has(id));
        throw new BadRequestException(`Productos no encontrados: ${missing.join(', ')}`);
      }

      const now = new Date();
      const anio = this.getYearUTC(now); // ✅ el año viene de FECHA_OFERTA (now)

      // ✅ Traer existentes para ese AÑO (por categoría + proveedor + productos)
      // Nota: SQL Server => YEAR(FECHA_OFERTA)
      const existentes = await ofertaRp
        .createQueryBuilder('o')
        .where('o.EKINNOFERCATEGORIA = :categoriaId', { categoriaId })
        .andWhere('o.EKINNOFERPROVEEDOR = :proveedorId', { proveedorId })
        .andWhere('o.EKINNOFERPRODUCTO IN (:...productoIds)', { productoIds })
        .andWhere('o.FECHA_OFERTA IS NOT NULL')
        .andWhere('YEAR(o.FECHA_OFERTA) = :anio', { anio })
        .getMany();

      const mapExistentes = new Map<number, EkinnoferOfertaOrm>();
      for (const e of existentes) {
        if (e.productoId) mapExistentes.set(e.productoId, e);
      }

      const toSave: EkinnoferOfertaOrm[] = [];

      for (const o of ofertas) {
        let entity = mapExistentes.get(o.productoId) ?? null;

        if (!entity) {
          entity = ofertaRp.create();
          entity.categoriaId = categoriaId;
          entity.proveedorId = proveedorId;
          entity.productoId = o.productoId;

          entity.estado = 1;
          entity.fechaOferta = now; // ✅ define el año
        } else {
          // ✅ si es el mismo año, se edita el existente
          // Si quieres mantener la fechaOferta ORIGINAL del año, comenta la siguiente línea:
          entity.fechaOferta = now;
        }

        entity.principio = o.principio?.trim() ?? null;
        entity.concentracion = o.concentracion?.trim() ?? null;
        entity.marca = o.marca?.trim() ?? null;
        entity.expediente = o.expediente?.trim() ?? null;
        entity.concecutivo = o.concecutivo?.trim() ?? null;
        entity.registroSanitario = o.registroSanitario?.trim() ?? null;

        const fv = this.toDateOnly(o.fechaVencimientoRegistro);
        if (!fv) {
          throw new BadRequestException(
            `fechaVencimientoRegistro inválida: ${o.fechaVencimientoRegistro}`
          );
        }
        entity.fechaVencimientoRegistro = fv;

        entity.estadoRegistro = o.estadoRegistro?.trim() ?? null;
        entity.clasificacionRiesgo = o.clasificacionRiesgo?.trim() ?? null;

        entity.precioUnitario = this.toDecimalStr(o.precioUnitario);
        entity.iva = this.toDecimalStr(o.iva);
        entity.presentacion = o.presentacion?.trim() ?? null;
        entity.precioPresentacion = this.toDecimalStr(o.precioPresentacion);

        entity.regulado = this.normalizeRegulado(o.regulado);

        toSave.push(entity);
      }

      const saved = await ofertaRp.save(toSave);

      await qr.commitTransaction();

      return {
        success: true,
        anio,
        count: saved.length,
        ofertas: saved.map(o => ({
          ofertaId: o.id,
          estado: o.estado,
          fechaOferta: o.fechaOferta ? o.fechaOferta.toISOString() : null,
          categoriaId: o.categoriaId,
          productoId: o.productoId,
          proveedorId: o.proveedorId,
          // ...
        })),
      };
    } catch (error: any) {
      await qr.rollbackTransaction();
      Logger.error('Error guardando ofertas:', error);

      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error?.message ?? 'Error guardando ofertas');
    } finally {
      await qr.release();
    }
  }

  public async guardarOfertasConDocs(input: {
    categoriaId: number;
    proveedorId: number;
    ofertas: any[];
    // files: Express.Multer.File[];
    files?: Express.Multer.File[];
  }) {
    const ctx = GCM_CONTEXTS.AMMEDICAL;
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    const anio = new Date().getUTCFullYear();
    // const basePath = `../${FILE_LOCATIONS.inn.ofer.docs}/${anio}/${input.proveedorId}`;
    const basePath = join(OFERTAS_DOCS_ROOT, anio.toString(), input.proveedorId.toString());

    try {
      await qr.startTransaction();

      // 1️⃣ Guardar ofertas
      const saved = await this.guardarOfertas({
        categoriaId: input.categoriaId,
        proveedorId: input.proveedorId,
        ofertas: input.ofertas,
      });

      // 🔐 VALIDACIÓN CRÍTICA
      const ofertaId = saved.ofertas[0].ofertaId;

      if (!ofertaId) {
        throw new BadRequestException('No se pudo determinar el OID de la oferta');
      }

      const docRp = qr.manager.getRepository(EkinnoferOfertaDocOrm);
      const now = new Date();

      // console.log('BACKEND_ROOT:', BACKEND_ROOT);
      // console.log('OFERTAS_DOCS_ROOT:', OFERTAS_DOCS_ROOT);

      // for (const file of input.files) {
      for (const file of input.files ?? []) {
        console.log('hay-');
        const docId = file.fieldname;

        const existente = await docRp.findOne({
          where: {
            ofertaId,
            proveedorId: input.proveedorId,
            docId,
            estado: 1,
          },
          order: { fechaCarga: 'DESC' },
        });

        const ext = file.originalname.split('.').pop();
        const finalPath = join(basePath, `${docId}.${ext}`);

        if (existente) {
          // 🔥 borrar archivo anterior
          // this.deleteFileSafe(existente.ruta);
          // 🔥 solo borra si cambia la ruta
          if (existente.ruta && existente.ruta !== finalPath) {
            this.deleteFileSafe(existente.ruta);
          }

          // mover archivo
          this.moveFile(file.path, finalPath);

          // ✅ UPDATE (NO create)
          existente.categoriaId = input.categoriaId;
          existente.nombreArchivo = `${docId}.${ext}`;
          existente.mimeType = file.mimetype;
          existente.tamanioBytes = file.size;
          existente.ruta = finalPath;
          existente.fechaCarga = now;

          await docRp.save(existente);
        } else {
          // mover archivo
          this.moveFile(file.path, finalPath);

          // 🆕 CREATE solo si no existe
          const nuevo = docRp.create({
            ofertaId, // ✅ YA NO NULL
            estado: 1,
            categoriaId: input.categoriaId,
            proveedorId: input.proveedorId,
            docId,
            nombreArchivo: `${docId}.${ext}`,
            mimeType: file.mimetype,
            tamanioBytes: file.size,
            ruta: finalPath,
            fechaCarga: now,
          });

          await docRp.save(nuevo);
        }
      }

      await qr.commitTransaction();

      return {
        ...saved,
        anio,
        proveedorId: input.proveedorId,
      };
    } catch (error) {
      await qr.rollbackTransaction();

      // 🔥 borrar temporales
      for (const f of input.files ?? []) {
        this.deleteFileSafe(f.path);
      }

      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  private getYearUTC(d: Date): number {
    return d.getUTCFullYear();
  }

  private ensureDir(path: string) {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }

  private moveFile(from: string, to: string) {
    const dir = dirname(to);
    this.ensureDir(dir);

    copyFileSync(from, to); // ✅ copia seguro
    unlinkSync(from); // ✅ elimina tmp
  }

  private deleteFileSafe(path?: string | null) {
    try {
      if (path && existsSync(path)) unlinkSync(path);
    } catch (e) {
      Logger.warn(`No se pudo eliminar archivo: ${path}`);
    }
  }

  async processDocs(files: Express.Multer.File[]) {
    const proveedorId = 15;
    const anio = new Date().getFullYear();

    const basePath = join(OFERTAS_DOCS_ROOT, anio.toString(), proveedorId.toString());

    this.ensureDir(basePath);

    try {
      for (const file of files) {
        const ext = file.originalname.split('.').pop();
        const finalPath = join(basePath, `${file.fieldname}.${ext}`);

        this.ensureDir(dirname(finalPath));
        renameSync(file.path, finalPath);
      }

      return { ok: true };
    } catch (error) {
      // rollback si algo falla
      for (const file of files) {
        try {
          unlinkSync(file.path);
        } catch {}
      }
      throw error;
    }
  }
}
