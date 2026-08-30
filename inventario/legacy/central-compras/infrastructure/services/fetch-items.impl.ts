import { In, Not } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { getExistenciaActualQuery, gruposProductosValidosByCtx, ResponseBasicI } from '../queries';
import { groupByKey } from '@common/application/services';
import { getUsoPorMes, ReporteRes } from './uso-productos-por-mes';
import { GrupoProductoOrm, ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { ExistenciaActualI } from '@inn/lgc/ctc/application/interfaces';

@Injectable()
export class FetchItemsImpl extends BaseSource {
  public async execute(grupoId: number) {
    if (!grupoId) grupoId = 999;
    const showAllGrupos = +grupoId === 999;

    const grupoRp = this.conn.getRepository(GrupoProductoOrm);
    const productoRp = this.conn.getRepository(ProductoOrm);

    let grupoIds: number[] = [];

    if (showAllGrupos) {
      const nombresGruposValidos = gruposProductosValidosByCtx(this.auth.context);
      const grupos = await grupoRp.find({
        where: { nombre: nombresGruposValidos.length ? In(nombresGruposValidos) : undefined },
      });
      grupoIds = grupos.map(g => g.id);
    } else {
      grupoIds = [grupoId];
    }

    const productos = await productoRp.find({
      where: {
        isBloqueado: false,
        grupoId: In(grupoIds),
        agrupamiento: {
          codigo: Not('000'),
        },
      },
      relations: [
        'agrupamiento',
        'grupo',
        'ofertas',
        'fabricante',
        'ofertas.proveedor',
        'ofertas.valor',
      ],
    });

    const existenciasActuales: ExistenciaActualI[] = await this.conn.query(
      getExistenciaActualQuery()
    );

    productos.map(p => {
      p.ofertas.map(ic => {
        delete ic.set;
        delete ic.setId;
        delete ic.producto;
        delete ic.productoId;
        delete ic.proveedorId;
        delete ic.valorId;
        delete ic.proveedor.direccion;
        delete ic.proveedor.tel1;
        delete ic.proveedor.tel2;
        delete ic.proveedor.tercero;
        delete ic.valor.createdAt;
        delete ic.valor.createdById;
        delete ic.valor.id;
        delete ic.valor.itemCotizadoId;
      });

      p.ofertas = p.ofertas.filter(ic => !ic.isDeleted);

      p.setTypes(true);
      const existenciaActualFiltered = existenciasActuales.filter(
        ea => ea.agrupamientoId === p.agrupamientoId
      );
      let existenciaActual: ExistenciaActualI = {
        productoId: 0,
        agrupamientoId: 0,
        costoPromedio: 0,
        stockMinimo: 0,
        stockMaximo: 0,
        puntoReposicion: 0,
        existenciaActual: 0,
        cantidad: 0,
        vencimientoMasCercano: undefined,
        isVencimientoProximo: false,
      };

      if (existenciaActualFiltered.length) {
        existenciaActualFiltered.forEach((ea, iea) => {
          if (!iea) {
            existenciaActual.productoId = ea.productoId;
            existenciaActual.agrupamientoId = ea.agrupamientoId;
            existenciaActual.costoPromedio = ea.costoPromedio;
            existenciaActual.stockMaximo = ea.stockMaximo;
            existenciaActual.stockMinimo = ea.stockMinimo;
          }
          existenciaActual.puntoReposicion += ea.puntoReposicion;
          existenciaActual.existenciaActual += ea.existenciaActual;
        });
      }

      p.existenciaActual = existenciaActual;

      if (!p.agrupamiento) {
        delete p.agrupamiento;
      } else {
        p.codigoAgrupamiento = p.agrupamiento.codigo;
        p.nombreAgrupamiento = p.agrupamiento.nombre;
      }
      delete p.grupoId;
    });

    const groupedByAgrupamiento = groupByKey(
      productos.filter(e => e.agrupamientoId),
      'codigoAgrupamiento',
      'nombreAgrupamiento'
    );

    const results: ResponseBasicI[] = [];

    let tempResults: ReporteRes[] = [];
    try {
      const res = await getUsoPorMes(
        new Date(),
        new Date(),
        grupoId,
        undefined,
        undefined,
        this.conn
      );
      tempResults = res[0].data;
    } catch (error: any) {}

    groupedByAgrupamiento.map(a => {
      const result: ResponseBasicI = {
        id: 0,
        codigo: a.key,
        nombre: a.name,
        isByAgrupamiento: true,
        stockMinimo: 0,
        stockMaximo: 0,
        existenciaActual: 0,
        puntoReposicion: 0,
        promedioConsumo: 0,
        nombreGrupo: a.rows[0].grupo ? a.rows[0].grupo.nombre : 'SIN GRUPO',
        valorTotal: 0,
        cantidadSolicitada: 0,
        detalleFromBackend: [],
        calculadoFromPromedioConsumo: false,
      };

      result.id = a.rows[0].id;

      if (a.rows.length === 1) {
        result.codigo = a.rows[0].codigo;
        result.nombre = a.rows[0].descripcion;
        result.isByAgrupamiento = false;
      }

      const existenciaActual = a.rows[0].existenciaActual;

      const f = tempResults.filter(rs => rs.COD_AGRUPAMIENTO === a.key);
      if (f.length) result.promedioConsumo = f[0].PROMEDIO_CONSUMO;
      else result.promedioConsumo = 0;

      result.calculadoFromPromedioConsumo = f[0] ? f[0].CALCULADO_FROM_PROMEDIO_CONSUMO : false;
      result.stockMinimo = result.promedioConsumo
        ? result.promedioConsumo / 2
        : existenciaActual
          ? existenciaActual.stockMinimo
          : 0;
      result.stockMaximo = result.promedioConsumo
        ? (result.promedioConsumo / 2) * 3
        : existenciaActual
          ? existenciaActual.stockMaximo
          : 0;

      result.existenciaActual += existenciaActual ? existenciaActual.existenciaActual : 0;
      result.puntoReposicion += existenciaActual ? existenciaActual.puntoReposicion : 0;
      result.detalleFromBackend = a.rows;
      results.push(result);
    });

    results.map(r => {
      r.cantidadSolicitada = r.promedioConsumo
        ? r.existenciaActual >= r.promedioConsumo
          ? 0
          : r.promedioConsumo - r.existenciaActual
        : 0;
      r.cantidadSolicitada = Math.ceil(r.cantidadSolicitada);
    });

    productos
      .filter(p => !p.agrupamientoId)
      .map(a => {
        if (!results.filter(r => r.codigo === a.codigo).length) {
          const result: ResponseBasicI = {
            id: a.id,
            codigo: a.codigo,
            nombre: a.descripcion,
            isByAgrupamiento: false,
            stockMinimo: 0,
            stockMaximo: 0,
            existenciaActual: 0,
            puntoReposicion: 0,
            promedioConsumo: 0,
            nombreGrupo: a.grupo ? a.grupo.nombre : 'SIN GRUPO',
            valorTotal: 0,
            cantidadSolicitada: 0,
            detalleFromBackend: [],
            calculadoFromPromedioConsumo: false,
          };
          const ea = a.existenciaActual;
          result.stockMinimo += ea ? ea.stockMinimo : 0;
          result.stockMaximo += ea ? ea.stockMaximo : 0;
          result.existenciaActual += ea ? ea.existenciaActual : 0;
          result.puntoReposicion += ea ? ea.puntoReposicion : 0;
          results.push(result);
        }
      });

    results.map(r => {
      if (!r.promedioConsumo) r.promedioConsumo = 0;
    });

    return results;
  }
}
