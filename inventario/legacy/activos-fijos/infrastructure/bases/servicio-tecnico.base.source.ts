import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { SSTNotaOrm } from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { ESTADO_AFNITEM_SOL_SER_TEC } from '@inn/lgc/afn/types/inn/activos-fijos';

@Injectable()
export class ServicioTecnicoBaseSource extends BaseSource {
  protected refactorizeNotas(data: SSTNotaOrm) {
    const estadoFinalizado = ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA;
    if (data.isAprobado !== null || data.estadoCode === estadoFinalizado.getCode()) {
      data.nota = `ENTREGA ${
        data.estadoCode === estadoFinalizado.getCode()
          ? 'FINALIZADA'
          : data.isAprobado
            ? 'APROBADA'
            : 'RECHAZADA'
      }${data.nota ? `: ${data.nota}.` : '.'}`;
    }
    return data;
  }
}
