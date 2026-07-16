import { BaseSource } from '@common/infrastructure/services';
import {
  CierreBarreraCriticaCode,
  cierreBarreraCriticaTypeFactory,
  CierreDestinoFinalCode,
  cierreDestinoFinalTypeFactory,
  CierreLosResultadoCode,
  cierreLosResultadoTypeFactory,
  CierreProtocoloSuficienteCode,
  cierreProtocoloSuficienteTypeFactory,
} from '@ctypes/hpn/estancias-prolongadas';
import { CerrarEstanciaDto } from '@hpn/estancias-prolongadas/presentation/dtos';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EstanciasProlongadasOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class CerrarEstanciaImpl extends BaseSource {
  public async cerrarEstancia(estanciaProlongadaId: number, body: CerrarEstanciaDto) {
    const estanciaRp = this.conn.getRepository(EstanciasProlongadasOrm);

    const estancia = await estanciaRp.findOne({ where: { id: estanciaProlongadaId } });
    if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');
    if (!estancia.estado) throw new BadRequestException('La estancia ya esta cerrada');

    const fechaEgreso = new Date(body.fechaEgreso);
    if (fechaEgreso < estancia.fechaIngreso) {
      throw new BadRequestException(
        'La fecha de egreso no puede ser anterior a la fecha de ingreso'
      );
    }

    estancia.estado = false;
    estancia.fechaCierre = fechaEgreso;
    estancia.usuarioCerroId = this.auth.user.id;
    estancia.fechaEgreso = fechaEgreso;
    estancia.losTotal = body.losTotal;
    estancia.destinoFinalCodigo = body.destinoFinalCodigo;
    estancia.firmaMedico = body.firmaMedico?.trim() ?? null;
    estancia.losResultadoCodigo = body.losResultadoCodigo;
    estancia.barreraCriticaCodigo = body.barreraCriticaCodigo;
    estancia.accionEfectiva = body.accionEfectiva?.trim() ?? null;
    estancia.accionInefectiva = body.accionInefectiva?.trim() ?? null;
    estancia.leccionAprendida = body.leccionAprendida?.trim() ?? null;
    estancia.protocoloSuficienteCodigo = body.protocoloSuficienteCodigo;
    estancia.observacionesCierre = body.observacionesCierre?.trim() ?? null;
    estancia.updatedAt = new Date();

    const data = await estanciaRp.save(estancia);

    return {
      id: data.id,
      estado: data.estado ? 1 : 0,
      fechaCierre: data.fechaCierre,
      usuarioCerroId: data.usuarioCerroId,
      cierre: this.mapCierre(data, body.fechaEgreso),
    };
  }

  private mapCierre(estancia: EstanciasProlongadasOrm, fechaEgreso: string) {
    return {
      fechaEgreso,
      losTotal: estancia.losTotal,
      destinoFinal: cierreDestinoFinalTypeFactory(
        estancia.destinoFinalCodigo as CierreDestinoFinalCode
      ),
      firmaMedico: estancia.firmaMedico,
      losResultado: cierreLosResultadoTypeFactory(
        estancia.losResultadoCodigo as CierreLosResultadoCode
      ),
      barreraCritica: cierreBarreraCriticaTypeFactory(
        estancia.barreraCriticaCodigo as CierreBarreraCriticaCode
      ),
      accionEfectiva: estancia.accionEfectiva,
      accionInefectiva: estancia.accionInefectiva,
      leccionAprendida: estancia.leccionAprendida,
      protocoloSuficiente: cierreProtocoloSuficienteTypeFactory(
        estancia.protocoloSuficienteCodigo as CierreProtocoloSuficienteCode
      ),
      observacionesCierre: estancia.observacionesCierre,
    };
  }
}
