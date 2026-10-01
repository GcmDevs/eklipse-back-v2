import { Injectable } from '@nestjs/common';
import { RadicacionRepository } from './repository';

@Injectable()
export class RadicacionDeFacturacionService {
  constructor(private readonly radicacionRepository: RadicacionRepository) {}

  async fullData(fechaInicio: string, fechaFin: string, centro1: number, centro2: number) {
    try {
      const resumen = await this.radicacionRepository.resumen(
        fechaInicio,
        fechaFin,
        centro1,
        centro2
      );
      const radicacionDiaria = await this.radicacionRepository.radicacionDiaria(
        fechaInicio,
        fechaFin,
        centro1,
        centro2
      );
      const radicacionAcumulada = await this.radicacionRepository.radicacionAcumulada(
        fechaInicio,
        fechaFin,
        centro1,
        centro2
      );
      const radicacionDocumentos = await this.radicacionRepository.radicacionPorDocumentos(
        fechaInicio,
        fechaFin
      );
      const radicacionEstado = await this.radicacionRepository.radicacionPorEstado(
        fechaInicio,
        fechaFin
      );
      const radicacionEntidades = await this.radicacionRepository.radicacionPorEntidades(
        fechaInicio,
        fechaFin
      );
      const radicacionUsuario = await this.radicacionRepository.radicacionPorUsuario(
        fechaInicio,
        fechaFin
      );
      const radicacionUsuarioPorEntidad =
        await this.radicacionRepository.radicacionUsuarioPorEntidad(fechaInicio, fechaFin);
      const pendientes = await this.radicacionRepository.radicacionPendiente(fechaInicio, fechaFin);
      const data = {
        resumen,
        pendientes,
        radicacionDiaria,
        radicacionAcumulada,
        radicacionDocumentos,
        radicacionEstado,
        radicacionEntidades,
        radicacionUsuario,
        radicacionUsuarioPorEntidad,
      };
      if (data) {
        return { success: true, message: 'Valores Radicados', data };
      } else {
        return { success: false, message: 'Sin datos que mostrar' };
      }
    } catch (error) {
      return { success: false, message: 'Sin datos que mostrar' };
    }
  }

  async radicacionPorEntidadesPorContrato(fechaInicio: string, fechaFin: string, contrato: number) {
    try {
      const data = await this.radicacionRepository.radicacionPorContrato(
        fechaInicio,
        fechaFin,
        contrato
      );
      if (data) {
        return { success: true, message: 'Valores Radicados', data };
      } else {
        return { success: false, message: 'Sin datos que mostrar' };
      }
    } catch (error) {
      return { success: false, message: 'Sin datos que mostrar' };
    }
  }

  async radicacionPendienteMesesAnteriores(fechaInicio: string, fechaFin: string) {
    try {
      const data = await this.radicacionRepository.radicacionPendienteMesesAnteriores(
        fechaInicio,
        fechaFin
      );
      if (data && data.length > 0) {
        return {
          success: true,
          message: 'Facturas Pendientes Por Radicar',
          data,
        };
      } else {
        return { success: false, message: 'Sin datos que mostrar' };
      }
    } catch (error) {
      return { success: false, message: 'Sin datos que mostrar' };
    }
  }

  async facturasSinRadicar() {
    try {
      const data = await this.radicacionRepository.facturasSinRadicar();
      if (data && data.length > 0) {
        return {
          success: true,
          message: 'Facturas Pendientes Por Radicar',
          data,
        };
      } else {
        return { success: false, message: 'Sin datos que mostrar' };
      }
    } catch (error) {
      return { success: false, message: 'Sin datos que mostrar' };
    }
  }
}
