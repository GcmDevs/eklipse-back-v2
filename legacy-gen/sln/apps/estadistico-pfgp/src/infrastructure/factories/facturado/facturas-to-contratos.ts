import { getDiffInDays, groupByKey } from '@common/application/services';
import {
  AgrupadorServicioIpsBasicOrm,
  CheckPointContratoOrm,
  ServicioIpsOrm,
  FacturaOrm,
} from '../../orm';
import { orderBy } from 'lodash';
import { generateFakeAgrupador } from '@sln/pfgp/application/constants';

export interface FACTContratoI {
  idContrato: number;
  codigoContrato: string;
  nombreContrato: string;
  totalFacturado: number;
  totalRecuperado: number;
  cantidadIteracciones: number;
  facturas: FacturaOrm[];
  iteracciones: FACTIteraccionI[];
  agrupadores: FACTAgrupadorI[];
  totalContratado: number;
  totalDiferencia: number;
  porcentajeDiferencia: number;
  totalDisponibilidad: number;
  porcentajeEjecutado: number;
}

export interface FACTIteraccionI {
  servicios: ServicioIpsOrm[];
  totalFacturado: number;
  totalRecuperado: number;
  nombreAgrupador: string;
  idAgrupador: number;
  pesoAgrupador: number;
  nombreCompletoPaciente: string;
  consecutivoIngreso: number;
  CMEContratado: number;
  fechaIngreso: Date;
  diasEstancia: number;
}

export interface FACTAgrupadorI {
  id: number;
  peso: number;
  nombre: string;
  totalFacturado: number;
  totalRecuperado: number;
  cantidadIteracciones: number;
  iteracciones: FACTIteraccionI[];
  limite: number;
  cantidadEventosContratados: number;
  diferenciaEventos: number;
  CMEFacturado: number;
  CMEContratado: number;
  totalDiferencia: number;
  porcentajeDiferencia: number;
  porcentajeEjecutado: number;
}

