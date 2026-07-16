import { BaseSource } from '@common/infrastructure/services';
import { CrearSeguimientoSemanaDto } from '@hpn/estancias-prolongadas/presentation/dtos';
import { mapSeguimiento } from '@hpn/estancias-prolongadas/shared/utils/seguimiento.util';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstanciasProlongadasOrm, SeguimientoSemanaOrm } from '@orm/hpn/estancias-prolongadas';
import { Repository } from 'typeorm';

@Injectable()
export class CrearSeguimientoImpl extends BaseSource {
  public async crearSeguimiento(estanciaProlongadaId: number, body: CrearSeguimientoSemanaDto) {
    const data = await this.saveSeguimientoSemana(estanciaProlongadaId, body);
    return mapSeguimiento(data);
  }

  private async saveSeguimientoSemana(
    estanciaProlongadaId: number,
    body: CrearSeguimientoSemanaDto,
    options?: {
      estancia?: EstanciasProlongadasOrm;
      estanciaRp?: Repository<EstanciasProlongadasOrm>;
      seguimientoRp?: Repository<SeguimientoSemanaOrm>;
    }
  ) {
    const estanciaRp = options?.estanciaRp ?? this.conn.getRepository(EstanciasProlongadasOrm);
    const seguimientoRp = options?.seguimientoRp ?? this.conn.getRepository(SeguimientoSemanaOrm);

    const estancia =
      options?.estancia ?? (await estanciaRp.findOne({ where: { id: estanciaProlongadaId } }));

    if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');
    if (!estancia.estado) throw new ForbiddenException('La estancia ya esta cerrada');
    if (body.semanaNumero > 8) {
      throw new BadRequestException('El numero maximo de semanas es 8');
    }

    const seguimientoExistente = await seguimientoRp.findOne({
      where: { estanciaProlongadaId, semanaNumero: body.semanaNumero },
    });
    if (seguimientoExistente) {
      throw new BadRequestException('La semana ya existe para esta estancia');
    }

    if (body.semanaNumero > 1) {
      const seguimientoAnterior = await seguimientoRp.findOne({
        where: { estanciaProlongadaId, semanaNumero: body.semanaNumero - 1 },
      });
      if (!seguimientoAnterior) {
        throw new BadRequestException('No se puede crear una semana sin la anterior');
      }
    }

    const seguimiento = seguimientoRp.create({
      estanciaProlongadaId,
      semanaNumero: body.semanaNumero,
      fechaSeguimiento: new Date(body.fechaSeguimiento),
      esCritica: body.semanaNumero >= 4,
      estadoCodigo: body.estadoCodigo,
      destinoCodigo: body.destinoCodigo ?? null,
      accionCodigo: body.accionCodigo ?? null,
      responsable: body.responsable?.trim() ?? null,
      egresoEstimado: body.egresoEstimado ? new Date(body.egresoEstimado) : null,
      observaciones: body.observaciones?.trim() ?? null,
      escalada: body.escalada?.trim() ?? null,
      creadoPor: (this.auth.user as any)?.nombre ?? (this.auth.user as any)?.name ?? null,
      usuarioCreacionId: this.auth.user?.id ?? null,
    });

    return seguimientoRp.save(seguimiento);
  }
}
