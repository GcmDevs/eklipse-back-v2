import { BadRequestException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { RespuestaPacienteTrazadorDto } from '@hpn/pacientes/presentation/dtos';
import {
  PacTrazEncuestaOrm,
  PacTrazPreguntaOrm,
  PacTrazRespuestaOrm,
} from '../orm/pacientes-trazadores';

export class PacTrazRealizarEncuestaImpl extends BaseSource {
  async execute(body: RespuestaPacienteTrazadorDto): Promise<boolean> {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const encuestaRp = this.qr.manager.getRepository(PacTrazEncuestaOrm);
      const preguntaRp = this.qr.manager.getRepository(PacTrazPreguntaOrm);
      const respuestaRp = this.qr.manager.getRepository(PacTrazRespuestaOrm);

      let respuesta: PacTrazRespuestaOrm;
      let encuesta: PacTrazEncuestaOrm;

      encuesta = await encuestaRp.findOne({
        where: { pacienteId: body.pacienteId, ingresoId: body.ingresoId },
      });

      if (encuesta && encuesta.isFinalizada) {
        throw new Error('Encuesta ya finalizada');
      }

      if (!encuesta) {
        encuesta = new PacTrazEncuestaOrm();
        encuesta.pacienteId = body.pacienteId;
        encuesta.ingresoId = body.ingresoId;
        encuesta.usuarioId = this.auth.id;
        encuesta.isFinalizada = body.isFinalizada;
        encuesta.fechaCreacion = new Date();
        encuesta.observacion = null;
      }

      encuesta.fechaActualizacion = new Date();

      if (body.isFinalizada) {
        encuesta.isFinalizada = true;
        if (body.observacionEncuesta) {
          encuesta.observacion = body.observacionEncuesta;
        }
      }

      encuesta = await encuestaRp.save(encuesta);

      if (body.preguntaId) {
        const pregunta = await preguntaRp.findOne({ where: { id: body.preguntaId } });
        if (!pregunta) throw new Error('Pregunta no encontrada');
      }

      respuesta = await respuestaRp.findOne({
        where: { preguntaId: body.preguntaId, encuestaId: encuesta.id },
      });

      if (!respuesta) {
        respuesta = new PacTrazRespuestaOrm();
        respuesta.preguntaId = body.preguntaId;
      }
      respuesta.encuestaId = encuesta.id;
      respuesta.respuesta = body.respuesta;
      respuesta.observacion = body.observacionPregunta || null;

      if (body.preguntaId !== 0) respuesta = await respuestaRp.save(respuesta);

      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