export const FACTfacturasToContratos = (
  facturas: FacturaOrm[],
  checkPoints: CheckPointContratoOrm[],
  agruServs: AgrupadorServicioIpsBasicOrm[]
) => {
  const fakeAgrupador = generateFakeAgrupador();

  facturas.map(el => {
    delete el.ingresoId;
    delete el.detalleContrato.contratoId;
    delete el.ingreso.pacienteId;
    el.ingreso.paciente.setTypes(true);

    el.codigoContrato = el.detalleContrato.contrato
      ? el.detalleContrato.contrato.codigo
      : el.detalleContrato.codigo;

    el.nombreContrato = el.detalleContrato.contrato
      ? el.detalleContrato.contrato.nombre
      : el.detalleContrato.nombre;

    if (el.ingreso.paciente) {
      el.idPaciente = el.ingreso.paciente.id;
      el.nombrePaciente = el.ingreso.paciente.nombreCompleto;
    }
  });

  const dataGroupedByContrato = groupByKey(facturas, 'codigoContrato', 'nombreContrato');

  const dataFormatted: FACTContratoI[] = [];

  dataGroupedByContrato.forEach(el => {
    el.rows.map(s => {
      s.valorFacturado = 0;
      s.valorRecuperado = 0;
      s.ingreso.hojasProducto.map(p => {
        const fakeServices: ServicioIpsOrm[] = [];
        p.detalle.forEach(d => {
          s.valorFacturado += d.valorEntidad * d.cantidad;
          s.valorRecuperado += d.valorPaciente * d.cantidad;
          if (d.servicio) {
            d.servicio.servicioIps.cantidad = d.cantidad;
            d.servicio.servicioIps.valorProducto = d.valorProducto;
            d.servicio.servicioIps.valorEntidad = d.valorEntidad;
            d.servicio.servicioIps.valorPaciente = d.valorPaciente;
            d.servicio.servicioIps.valorTotal = d.cantidad * (d.valorEntidad + d.valorPaciente);

            let agrupador = fakeAgrupador;

            const checkPointsFiltered = checkPoints.filter(
              ch => ch.contratoId === s.detalleContratoId
            );
            const checkPoint = checkPointsFiltered.length ? checkPointsFiltered[0] : undefined;

            if (checkPoint) {
              const agrupadorFiltered = agruServs.filter(
                agru =>
                  agru.tipo === checkPoint.keyAgrupadorServicio &&
                  agru.servicioId === d.servicio.servicioIps.id
              );

              if (!agrupadorFiltered.length) agrupador = fakeAgrupador;
              else agrupador = agrupadorFiltered[0].agrupador;
            } else {
              const agrupadorFiltered = agruServs.filter(
                agru => agru.servicioId === d.servicio.servicioIps.id
              );
              if (!agrupadorFiltered.length) agrupador = fakeAgrupador;
              else agrupador = agrupadorFiltered[0].agrupador;
            }

            if (d.servicio.servicioIps.valorTotal === 0 && agrupador.id !== fakeAgrupador.id) {
              agrupador = fakeAgrupador;
            }

            delete d.servicio.servicioIps.agrupadores;
            d.servicio.servicioIps.idAgrupador = agrupador.id;
            d.servicio.servicioIps.pesoAgrupador = agrupador.peso;
            d.servicio.servicioIps.nombreAgrupador = agrupador.nombre;
            s.ingreso.servicios.push(d.servicio.servicioIps);
          } else {
            const newServicio = new ServicioIpsOrm();
            newServicio.id = d.id;
            newServicio.codigo = 'MEDICAMENTOS';
            newServicio.nombre = d.descripcion;
            newServicio.cantidad = d.cantidad;
            newServicio.valorProducto = d.valorProducto;
            newServicio.valorEntidad = d.valorEntidad;
            newServicio.valorPaciente = d.valorPaciente;
            newServicio.valorTotal = d.cantidad * (d.valorEntidad + d.valorPaciente);
            newServicio.pesoAgrupador = fakeAgrupador.peso;
            newServicio.nombreAgrupador = fakeAgrupador.nombre;
            fakeServices.push(newServicio);
          }
        });
        s.ingreso.servicios.push(...fakeServices);
      });
      delete s.ingreso.hojasProducto;
    });

    dataGroupedByContrato.map(d => {
      const facturas: FacturaOrm[] = [];
      d.rows.map(r => {
        const ft = facturas.filter(f => f.ingreso.paciente.id === r.ingreso.paciente.id);
        if (ft.length) {
          ft[0].valorFacturado += r.valorFacturado;
          ft[0].valorRecuperado += r.valorRecuperado;
          ft[0].ingreso.servicios.push(...r.ingreso.servicios);
        } else {
          facturas.push(r);
        }
      });
      facturas.map(f => {
        f.ingreso.servicios = orderBy(f.ingreso.servicios, 'pesoAgrupador', 'desc');
      });
      d.rows = facturas;
    });

    const result: FACTContratoI = {
      idContrato: el.rows[0].detalleContratoId,
      codigoContrato: el.key,
      nombreContrato: el.name,
      totalFacturado: 0,
      totalRecuperado: 0,
      facturas: el.rows,
      iteracciones: [],
      agrupadores: [],
      cantidadIteracciones: 0,
      totalContratado: 0,
      totalDiferencia: 0,
      porcentajeDiferencia: 0,
      totalDisponibilidad: 0,
      porcentajeEjecutado: 0,
    };

    el.rows.forEach(r => {
      result.totalFacturado += r.valorFacturado;
      result.totalRecuperado += r.valorRecuperado;
    });

    dataFormatted.push(result);
  });

  dataFormatted.map(df => {
    const groupedByPaciente = groupByKey(df.facturas, 'idPaciente', 'nombrePaciente');

    groupedByPaciente.forEach(gp => {
      const iteraccion: FACTIteraccionI = {
        servicios: [],
        totalFacturado: 0,
        totalRecuperado: 0,
        nombreAgrupador: '',
        pesoAgrupador: 0,
        idAgrupador: 0,
        nombreCompletoPaciente: '',
        consecutivoIngreso: 0,
        CMEContratado: 0,
        diasEstancia: 0,
        fechaIngreso: undefined,
      };

      gp.rows.forEach((r, i) => {
        if (!i) {
          iteraccion.nombreCompletoPaciente = r.ingreso.paciente.nombreCompleto;
        }
        iteraccion.fechaIngreso = r.ingreso.fechaIngreso;
        iteraccion.totalFacturado += r.valorFacturado;
        iteraccion.totalRecuperado += r.valorRecuperado;
        iteraccion.servicios.push(...r.ingreso.servicios);
        iteraccion.consecutivoIngreso = r.ingreso.consecutivo;
        if (iteraccion.servicios.length) {
          iteraccion.idAgrupador = iteraccion.servicios[0].idAgrupador;
          iteraccion.pesoAgrupador = iteraccion.servicios[0].pesoAgrupador;
          iteraccion.nombreAgrupador = iteraccion.servicios[0].nombreAgrupador;
        }
      });
      df.cantidadIteracciones++;
      df.iteracciones.push(iteraccion);
    });
    delete df.facturas;

    const groupedByAgrupador = groupByKey(df.iteracciones, 'pesoAgrupador', 'nombreAgrupador');

    groupedByAgrupador.forEach(ga => {
      const agrupador: FACTAgrupadorI = {
        id: 0,
        peso: 0,
        nombre: '',
        totalFacturado: 0,
        totalRecuperado: 0,
        iteracciones: [],
        cantidadIteracciones: 0,
        limite: 0,
        cantidadEventosContratados: 0,
        diferenciaEventos: 0,
        CMEFacturado: 0,
        CMEContratado: 0,
        totalDiferencia: 0,
        porcentajeDiferencia: 0,
        porcentajeEjecutado: 0,
      };

      ga.rows.forEach((r, i) => {
        if (!i) {
          agrupador.id = r.idAgrupador;
          agrupador.peso = r.pesoAgrupador;
          agrupador.nombre = r.nombreAgrupador;
        }
        agrupador.totalFacturado += r.totalFacturado;
        agrupador.totalRecuperado += r.totalRecuperado;
        agrupador.iteracciones.push(r);
        agrupador.cantidadIteracciones++;
      });

      df.agrupadores.push(agrupador);
    });
    delete df.iteracciones;
    df.agrupadores = orderBy(df.agrupadores, 'peso', 'desc');
  });

  return dataFormatted;
};

