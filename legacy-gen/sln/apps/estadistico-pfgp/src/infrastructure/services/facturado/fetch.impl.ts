import { Between, In } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  AgrupadorOrm,
  AgrupadorServicioIpsBasicOrm,
  CheckPointContratoOrm,
  FacturaOrm,
} from '../../orm';
import { FACTaddDataToContratos, FACTfacturasToContratos } from '../../factories/facturado';
import { CONTRATOS_PFGP } from '@sln/pfgp/application/constants';
import { uniq } from 'lodash';
import { HojaProductoOrm } from '@sln/orm/sln';

@Injectable()
export class FetchFacturadoImpl extends BaseSource {
  public async execute(inicio: Date, final: Date, centroId: number) {
    if (!centroId) centroId = undefined;

    const facturaRp = this.conn.getRepository(FacturaOrm);
    const checkPointRp = this.conn.getRepository(CheckPointContratoOrm);

    const agruServRp = this.conn.getRepository(AgrupadorServicioIpsBasicOrm);
    const agrupadoresRp = this.conn.getRepository(AgrupadorOrm);

    const checkPoints = await checkPointRp.find({
      relations: ['contrato', 'agrupadores'],
    });

    checkPoints.map(c => {
      c.codigoContrato = c.contrato.codigo;
      c.nombreContrato = c.contrato.nombre;
      delete c.contrato;
    });

    const tiposRequeridos = uniq(checkPoints.map(el => el.keyAgrupadorServicio));

    const agruServs: AgrupadorServicioIpsBasicOrm[] = [];

    for (let index = 0; index < tiposRequeridos.length; index++) {
      const tipo = tiposRequeridos[index];
      const res = await agruServRp.find({ where: { tipo } });
      agruServs.push(...res);
    }

    const agrupadores = await agrupadoresRp.find();

    agruServs.map(el => {
      el.agrupador = agrupadores.filter(a => a.id === el.agrupadorId)[0];
    });

    let facturas = await facturaRp.find({
      relations: [
        'detalleContrato',
        'detalleContrato.contrato',
        'ingreso',
        'ingreso.paciente',
        'ingreso.hojasProducto',
        'ingreso.hojasProducto.detalle',
        'ingreso.hojasProducto.detalle.servicio',
        'ingreso.hojasProducto.detalle.servicio.servicioIps',
      ],
      where: {
        createdAt: Between(inicio, final),
        detalleContrato: {
          codigo: In(CONTRATOS_PFGP(this.auth.context, inicio)),
        },
        ingreso: {
          centroId,
        },
      },
    });

    facturas.map(f => {
      const hojProdFiltered: HojaProductoOrm[] = [];
      if (f.ingreso && f.ingreso.hojasProducto && f.ingreso.hojasProducto.length) {
        f.ingreso.hojasProducto.forEach(h => {
          if (h.fecha >= inicio) hojProdFiltered.push(h);
        });
        f.ingreso.hojasProducto = hojProdFiltered;
      }
    });

    facturas = facturas.filter(f => f.ingreso && f.ingreso.hojasProducto.length);

    const contratosFacturados = FACTfacturasToContratos(facturas, checkPoints, agruServs);

    const contratosIds: number[] = [];

    contratosFacturados.forEach(c => {
      contratosIds.push(c.idContrato);
    });

    const contratosFacturadosCompletados = FACTaddDataToContratos(contratosFacturados, checkPoints);

    return { data: contratosFacturadosCompletados, checkPoints, agruServs };
  }
}
