import { In, IsNull, Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { AgrupadorServicioIpsBasicOrm, CheckPointContratoOrm, DetalleContratoOrm } from '../../orm';
import { IngresoOrm } from '@sln/orm/adn';
import { EstanciaOrm } from '@sln/orm/hpn';
import { getDiffInDays, groupByKey } from '@common/application/services';
import { CONTRATOS_PFGP, generateFakeAgrupador } from '@sln/pfgp/application/constants';
import { orderBy } from 'lodash';
import { ACOSContratoI, ACOSIteraccionI } from '../../factories/acostado';
import { GENEAutoCompleteServicios } from '../../factories';

@Injectable()
export class FetchAcostadoImpl extends BaseSource {
  public async execute(
    centroId: number,
    inicio: Date,
    agruServs?: AgrupadorServicioIpsBasicOrm[],
    checkPoints?: CheckPointContratoOrm[]
  ) {
    if (!centroId) centroId = undefined;

    const detalleContratoRp = this.conn.getRepository(DetalleContratoOrm);
    const estanciaRp = this.conn.getRepository(EstanciaOrm);
    const ingresoRp = this.conn.getRepository(IngresoOrm);

    const contratos = await detalleContratoRp.find({
      where: { codigo: In(CONTRATOS_PFGP(this.auth.context, inicio)) },
    });

    const estancias = await estanciaRp.find({
      where: {
        fechaEgreso: IsNull(),
        ingreso: {
          detalleContratoId: In(contratos.map(c => c.id)),
          centroId,
        },
      },
    });

    const ingresosIds: number[] = [];

    estancias.forEach(e => {
      ingresosIds.push(e.ingresoId);
    });

    const ingresos = await ingresoRp.find({
      relations: [
        'estancias',
        'estancias.cama',
        'estancias.cama.subgrupo',
        'paciente',
        'hojasProducto',
        'hojasProducto.detalle',
        'hojasProducto.detalle.servicio',
        'hojasProducto.detalle.servicio.servicioIps',
        'hojasProducto.detalle.servicio.servicioIps.agrupadores',
      ],
      where: {
        id: In(ingresosIds),
      },
    });

    ingresos.map(i => {
      const detalleContrato = contratos.filter(el => el.id === i.detalleContratoId)[0];
      i.codigoContrato = detalleContrato.codigo;
      i.nombreContrato = detalleContrato.nombre;
    });

    const groupedByContrato = groupByKey(ingresos, 'codigoContrato', 'nombreContrato');

    const fakeAgrupador = generateFakeAgrupador();

    const contratosRefactorizados: ACOSContratoI[] = [];

    if (!checkPoints) {
      const checkPointRp = this.conn.getRepository(CheckPointContratoOrm);

      const contratosIds: number[] = [];

      contratosRefactorizados.forEach(c => {
        contratosIds.push(c.idContrato);
      });

      checkPoints = await checkPointRp.find({
        where: {
          contratoId: In(contratosIds),
        },
        relations: ['contrato', 'agrupadores'],
      });
    }

    const fakeCheckPoint = new CheckPointContratoOrm();
    fakeCheckPoint.id = undefined;
    fakeCheckPoint.valor = 0;
    fakeCheckPoint.fechaInicio = new Date();
    fakeCheckPoint.fechaFin = new Date();
    fakeCheckPoint.agrupadores = [];

    groupedByContrato.forEach(el => {
      const checkPointsFiltered = checkPoints.filter(ch => ch.codigoContrato === el.key);
      const checkPoint = checkPointsFiltered.length ? checkPointsFiltered[0] : undefined;

      el.rows.map(s => {
        s = GENEAutoCompleteServicios(s, fakeAgrupador, checkPoint, agruServs);
        s.estancias = orderBy(s.estancias, 'fechaIngreso', 'desc');
        delete s.hojasProducto;
      });

      const result: ACOSContratoI = {
        idContrato: el.rows[0].detalleContratoId,
        codigoContrato: el.key,
        nombreContrato: el.name,
        ingresos: el.rows,
        cantidadIteracciones: el.rows.length,
        totalFacturado: 0,
        totalContratado: 0,
        totalDiferencia: 0,
        porcentajeDiferencia: 0,
        porcentajeEjecutado: 0,
        iteracciones: [],
        totalDisponibilidad: 0,
      };

      contratosRefactorizados.push(result);
    });

    contratosRefactorizados.map(c => {
      const checkPointsFiltered = checkPoints.filter(el => el.contratoId === c.idContrato);
      const checkPoint = checkPointsFiltered.length ? checkPointsFiltered[0] : fakeCheckPoint;
      c.totalContratado = checkPoint.valor;
      c.porcentajeDiferencia = (c.totalDiferencia * 100) / c.totalContratado;
      c.totalDisponibilidad = 0;

      c.ingresos.map(i => {
        i.setTypes(true);
        i.paciente.setTypes(true);
        const iteraccion: ACOSIteraccionI = {
          consecutivoIngreso: i.consecutivo,
          nombreCompletoPaciente: i.paciente.nombreCompleto,
          documentoPaciente: i.paciente.documento.numero,
          fechaIngreso: i.fechaIngreso,
          diasEstancia: Math.round(getDiffInDays(i.fechaIngreso)),
          codigoCama: i.estancias[0].cama.codigo,
          nombreCama: i.estancias[0].cama.nombre,
          nombreTipoIngreso: i.ingresoPor.getForHumans(),
          totalFacturado: 0,
          servicios: i.servicios,
          estancias: i.estancias,
        };

        i.estancias.map(e => {
          e.codigoCama = e.cama.codigo;
          e.nombreSubgrupo = e.cama.subgrupo.nombre;
        });

        i.servicios.map(s => {
          s.valorTotal = s.valorProducto * s.cantidad;
          iteraccion.totalFacturado += s.valorTotal;
          c.totalFacturado += s.valorTotal;
        });

        c.totalDiferencia = Math.abs(c.totalFacturado - c.totalContratado);
        c.porcentajeEjecutado = (c.totalFacturado * 100) / c.totalContratado;

        c.iteracciones.push(iteraccion);
      });

      delete c.ingresos;
    });

    return contratosRefactorizados;
  }
}