export const FACTaddDataToContratos = (
  contratos: FACTContratoI[],
  checkPoints: CheckPointContratoOrm[]
) => {
  const fakeCheckPoint = new CheckPointContratoOrm();
  fakeCheckPoint.id = undefined;
  fakeCheckPoint.valor = 0;
  fakeCheckPoint.fechaInicio = new Date();
  fakeCheckPoint.fechaFin = new Date();
  fakeCheckPoint.agrupadores = [];

  contratos.map(c => {
    const checkPointsFiltered = checkPoints.filter(el => el.contratoId === c.idContrato);
    const checkPoint = checkPointsFiltered.length ? checkPointsFiltered[0] : fakeCheckPoint;
    c.totalContratado = checkPoint.valor;
    c.totalDiferencia = Math.abs(c.totalFacturado - c.totalContratado);
    c.porcentajeDiferencia = (c.totalDiferencia * 100) / c.totalContratado;
    c.totalDisponibilidad = 0;
    c.porcentajeEjecutado = (c.totalFacturado * 100) / c.totalContratado;

    c.agrupadores.map(a => {
      const complementosFiltered = checkPoint.agrupadores.filter(el => el.agrupadorId === a.id);
      const complemento = complementosFiltered.length ? complementosFiltered[0] : undefined;
      if (complemento) {
        a.limite = complemento.limite;
        a.cantidadEventosContratados = complemento.cantidadEventosContratados;
        a.diferenciaEventos = +Math.abs(
          a.cantidadIteracciones - a.cantidadEventosContratados
        ).toFixed(2);
        a.CMEContratado = a.limite / a.cantidadEventosContratados;
        a.CMEFacturado = a.CMEContratado * a.cantidadIteracciones;
        a.totalDiferencia = !a.limite ? 0 : Math.abs(a.limite - a.totalFacturado);
        a.porcentajeDiferencia = !a.limite ? 0 : (a.totalDiferencia * 100) / a.limite;
        a.porcentajeEjecutado = !a.limite ? 0 : (a.totalFacturado * 100) / a.limite;
        a.iteracciones.map(i => {
          i.CMEContratado = a.CMEContratado;
          i.diasEstancia = Math.round(getDiffInDays(i.fechaIngreso));
        });
      }
    });
  });

  return contratos;
};
