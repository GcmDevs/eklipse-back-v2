import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  ConteoInventarioOrm,
  EstanteInventarioOrm,
  DetalleConteoOrm,
  ProductoEstantesOrm,
} from '@orm/inn/inventario';
import {
  ConteoProductoDetalleDto,
  EstanteConteoAdminDto,
  ProductoConteoAdminDto,
} from '@farmacia/inventario/dto/inventarios.dto';
import { ESTADO_CONTEO, EstadoConteoCode } from '@ctypes/inn/inventario';
import {
  calcularExistenciaBaseConteo,
  construirListaEstantesVerificar,
  seleccionarConteoVigente,
} from '../../inventario.policies';
import { In } from 'typeorm';

interface ConteoSimple {
  numero: 1 | 2 | 3;
  cantidad: number | null;
}

interface ResultadoConsolidado {
  cantidadOficial: number | null;
  estadoGlobal: EstadoConteoCode;
  numeroConteoCoincidente: number | null;
  diferenciaUltimoConteo: number | null;
}

@Injectable()
export class ConsultaInventarioService extends BaseSource {
  public async obtenerResumenTodosEstantes(): Promise<EstanteConteoAdminDto[]> {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);
      const conteoRp = qr.manager.getRepository(ConteoInventarioOrm);

      const estantes = await estanteRp
        .createQueryBuilder('estante')
        .leftJoinAndSelect(
          'estante.productos',
          'pe',
          '(pe.isDeleted = :isDeleted OR pe.isDeleted IS NULL) AND pe.isActivoEstante = :isActivoEstante',
          {
            isDeleted: false,
            isActivoEstante: true,
          }
        )
        .leftJoinAndSelect('pe.producto', 'producto')
        .leftJoinAndSelect('producto.existencias', 'existencias')
        .leftJoinAndSelect('producto.fabricante', 'fabricante')
        .orderBy('estante.id', 'ASC')
        .addOrderBy('pe.id', 'ASC')
        .getMany();

      const productosEstante = estantes.flatMap(estante => estante.productos ?? []);
      const productosEstanteIds = productosEstante.map(producto => producto.id);
      const bloquesProductos = this.dividirEnBloques(productosEstanteIds);

      const conteosBase = (
        await Promise.all(
          bloquesProductos.map(ids =>
            conteoRp.find({
              where: { estanteProductoId: In(ids) },
              relations: ['ciclo'],
              order: { createdAt: 'DESC' },
            })
          )
        )
      ).flat();

      const conteosPorProducto = new Map<number, ConteoInventarioOrm[]>();
      for (const conteo of conteosBase) {
        const conteos = conteosPorProducto.get(conteo.estanteProductoId) ?? [];
        conteos.push(conteo);
        conteosPorProducto.set(conteo.estanteProductoId, conteos);
      }

      const conteoSeleccionadoPorProducto = new Map<number, number>();
      for (const producto of productosEstante) {
        const conteo = seleccionarConteoVigente(conteosPorProducto.get(producto.id) ?? []);
        if (conteo) conteoSeleccionadoPorProducto.set(producto.id, conteo.id);
      }

      const conteosSeleccionadosIds = [...new Set(conteoSeleccionadoPorProducto.values())];
      const bloquesConteos = this.dividirEnBloques(conteosSeleccionadosIds);
      const conteosSeleccionados = (
        await Promise.all(
          bloquesConteos.map(ids =>
            conteoRp.find({
              where: { id: In(ids) },
              relations: [
                'ciclo',
                'detalleConteo',
                'detalleConteo.usuario',
                'detalleConteo.usuario.usuario',
              ],
            })
          )
        )
      ).flat();
      const conteoPorId = new Map(conteosSeleccionados.map(conteo => [conteo.id, conteo]));

      for (const producto of productosEstante) {
        const conteoId = conteoSeleccionadoPorProducto.get(producto.id);
        const conteo = conteoId ? conteoPorId.get(conteoId) : null;
        producto.conteoInventario = conteo ? [conteo] : [];
      }

