import { Injectable } from '@nestjs/common';
import { Not, Raw } from 'typeorm';
import { AfnDataSoliSerTecRes } from '@inn/lgc/afn/application/responses';
import { SolicitudServicioTecnicoOrm } from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { ESTADO_AFNITEM_SOL_SER_TEC } from '@inn/lgc/afn/types/inn/activos-fijos';
import { ServicioTecnicoBaseSource } from '../../bases';
import { afnSoliSerTecOrmToAfnSoliSerTecResFactory } from '../../factories';

@Injectable()
export class FetchCasoByPlacaServicioTecnicoSource extends ServicioTecnicoBaseSource {
  public async execute(placa: string): Promise<AfnDataSoliSerTecRes> {
    try {
      const placaNormalizada = placa?.trim().toUpperCase();

      if (!placaNormalizada) {
        throw new Error('La placa es obligatoria');
      }
      const estadoAprobado = ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode();
      const solicitudRp = this.conn.getRepository(SolicitudServicioTecnicoOrm);

      const solicitudes = await solicitudRp.find({
        where: {
          detalle: {
            estadoCode: Not(estadoAprobado),
            activo: {
              placa: Raw(alias => `UPPER(LTRIM(RTRIM(${alias}))) = :placa`, {
                placa: placaNormalizada,
              }),
            },
          },
        },
        relations: [
          'centro',
          'dependencia',
          'creadoPor',
          'detalle',
          'detalle.atendidoPor',
          'detalle.notas',
          'detalle.notas.creadoPor',
          'detalle.activo',
          'detalle.activo.producto',
          'detalle.activo.responsable',
          'detalle.ingreso',
          'detalle.ingreso.paciente',
          'detalle.ingreso.contrato',
          'detalle.ingreso.contrato.tercero',
        ],
        order: {
          fechaCreacion: 'DESC',
          id: 'DESC',
        },
      });

      const data = solicitudes.map(solicitud =>
        afnSoliSerTecOrmToAfnSoliSerTecResFactory(solicitud, this.auth.id)
      );

      return {
        canAsignarCasos: false,
        incluyeTodosLosServiciosTecnicos: false,
        puedeAsignarCasos: false,
        puedeAtenderCasosNoAsignados: false,
        puedeVerTodosLosCasos: false,
        data,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
