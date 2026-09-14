import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { InicializarBoletaQuirurgicaDto } from '@hpn/boleta-quirurgica/presentation/dto';
import {
  BoletaQuirurgicaAuditoriaOrm,
  BoletaQuirurgicaGestorQxOrm,
  BoletaQuirurgicaMaosOrm,
  BoletaQuirurgicaProgramacionOrm,
} from '../orm';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';

@Injectable()
export class InicializarBoletaQuirurgicaImpl extends BaseSource {
  public async execute(body: InicializarBoletaQuirurgicaDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const auditoriaRp = this.qr.manager.getRepository(BoletaQuirurgicaAuditoriaOrm);
      const gestorQxRp = this.qr.manager.getRepository(BoletaQuirurgicaGestorQxOrm);
      const maosRp = this.qr.manager.getRepository(BoletaQuirurgicaMaosOrm);
      const programacionRp = this.qr.manager.getRepository(BoletaQuirurgicaProgramacionOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const result = {
        created: false,
        autorizacion: 'exists',
        gestorQx: 'exists',
        maos: 'exists',
        programacion: 'exists',
      };

      const [auditoria, gestorQx, maos, programacion] = await Promise.all([
        auditoriaRp.findOne({ where }),
        gestorQxRp.findOne({ where }),
        maosRp.findOne({ where }),
        programacionRp.findOne({ where }),
      ]);

      if (!auditoria) {
        await auditoriaRp.save(
          auditoriaRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaCaptacion: new Date(),
            municipio: '',
            tipo: '',
            autorizado: '',
            pendiente1: '',
            pendiente2: '',
            pendiente3: '',
            pendiente4: '',
            pendiente5: '',
            pendiente6: '',
            pendiente7: '',
            servicio: '',
            observacion: '',
            fechaFin: null,
            cambioCups: '',
            usuario: '',
          })
        );
        result.created = true;
        result.autorizacion = 'created';
      }

      if (!gestorQx) {
        await gestorQxRp.save(
          gestorQxRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaRecepcion: new Date(),
            otrasValoraciones: '',
            observacion: '',
            estadoAutorizacion: '',
          })
        );
        result.created = true;
        result.gestorQx = 'created';
      }

      if (!maos) {
        await maosRp.save(
          maosRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaEntrega: null,
            maosSolicitado: '',
            casaComercial: '',
            estadoMaos: '',
            estado2Maos: '',
            existencia: '',
          })
        );
        result.created = true;
        result.maos = 'created';
      }

      if (!programacion) {
        await programacionRp.save(
          programacionRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaRecepcion: new Date(),
            fechaProgramacion: new Date(),
            programada: '',
            sede: '',
            estado: '',
            reqMaos: '',
            observacion: '',
            estadoProg: '',
          })
        );
        result.created = true;
        result.programacion = 'created';
      }

      await this.qr.commitTransaction();
      return result;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error inicializando registros de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
