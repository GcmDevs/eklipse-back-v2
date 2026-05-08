import { BadRequestException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { PacTrazEncuestaOrm, PacTrazRespuestaOrm } from '../orm/pacientes-trazadores';
import { pacTrazCategoriaPreguntaTypeFactory } from '@hpn/pacientes/domain/types';
import { PacTrazRespuestaRes } from '@hpn/pacientes/application/responses';

export class PacTrazAvancesEncuestaImpl extends BaseSource {
  async execute(
    pacienteId: number,
    ingresoId: number,
    addInfoAdicional: boolean
  ): Promise<PacTrazRespuestaRes[]> {
    try {
      const encuestaRp = this.conn.getRepository(PacTrazEncuestaOrm);
      const respuestaRp = this.conn.getRepository(PacTrazRespuestaOrm);

      const encuesta = await encuestaRp.findOne({ where: { pacienteId, ingresoId } });
      const respuestas = await respuestaRp.find({
        where: { encuestaId: encuesta.id },
        relations: ['pregunta'],
      });

      return respuestas.map(r => {
        let pregunta = undefined;
        if (addInfoAdicional) {
          const categoria = pacTrazCategoriaPreguntaTypeFactory(r.pregunta.categoriaCode);
          pregunta = { categoria: categoria.getForHumans(), descripcion: r.pregunta.descripcion };
        }

        const res: PacTrazRespuestaRes = {
          preguntaId: r.preguntaId,
          respuesta: r.respuesta,
          observacion: r.observacion,
          pregunta,
        };

        return res;
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
