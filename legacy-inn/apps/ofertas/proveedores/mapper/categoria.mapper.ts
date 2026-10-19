import { EkinnoferCategoriaOrm } from '@orm/inn/ofertas';
import { CategoriaResponse } from '../interface';

export class CategoriaMapper {
  private static toIso(v: any): string | null {
    if (!v) return null;

    // Date real
    if (v instanceof Date && !isNaN(v.getTime())) {
      return v.toISOString();
    }

    // string/number -> intento parsear
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  /** Para columnas SQL tipo `date` (sin hora): devuelve YYYY-MM-DD */
  private static toYmd(v: any): string | null {
    const iso = this.toIso(v);
    return iso ? iso.slice(0, 10) : null;
  }

  static toCategoria(categorias: EkinnoferCategoriaOrm[]): CategoriaResponse[] {
    return categorias.map(c => ({
      categoriaId: c.id,
      nombre: c.nombre ?? null,
      estado: c.estado,

      productos: (c.productos ?? [])
        .filter(p => p.estado === 1)
        .map(p => ({
          productoId: p.id,
          codigo: p.codigo ?? null,
          nombre: p.nombre ?? null,
          estado: p.estado,
          cantidadTotal2025: p.cantidadTotal2025 ?? null,
        })),

      proveedores: (c.proveedores ?? [])
        .filter(p => p.estado === 1)
        .map(p => ({
          proveedorId: p.id,
          documento: p.terNumDoc ?? null,
          nombre: p.nombreTercero ?? null,
          estado: p.estado,
        })),

      ofertas: (c.ofertas ?? [])
        .filter(o => o.estado === 1)
        .map(o => ({
          ofertaId: o.id,
          estado: o.estado,

          // ✅ antes: o.fechaOferta.toISOString()
          fechaOferta: this.toIso(o.fechaOferta),

          categoriaId: o.categoriaId ?? null,
          productoId: o.productoId ?? null,
          proveedorId: o.proveedorId ?? null,

          productoCodigo: o.producto?.codigo ?? null,
          productoNombre: o.producto?.nombre ?? null,
          proveedorDocumento: o.proveedor?.terNumDoc ?? null,
          proveedorNombre: o.proveedor?.nombreTercero ?? null,

          principio: o.principio ?? null,
          concentracion: o.concentracion ?? null,
          marca: o.marca ?? null,
          expediente: o.expediente ?? null,
          concecutivo: o.concecutivo ?? null,
          registroSanitario: o.registroSanitario ?? null,

          // ✅ antes: o.fechaVencimientoRegistro.toISOString()
          // si quieres ISO completo usa toIso, si quieres date-only usa toYmd
          fechaVencimientoRegistro: this.toYmd(o.fechaVencimientoRegistro),

          estadoRegistro: o.estadoRegistro ?? null,
          clasificacionRiesgo: o.clasificacionRiesgo ?? null,

          precioUnitario: o.precioUnitario ?? null,
          iva: o.iva ?? null,
          presentacion: o.presentacion ?? null,
          precioPresentacion: o.precioPresentacion ?? null,
          regulado: o.regulado ?? null,

          // 🔥 NUEVO: DOCUMENTOS DE LA OFERTA
          documentos: (o.documentos ?? []).map(d => ({
            documentoId: d.id,
            proveedorId: d.proveedorId ?? null,
            docId: d.docId ?? null,
            nombreArchivo: d.nombreArchivo ?? null,
            mimeType: d.mimeType ?? null,
            tamanioBytes: d.tamanioBytes ?? null,
            ruta: d.ruta ?? null,
            fechaCarga: this.toIso(d.fechaCarga),
          })),
        })),
    }));
  }
}
