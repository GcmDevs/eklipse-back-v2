import { BaseSource } from '@common/infrastructure/services';
import { PollaMundialistaApuestaOrm, PollaMundialistaOrm } from '@inn/orm/inn/polla-mundialista';
import { Injectable } from '@nestjs/common';
import { calcularPuntosPronostico } from '../factories';
import { orderBy } from 'lodash';

@Injectable()
export class FetchPartidosImpl extends BaseSource {
  async execute(): Promise<PollaMundialistaOrm[]> {
    const partidoRp = this.ekConn.getRepository(PollaMundialistaOrm);
    const apuestaRp = this.conn.getRepository(PollaMundialistaApuestaOrm);

    const apuestas = await apuestaRp.find({
      where: { usuarioId: this.auth.id },
    });

    const partidos = await partidoRp.find({
      order: { fecha: 'DESC' },
      take: 5,
    });

    partidos.map(partido => {
      const apuesta = apuestas.find(a => a.pollaMundialistaId === partido.id);
      partido.localPrediccion = apuesta ? apuesta.localPrediccion : null;
      partido.visitantePrediccion = apuesta ? apuesta.visitantePrediccion : null;
      if (
        partido.localPrediccion !== null &&
        partido.visitantePrediccion !== null &&
        partido.isCerrado
      ) {
        partido.puntaje = calcularPuntosPronostico(
          partido.localMarcador,
          partido.visitanteMarcador,
          partido.localPrediccion,
          partido.visitantePrediccion
        );
      }
      partido.estado =
        partido.localPrediccion === null &&
        partido.visitantePrediccion === null &&
        !partido.isCerrado
          ? 'Pendiente'
          : partido.localPrediccion !== null &&
              partido.visitantePrediccion !== null &&
              !partido.isCerrado
            ? 'Guardado'
            : 'Cerrado';
    });

    return orderBy(partidos, ['fecha'], ['asc']);
  }
}
