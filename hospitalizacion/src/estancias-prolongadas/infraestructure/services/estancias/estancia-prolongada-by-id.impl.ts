import { BaseSource } from '@common/infrastructure/services';
import {
  SeguimientoAccionCode,
  seguimientoAccionTypeFactory,
  SeguimientoDestinoCode,
  seguimientoDestinoTypeFactory,
  SeguimientoEstadoCode,
  seguimientoEstadoTypeFactory,
} from '@ctypes/hpn/estancias-prolongadas';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EstanciasProlongadasOrm, SeguimientoSemanaOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class EstanciaProlongadaByIdImpl extends BaseSource {
  private mapSeguimiento(seguimiento: SeguimientoSemanaOrm) {
    return {
      ...seguimiento,
      estado: seguimientoEstadoTypeFactory(seguimiento.estadoCodigo as SeguimientoEstadoCode),
      destino: seguimiento.destinoCodigo
        ? seguimientoDestinoTypeFactory(seguimiento.destinoCodigo as SeguimientoDestinoCode)
        : null,
      accion: seguimiento.accionCodigo
        ? seguimientoAccionTypeFactory(seguimiento.accionCodigo as SeguimientoAccionCode)
        : null,
    };
  }
  public async getEstanciaProlongadaById(id: number) {
    const stayRp = this.conn.getRepository(EstanciasProlongadasOrm);
    const seguimientoRp = this.conn.getRepository(SeguimientoSemanaOrm);

    const data = await stayRp.findOne({
      where: { id },
      relations: ['preguntas', 'preguntas.dominioItem', 'acciones', 'acciones.dominio'],
    });

    if (!data) throw new NotFoundException('Estancia prolongada no encontrada');

    const seguimientos = await seguimientoRp.find({
      where: { estanciaProlongadaId: id },
      order: { semanaNumero: 'ASC' },
    });

    return {
      message: 'Estancia encontrada satisfactoriamente',
      data: {
        ...data,
        seguimientos: seguimientos.map(seguimiento => this.mapSeguimiento(seguimiento)),
      },
    };
  }
}
