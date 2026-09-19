import { guardarObservacionPendiente } from './guardar-observacion-pendiente';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { GuardarAuditoriaPreDto } from '../../presentation/dto';
import { throwBoletaQuirurgicaError } from '../../application/errors';
import {
  actualizarAuditoriaPreQuery,
  buscarAuditoriaPreParaGuardarQuery,
  gestionarRegistroAuditoriaPreQuery,
  insertarAuditoriaPreQuery,
} from '../queries/auditoria-pre.query';

@Injectable()
export class GuardarAuditoriaPreImpl extends BaseSource {
  async execute(body: GuardarAuditoriaPreDto) {
    if (
      ![body.ingreso, body.folio].every(value => Number.isInteger(value) && value > 0) ||
      !['CUMPLE', 'NO CUMPLE'].includes(body.cumple) ||
      typeof body.cambioCups !== 'boolean'
    ) {
      throw new BadRequestException('Ingreso, folio y diligenciamiento HC son obligatorios');
    }
    const usuario = body.cambioCups ? String(this.auth.id) : '';
    if (body.cambioCups && body.usuarioCambioCups !== usuario) {
      throw new BadRequestException(
        'El usuario del cambio de CUPS no coincide con la sesión actual'
      );
    }
    const runner = this.conn.createQueryRunner();
    try {
      await runner.connect();
      await runner.startTransaction();
      const keys = [body.ingreso, body.folio];
      const registro = await runner.query(gestionarRegistroAuditoriaPreQuery(), keys);
      if (!Number(registro[0]?.afectados)) {
        throw new NotFoundException('No existe una boleta con el ingreso y folio indicados');
      }
      const existente = await runner.query(buscarAuditoriaPreParaGuardarQuery(), keys);
      const created = existente.length === 0;
      await runner.query(created ? insertarAuditoriaPreQuery() : actualizarAuditoriaPreQuery(), [
        ...keys,
        body.cumple,
        body.cambioCups ? 'SI' : 'NO',
        usuario,
      ]);

      if (body.observacionPendiente?.trim()) {
        await guardarObservacionPendiente(runner, body, 'AUDITORIA', this.auth.user.fullName);
      }
      await runner.commitTransaction();
      return { created, updated: !created, estado: 'EN GESTION' as const };
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando Auditoría');
    } finally {
      await runner.release();
    }
  }
}
