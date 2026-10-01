import { getExamenesQuery } from './../queries/cama.query';
import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ExamenesResponse } from '../responses';

const codeLabs = ['0501', '0502', '0702'];
const codeRadiology = ['0707', '0503', '0504', '0505'];

@Injectable()
export class LaboratorioSourceRepository extends BaseSource {
  public async getExamenes(ctx: GcmContexts, consecutivo: number): Promise<any> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));

    try {
      const result: ExamenesResponse[] = await this.qr.query(getExamenesQuery(consecutivo));

      if (!result || result.length === 0) {
        throw new BadRequestException('No se encontraron resultados para los examenes solicitados');
      }

      const filterResultByRadiologia = result.filter(ex =>
        codeRadiology.includes(ex.SUBGRUPOCODIGO)
      );
      const filterResultByLaboratorio = result.filter(ex => codeLabs.includes(ex.SUBGRUPOCODIGO));

      return {
        radiologia: filterResultByRadiologia.map(examen => ({
          consecutivo: examen.CONSECUTIVO,
          ordenServicio: examen.ORDENSERVICIO,
          fechaConfirmacion: examen.FECHACONFIRMACION,
          fechaServicio: examen.FECHASERVICIO,
          servicioCodigo: examen.SERVICIOCODIGO,
          servicioNombre: examen.SERVICIONOMBRE,
          subgrupoNombre: examen.SUBGRUPONOMBRE,
          subgrupoCodigo: examen.SUBGRUPOCODIGO,
          planNombre: examen.PLANNOMBRE,
          cantidad: examen.CANTIDAD,
          estadoOrdenServicio: examen.ESTADO_ORDEN_SERVICIO,
          resultadosExamenes: examen.RESULTADOSEXAMENES,
          ingresoPor: examen.INGRESO_POR,
          claseIngreso: examen.CLASE_INGRESO,
          aplicadoAPx: examen.APLICADO_A_PX,
        })),
        laboratorio: filterResultByLaboratorio.map(examen => ({
          consecutivo: examen.CONSECUTIVO,
          ordenServicio: examen.ORDENSERVICIO,
          fechaConfirmacion: examen.FECHACONFIRMACION,
          fechaServicio: examen.FECHASERVICIO,
          servicioCodigo: examen.SERVICIOCODIGO,
          servicioNombre: examen.SERVICIONOMBRE,
          subgrupoNombre: examen.SUBGRUPONOMBRE,
          subgrupoCodigo: examen.SUBGRUPOCODIGO,
          resultadosExamenes: examen.RESULTADOSEXAMENES,
          planNombre: examen.PLANNOMBRE,
          cantidad: examen.CANTIDAD,
          estadoOrdenServicio: examen.ESTADO_ORDEN_SERVICIO,
          ingresoPor: examen.INGRESO_POR,
          claseIngreso: examen.CLASE_INGRESO,
          aplicadoAPx: examen.APLICADO_A_PX,
        })),
      };
    } catch (error) {
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }
  // public async getInterconsultas(ctx: GcmContexts, documento: number): Promise<any> {
  //   console.log(`Fetching interconsultas data for documento: ${documento} in context: ${ctx}`);

  //   const qr = this.dynamicQR(gcmContextFactory(ctx));

  //   try {
  //     const result: ExamenesResponse[] = await this.qr.query(getInterconsultasQuery(documento));

  //     if (!result || result.length === 0) {
  //       throw new Error('No se encontraron resultados para los examenes solicitads');
  //     }
  //     return result.map(examen => ({
  //       fechaSolicitud: examen.FECHASOLICITUD,
  //       resultadoExamenes: examen.HCNRESEXA,
  //       ingresoId: examen.INGRESOID,
  //       fechaFolio: examen.FECHAFOLIO,
  //       codigoMedico: examen.GMECODIGO,
  //       nombreMedico: examen.GMENOMCOM,
  //       servicioIpsCodigo: examen.SIPCODIGO,
  //       servicioIpsNombre: examen.SIPNOMBRE,
  //       descripcionServicio: examen.SIPDESCUP,
  //       codigoSubgrupo: examen.GSUCODIGO,
  //       nombreSubgrupo: examen.GSUNOMBRE,
  //     }));
  //   } catch (error) {
  //     throw new Error(`Error fetching laboratorio data: ${error.message}`);
  //   } finally {
  //     await qr.release();
  //   }
  // }
}