      return estantes.map(estante => ({
        estanteId: estante.id,
        nombreEstante: estante.nombreEstante,
        estadoEstante: estante.estado,
        productos: (estante.productos || []).map(pe => this.mapProductoResumen(pe)),
      }));
    } finally {
      await qr.release();
    }
  }

  private dividirEnBloques<T>(items: T[], tamano = 500): T[][] {
    const bloques: T[][] = [];
    for (let index = 0; index < items.length; index += tamano) {
      bloques.push(items.slice(index, index + tamano));
    }
    return bloques;
  }

  public async obtenerResumenPorEstanteProducto(estanteId: number): Promise<EstanteConteoAdminDto> {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

      const estante = await estanteRp
        .createQueryBuilder('estante')
        .leftJoinAndSelect(
          'estante.productos',
          'pe',
          '(pe.isDeleted = :isDeleted OR pe.isDeleted IS NULL) AND pe.isActivoEstante = :isActivoEstante',
          {
            isDeleted: false,
            isActivoEstante: true,
          }
        )
        .leftJoinAndSelect('pe.producto', 'producto')
        .leftJoinAndSelect('producto.existencias', 'existencias')
        .leftJoinAndSelect('producto.fabricante', 'fabricante')
        .leftJoinAndSelect('pe.conteoInventario', 'ci')
        .leftJoinAndSelect('ci.ciclo', 'ciclo')
        .leftJoinAndSelect('ci.detalleConteo', 'dc')
        .leftJoinAndSelect('dc.usuario', 'uc')
        .leftJoinAndSelect('uc.usuario', 'u')
        .where('estante.id = :estanteId', { estanteId })
        .orderBy('pe.id', 'ASC')
        .getOne();

      if (!estante) {
        throw new NotFoundException(`El estante ${estanteId} no existe`);
      }

      return {
        estanteId: estante.id,
        nombreEstante: estante.nombreEstante,
        estadoEstante: estante.estado,
        productos: (estante.productos || []).map(pe => this.mapProductoResumen(pe)),
      };
    } finally {
      await qr.release();
    }
  }

  public async listaConteoVerificar() {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const estanteRp = qr.manager.getRepository(EstanteInventarioOrm);

      const estantesConConteos = await estanteRp
        .createQueryBuilder('estante')
        .innerJoinAndSelect(
          'estante.productos',
          'pe',
          '(pe.isDeleted = :isDeleted OR pe.isDeleted IS NULL) AND pe.isActivoEstante = :isActivoEstante',
          { isDeleted: false, isActivoEstante: true }
        )
        .leftJoinAndSelect('pe.producto', 'producto')
        .leftJoinAndSelect('producto.existencias', 'existencias')
        .leftJoinAndSelect('producto.fabricante', 'fabricante')
        .innerJoinAndSelect('pe.conteoInventario', 'ci')
        .innerJoinAndSelect('ci.ciclo', 'ciclo', 'ciclo.estado = :cicloEstado', {
          cicloEstado: 'ABIERTO',
        })
        .leftJoinAndSelect('ci.detalleConteo', 'dc')
        .leftJoinAndSelect('dc.usuario', 'uc')
        .leftJoinAndSelect('uc.usuario', 'u')
        .orderBy('estante.nombreEstante', 'ASC')
        .addOrderBy('pe.id', 'ASC')
        .getMany();

      return construirListaEstantesVerificar(
        ESTADO_CONTEO.VERIFICAR.getCode(),
        estantesConConteos.map(estante => ({
          estanteId: estante.id,
          estanteNombre: estante.nombreEstante,
          productos: (estante.productos ?? []).map(producto => this.mapProductoResumen(producto)),
        }))
      );
    } finally {
      await qr.release();
    }
  }

  public async obtenerHistorialPorEstanteProducto(estanteProductoId: number) {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const query = qr.manager
        .createQueryBuilder(DetalleConteoOrm, 'dc')
        .leftJoinAndSelect('dc.conteoInventario', 'ci')
        .leftJoinAndSelect('dc.usuario', 'uc')
        .leftJoinAndSelect('uc.usuario', 'u')
        .where('ci.estanteProductoId = :estanteProductoId', { estanteProductoId })
        .orderBy('dc.numeroConteo', 'ASC');

      const detalles = await query.getMany();

      if (detalles.length === 0) {
        throw new NotFoundException(
          `No hay conteos registrados para el estanteProductoId ${estanteProductoId}`
        );
      }

      return detalles.map(d => ({
        numeroConteo: d.numeroConteo,
        cantidadContada: Number(d.cantidadContada),
        coincidenciaSistema: d.coincidenciaSistema,
        countedAt: d.countedAt,
        usuario: {
          id: d.usuario?.id ?? null,
          nombre: d.usuario?.usuario?.nombreCompleto ?? '',
        },
      }));
    } finally {
      await qr.release();
    }
  }

  private mapProductoResumen(pe: ProductoEstantesOrm): ProductoConteoAdminDto {
    const producto = pe.producto;
    const existenciaGlobal = (producto?.existencias ?? []).reduce(
      (acc: number, e) => acc + Number(e.cantidad),
      0
    );
    const existenciaBase = calcularExistenciaBaseConteo(pe.stock, existenciaGlobal);

    const cis = pe.conteoInventario || [];
    const ci = seleccionarConteoVigente(cis);

    if (!ci) {
      return {
        estanteProductoId: pe.id,
        productoId: producto?.id,
        codigoProducto: producto?.codigo ?? '',
        descripcionProducto: producto?.descripcion ?? '',
        fabricante: producto?.fabricante?.nombre ?? '',
        tipo: pe.tipo ?? '',
        cicloId: null,
        ubicacion: pe.ubicacion ?? '',
        existenciaSistema: existenciaBase,
        existenciaDinamica: existenciaGlobal,
        cantidadOficial: null,
        diferenciaUltimoConteo: null,
        isCerrado: false,
        totalConteoRealizado: 0,
        numeroConteoCoincidente: null,
        estadoGlobal: ESTADO_CONTEO.PENDIENTE.getCode(),
        conteo1: null,
        conteo2: null,
        conteo3: null,
        conteos: [],
      } as ProductoConteoAdminDto;
    }

    const detallesOrdenados = (ci.detalleConteo ?? []).sort(
      (a, b) => a.numeroConteo - b.numeroConteo
    );

    const conteosArray: ConteoProductoDetalleDto[] = [];
    let conteo1: ConteoProductoDetalleDto | undefined;
    let conteo2: ConteoProductoDetalleDto | undefined;
    let conteo3: ConteoProductoDetalleDto | undefined;

    const calcEstado = (diferencia: number): EstadoConteoCode => {
      if (diferencia === 0) return ESTADO_CONTEO.AJUSTADO.getCode();
      if (diferencia < 0) return ESTADO_CONTEO.FALTANTE.getCode();
      return ESTADO_CONTEO.SOBRANTE.getCode();
    };

    for (const d of detallesOrdenados) {
      const diferencia = Number(d.cantidadContada) - existenciaBase;
      const estadoAjuste = calcEstado(diferencia);

      const detalleDto: ConteoProductoDetalleDto = {
        idConteoDetalle: d.id,
        numeroConteo: d.numeroConteo,
        cantidadContada: Number(d.cantidadContada),
        coincidenciaSistema: diferencia === 0,
        diferencia,
        estadoAjuste,
        countedAt: d.countedAt,
        usuarioId: d.usuarioId,
        usuarioNombre: d.usuario?.usuario?.nombreCompleto ?? null,
      };

      conteosArray.push(detalleDto);

      if (d.numeroConteo === 1) conteo1 = detalleDto;
      if (d.numeroConteo === 2) conteo2 = detalleDto;
      if (d.numeroConteo === 3) conteo3 = detalleDto;
    }

    const conteosSimple: ConteoSimple[] = [
      { numero: 1, cantidad: conteo1 ? conteo1.cantidadContada : null },
      { numero: 2, cantidad: conteo2 ? conteo2.cantidadContada : null },
      { numero: 3, cantidad: conteo3 ? conteo3.cantidadContada : null },
    ];

    const resultado = this.calcularConsolidadoConteo(
      existenciaBase,
      conteosSimple,
      ci.cantidadOficial ?? null
    );

    return {
      estanteProductoId: pe.id,
      productoId: producto?.id,
      codigoProducto: producto?.codigo ?? '',
      descripcionProducto: producto?.descripcion ?? '',
      fabricante: producto?.fabricante?.nombre ?? '',
      tipo: pe.tipo ?? '',
      cicloId: ci.cicloId ?? 0,
      ubicacion: pe.ubicacion ?? '',
      existenciaSistema: existenciaBase,
      existenciaDinamica: existenciaGlobal,
      cantidadOficial: resultado.cantidadOficial ?? null,
      isCerrado: ci.isCerrado ?? null,
      totalConteoRealizado: ci.totalConteoRealizado ?? null,
      numeroConteoCoincidente: resultado.numeroConteoCoincidente ?? null,
      estadoGlobal: resultado.estadoGlobal ?? null,
      diferenciaUltimoConteo: resultado.diferenciaUltimoConteo ?? null,
      conteo1: conteo1 ?? null,
      conteo2: conteo2 ?? null,
      conteo3: conteo3 ?? null,
      conteos: conteosArray,
    } as ProductoConteoAdminDto;
  }

  private calcularConsolidadoConteo(
    existenciaSistema: number,
    conteos: ConteoSimple[],
    conteoOficialAdmin?: number | null
  ): ResultadoConsolidado {
    const EST_PENDIENTE = ESTADO_CONTEO.PENDIENTE.getCode();
    const EST_VERIFICAR = ESTADO_CONTEO.VERIFICAR.getCode();
    const EST_AJUSTADO = ESTADO_CONTEO.AJUSTADO.getCode();
    const EST_FALTANTE = ESTADO_CONTEO.FALTANTE.getCode();
    const EST_SOBRANTE = ESTADO_CONTEO.SOBRANTE.getCode();

    const estadoPorDiff = (diff: number): EstadoConteoCode => {
      if (diff === 0) return EST_AJUSTADO;
      if (diff > 0) return EST_SOBRANTE;
      return EST_FALTANTE;
    };

    const llenos = conteos.filter(c => c.cantidad != null).sort((a, b) => a.numero - b.numero);
    const ultimoConteo = llenos.length > 0 ? llenos[llenos.length - 1] : null;
    const diffUltimoConteo =
      ultimoConteo && ultimoConteo.cantidad != null
        ? ultimoConteo.cantidad - existenciaSistema
        : null;

    if (conteoOficialAdmin != null) {
      const cantidadOficial = conteoOficialAdmin;
      const diff = cantidadOficial - existenciaSistema;

      return {
        cantidadOficial,
        estadoGlobal: estadoPorDiff(diff),
        numeroConteoCoincidente: 0,
        diferenciaUltimoConteo: diff,
      };
    }

    const c1 = conteos.find(c => c.numero === 1)?.cantidad ?? null;
    const c2 = conteos.find(c => c.numero === 2)?.cantidad ?? null;
    const c3 = conteos.find(c => c.numero === 3)?.cantidad ?? null;

    if (llenos.length === 0) {
      return {
        cantidadOficial: null,
        estadoGlobal: EST_PENDIENTE,
        numeroConteoCoincidente: null,
        diferenciaUltimoConteo: null,
      };
    }

    if (llenos.length === 1 && c1 != null) {
      if (c1 === existenciaSistema) {
        return {
          cantidadOficial: c1,
          estadoGlobal: EST_AJUSTADO,
          numeroConteoCoincidente: 1,
          diferenciaUltimoConteo: diffUltimoConteo,
        };
      }
      return {
        cantidadOficial: null,
        estadoGlobal: EST_VERIFICAR,
        numeroConteoCoincidente: null,
        diferenciaUltimoConteo: diffUltimoConteo,
      };
    }

    if (llenos.length === 1 && c2 != null) {
      if (c2 === existenciaSistema) {
        return {
          cantidadOficial: c2,
          estadoGlobal: EST_AJUSTADO,
          numeroConteoCoincidente: 2,
          diferenciaUltimoConteo: diffUltimoConteo,
        };
      }
      return {
        cantidadOficial: null,
        estadoGlobal: EST_VERIFICAR,
        numeroConteoCoincidente: null,
        diferenciaUltimoConteo: diffUltimoConteo,
      };
    }

    if (llenos.length === 2 && c1 != null && c2 != null) {
      if (c1 === c2) {
        const cantidadOficial = c1;
        const diff = cantidadOficial - existenciaSistema;
        return {
          cantidadOficial,
          estadoGlobal: estadoPorDiff(diff),
          numeroConteoCoincidente: 1,
          diferenciaUltimoConteo: diffUltimoConteo,
        };
      }
      if (c2 === existenciaSistema) {
        const cantidadOficial = c2;
        const diff = cantidadOficial - existenciaSistema;
        return {
          cantidadOficial,
          estadoGlobal: estadoPorDiff(diff),
          numeroConteoCoincidente: 2,
          diferenciaUltimoConteo: diffUltimoConteo,
        };
      }
      return {
        cantidadOficial: null,
        estadoGlobal: EST_VERIFICAR,
        numeroConteoCoincidente: null,
        diferenciaUltimoConteo: diffUltimoConteo,
      };
    }

    if (llenos.length >= 3 && c1 != null && c2 != null && c3 != null) {
      let mayoritarioValor: number | null = null;
      let mayoritarioConteo: number | null = null;

      if (c1 === c2 || c1 === c3) {
        mayoritarioValor = c1;
        mayoritarioConteo = 1;
      } else if (c2 === c3) {
        mayoritarioValor = c2;
        mayoritarioConteo = 2;
      }

      if (mayoritarioValor != null) {
        const cantidadOficial = mayoritarioValor;
        const diff = cantidadOficial - existenciaSistema;
        return {
          cantidadOficial,
          estadoGlobal: estadoPorDiff(diff),
          numeroConteoCoincidente: mayoritarioConteo,
          diferenciaUltimoConteo: diffUltimoConteo,
        };
      }
      return {
        cantidadOficial: null,
        estadoGlobal: EST_VERIFICAR,
        numeroConteoCoincidente: null,
        diferenciaUltimoConteo: diffUltimoConteo,
      };
    }

    return {
      cantidadOficial: null,
      estadoGlobal: EST_VERIFICAR,
      numeroConteoCoincidente: null,
      diferenciaUltimoConteo: diffUltimoConteo,
    };
  }
}
