import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ACOSContratoI, ACOSIteraccionI } from '../../factories/acostado';
import { FACTContratoI, FACTIteraccionI } from '../../factories/facturado';
import { ServicioIpsOrm } from '../../orm';

export interface CONSOIteraccionI {
  consecutivoIngreso: number;
  nombreCompletoPaciente: string;
  fechaIngreso: Date;
  estado: 'ACOSTADO' | 'FACTURADO';
  nombreCama: string;
  codigoCama: string;
  servicios: ServicioIpsOrm[];
}

export interface CONSOContratoI {
  idContrato: number;
  codigoContrato: string;
  nombreContrato: string;
  totalFacturado: number;
  totalContratado: number;
  cantidadIteracciones: number;
  iteracciones: CONSOIteraccionI[];
  totalDiferencia: number;
  porcentajeDiferencia: number;
  porcentajeEjecutado: number;
}

@Injectable()
export class FetchConsolidadoImpl extends BaseSource {
  public async execute(facturado: FACTContratoI[], acostado: ACOSContratoI[]) {
    const data: CONSOContratoI[] = [];

    facturado.forEach(f => {
      const dataFilteredFromAcos = acostado.filter(a => a.idContrato === f.idContrato);
      const dataFromAcos = dataFilteredFromAcos.length ? dataFilteredFromAcos[0] : undefined;
      const totalFactFromAcos = dataFromAcos ? dataFromAcos.totalFacturado : 0;
      const totalIteraccFromAcos = dataFromAcos ? dataFromAcos.cantidadIteracciones : 0;

      const totalFacturado = f.totalFacturado + totalFactFromAcos;
      const totalDiferencia = Math.abs(f.totalContratado - totalFacturado);

      const newData: CONSOContratoI = {
        idContrato: f.idContrato,
        codigoContrato: f.codigoContrato,
        nombreContrato: f.nombreContrato,
        totalFacturado,
        totalContratado: f.totalContratado,
        cantidadIteracciones: f.cantidadIteracciones + totalIteraccFromAcos,
        totalDiferencia,
        porcentajeDiferencia: !totalFacturado ? 0 : (totalDiferencia * 100) / totalFacturado,
        porcentajeEjecutado: !f.totalContratado ? 0 : (totalFacturado * 100) / f.totalContratado,
        iteracciones: [],
      };

      const iteraccionesFromAgrupadores: FACTIteraccionI[] = [];

      f.agrupadores.forEach(a => {
        iteraccionesFromAgrupadores.push(...a.iteracciones);
      });

      const iteracciones: CONSOIteraccionI[] = [];

      iteraccionesFromAgrupadores.forEach(i => {
        iteracciones.push(this._generateIteraccion('FACTURADO', i));
      });

      if (dataFromAcos) {
        dataFromAcos.iteracciones.forEach(i => {
          iteracciones.push(this._generateIteraccion('ACOSTADO', i));
        });
      }

      newData.iteracciones = iteracciones;
      data.push(newData);
    });

    acostado.forEach(a => {
      const dataFilteredFromFact = facturado.filter(a => a.idContrato === a.idContrato);

      if (!dataFilteredFromFact.length) {
        const newData: CONSOContratoI = {
          idContrato: a.idContrato,
          codigoContrato: a.codigoContrato,
          nombreContrato: a.nombreContrato,
          totalFacturado: a.totalFacturado,
          totalContratado: a.totalContratado,
          cantidadIteracciones: a.cantidadIteracciones,
          totalDiferencia: Math.abs(a.totalContratado - a.totalFacturado),
          porcentajeDiferencia: !a.totalFacturado
            ? 0
            : (a.totalDiferencia * 100) / a.totalFacturado,
          porcentajeEjecutado: !a.totalContratado
            ? 0
            : (a.totalFacturado * 100) / a.totalContratado,
          iteracciones: [],
        };

        const iteracciones: CONSOIteraccionI[] = [];

        a.iteracciones.forEach(i => {
          iteracciones.push(this._generateIteraccion('ACOSTADO', i));
        });

        newData.iteracciones = iteracciones;
        data.push(newData);
      }
    });

    return data;
  }

  private _generateIteraccion(
    estado: 'ACOSTADO' | 'FACTURADO',
    iteraccion: ACOSIteraccionI | FACTIteraccionI
  ) {
    const newIteraccion: CONSOIteraccionI = {
      consecutivoIngreso: iteraccion.consecutivoIngreso,
      nombreCompletoPaciente: iteraccion.nombreCompletoPaciente,
      fechaIngreso: iteraccion.fechaIngreso,
      estado,
      nombreCama: estado === 'FACTURADO' ? 'EGRESÓ' : (iteraccion as ACOSIteraccionI).nombreCama,
      codigoCama: estado === 'FACTURADO' ? 'EGRESÓ' : (iteraccion as ACOSIteraccionI).codigoCama,
      servicios: iteraccion.servicios,
    };

    return newIteraccion;
  }
}
