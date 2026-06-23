import { BaseSource } from '@common/infrastructure/services';
import { PollaMundialistaApuestaOrm, PollaMundialistaOrm } from '@inn/orm/inn/polla-mundialista';
import {
  ClasificacionUsuarioRes,
  DefiClasifiRes,
} from '@inn/polla-mundialista/application/responses';
import { Injectable } from '@nestjs/common';
import { calcularPuntosPronostico } from '../factories';
import { orderBy } from 'lodash';
import { _PrivSecEkUserOrm } from '@common/infrastructure/orm/ek-user.orm';
import { In } from 'typeorm';
import { UsuarioExternoOrm, UsuarioOrm } from '@inn/orm/gen';

@Injectable()
export class FetchClasificacionImpl extends BaseSource {
  async execute(): Promise<DefiClasifiRes> {
    const partidoRp = this.ekConn.getRepository(PollaMundialistaOrm);
    const apuestaRp = this.conn.getRepository(PollaMundialistaApuestaOrm);
    const ekUsuarioRp = this.ekConn.getRepository(UsuarioExternoOrm);
    const usuarioRp = this.conn.getRepository(UsuarioOrm);

    const partidos = await partidoRp.find();

    const apuestas = await apuestaRp.find();

    const usuariosIdsExternos = apuestas.filter(a => a.isExterno).map(a => a.usuarioId);
    const usuariosIdsDinamica = apuestas.filter(a => !a.isExterno).map(a => a.usuarioId);

    const usuariosDinamica = await usuarioRp.find({ where: { id: In(usuariosIdsDinamica) } });
    const usuariosExternos = await ekUsuarioRp.find({ where: { id: In(usuariosIdsExternos) } });

    apuestas.map(apuesta => {
      const partido = partidos.find(
        partido =>
          partido.localMarcador === apuesta.localPrediccion &&
          partido.visitanteMarcador === apuesta.visitantePrediccion
      );

      apuesta.pollaMundialista = partido;
    });

    apuestas.map(apuesta => {
      apuesta.usuario = apuesta.isExterno
        ? usuariosExternos.find(ue => ue.id === apuesta.usuarioId)
        : (usuariosDinamica.find(ud => ud.id === apuesta.usuarioId) as any);
      const partido = partidos.find(partido => partido.id === apuesta.pollaMundialistaId);
      apuesta.pollaMundialista = partido;
      return apuesta;
    });

    const tempClasificacion = new Map<number, ClasificacionUsuarioRes>();

    apuestas.forEach(apuesta => {
      let usuario = tempClasificacion.get(apuesta.usuarioId);

      if (!usuario) {
        usuario = {
          id: apuesta.id,
          posicion: 0,
          usuarioId: apuesta.usuarioId,
          cedula: apuesta.usuario.cedula,
          nombreCompleto: apuesta.usuario.nombreCompleto,
          puntos: 0,
          exactos: 0,
          aciertos: 0,
          pendientes: 0,
        };
        tempClasificacion.set(apuesta.usuarioId, usuario);
      }

      usuario.puntos += calcularPuntosPronostico(
        apuesta.pollaMundialista.localMarcador,
        apuesta.pollaMundialista.visitanteMarcador,
        apuesta.localPrediccion,
        apuesta.visitantePrediccion
      );

      usuario.exactos += calcularPuntosPronostico(
        apuesta.pollaMundialista.localMarcador,
        apuesta.pollaMundialista.visitanteMarcador,
        apuesta.localPrediccion,
        apuesta.visitantePrediccion,
        true
      );

      usuario.aciertos += calcularPuntosPronostico(
        apuesta.pollaMundialista.localMarcador,
        apuesta.pollaMundialista.visitanteMarcador,
        apuesta.localPrediccion,
        apuesta.visitantePrediccion,
        false,
        true
      );

      usuario.pendientes += calcularPuntosPronostico(
        apuesta.pollaMundialista.localMarcador,
        apuesta.pollaMundialista.visitanteMarcador,
        apuesta.localPrediccion,
        apuesta.visitantePrediccion,
        false,
        false,
        true
      );
    });

    const results = [...tempClasificacion.values()].sort(
      (usuarioA, usuarioB) =>
        usuarioB.puntos - usuarioA.puntos || usuarioA.usuarioId - usuarioB.usuarioId
    );

    const clasificacion = orderBy(results, ['puntos', 'id'], 'desc');

    clasificacion.map((usuario, index) => (usuario.posicion = index + 1));

    return {
      colaboradoresActivos: clasificacion.length,
      clasificacion: clasificacion.slice(0, 5),
      miPosicion: clasificacion.find(
        usuario => usuario.usuarioId === this.getTokenDecoded().user.id
      ),
    };
  }
}
