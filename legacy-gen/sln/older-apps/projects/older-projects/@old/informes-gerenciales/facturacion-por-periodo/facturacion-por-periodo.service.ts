import { Injectable } from '@nestjs/common';
import { FacturacionPorMesPayload } from './interfaces/facturacion-por-mes.interfaces';
import { FacturacionRepository, FacturacionUsuarioRepository } from './repository';

/** @deprecated Use the v2 */
@Injectable()
export class FacturacionPorPeriodoService {
  constructor(
    private readonly facturacionRepo: FacturacionRepository,
    private readonly UsuarioRepo: FacturacionUsuarioRepository
  ) {}

  async getFacturacionPorMes(data: FacturacionPorMesPayload) {
    return await this.facturacionRepo.getFacturacionPorMes(data.fechas, data.centro1, data.centro2);
  }

  async getFacturacionResumen(
    fechaInicio: string,
    fechaFin: string,
    centro1: number,
    centro2: number
  ) {
    const graficas = await this.facturacionRepo.GraficasConsolidado(
      fechaInicio,
      fechaFin,
      centro1,
      centro2
    );
    const resumen = await this.facturacionRepo.ResumenConsolidado(
      fechaInicio,
      fechaFin,
      centro1,
      centro2
    );

    const data = { resumen, graficas };
    return { success: true, message: 'Facturacion Resumen', data };
  }

  async getFullData(fechaInicio: string, fechaFin: string) {
    try {
      const centros = await this.facturacionRepo.centros2(fechaInicio, fechaFin);
      const documentos = await this.facturacionRepo.documentos(fechaInicio, fechaFin);
      const servicioEgresos = await this.facturacionRepo.servicioEgreso(fechaInicio, fechaFin);
      const entidades = await this.facturacionRepo.entidades(fechaInicio, fechaFin);
      const usuarios = await this.facturacionRepo.usuariosConsolidado(fechaInicio, fechaFin);
      const data = {
        centros,
        documentos,
        servicioEgresos,
        entidades,
        usuarios,
      };
      return { success: true, message: 'Facturacion', data };
    } catch (error) {
      return { success: false, message: 'Ha sucedido Un Error' };
    }
  }

  async getContratosPorEntidad(fechaInicio: string, fechaFin: string, entidad: string) {
    try {
      const data = await this.facturacionRepo.contratosPorEntidades(fechaInicio, fechaFin, entidad);
      return { success: true, message: 'Contratos', data };
    } catch (error) {
      return { success: false, message: 'Ha sucedido Un Error' };
    }
  }

  async getFacturacionPorUsuario(fechaInicio: string, fechaFin: string, usuario: string) {
    try {
      const grafica = await this.UsuarioRepo.getFacturaciongrafica(fechaInicio, fechaFin, usuario);
      const resumen = await this.UsuarioRepo.getFacturacionResumen(fechaInicio, fechaFin, usuario);
      const centros = await this.UsuarioRepo.getFacturacionCentros(fechaInicio, fechaFin, usuario);
      const documentos = await this.UsuarioRepo.getFacturacionDocumentos(
        fechaInicio,
        fechaFin,
        usuario
      );
      const servicioEgresos = await this.UsuarioRepo.getFacturacionServicioEgreso(
        fechaInicio,
        fechaFin,
        usuario
      );
      const entidades = await this.UsuarioRepo.getFacturacionEntidades(
        fechaInicio,
        fechaFin,
        usuario
      );

      const data = {
        grafica,
        resumen,
        centros,
        documentos,
        servicioEgresos,
        entidades,
      };
      return { success: true, message: 'Facturacion Por Usuario', data };
    } catch (error) {
      return { success: false, message: 'Ha sucedido Un Error' };
    }
  }
}
