import { Inject, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  boletaQuirurgicaAuditoriaQuery,
  boletaQuirurgicaGestorQxQuery,
  boletaQuirurgicaMaosQuery,
  boletaQuirurgicaProgramacionQuery,
  boletaQuirurgicaQuery,
  cirugiasRealizadasQuery,
  getAutorizadosQuery,
  getInfoProcedimientoQuery,
} from '@boleta-quirurgica/infraestructure/queries';
import {
  mapBoletaQuirurgicaDetalle,
  mapBoletaQuirurgicaRows,
} from '@boleta-quirurgica/application/mappers';
import { throwBoletaQuirurgicaError } from '@boleta-quirurgica/application/errors';
import {
  GuardarAutorizacionDto,
  GuardarGestorQxDto,
  GuardarMaosDto,
  GuardarObservacionDto,
  GuardarProgramacionDto,
  InicializarBoletaQuirurgicaDto,
  ObservacionesDto,
} from '@boleta-quirurgica/presentation/dtos';
import {
  BoletaQuirurgicaAuditoriaOrm,
  BoletaQuirurgicaGestorQxOrm,
  BoletaQuirurgicaLogOrm,
  BoletaQuirurgicaMaosOrm,
  BoletaQuirurgicaObservacionOrm,
  BoletaQuirurgicaProgramacionOrm,
  BoletaQuirurgicaRegistroOrm,
} from '@orm/gcn/boleta-quirurgica';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class BoletaQuirurgicaImpl extends BaseSource {
  constructor(@Inject(REQUEST) private readonly request: Request) {
    super(request);
  }

  private getClientIp(): string {
    const forwarded = this.request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return this.request.ip || this.request.socket?.remoteAddress || '';
  }

  private trim(value?: string): string {
    return value?.trim() ?? '';
  }

  private getAuthDoc(): string {
    const user = this.auth.user;
    return this.trim(user.document);
  }
  private getAuthUserName(): string {
    const user = this.auth.user;
    return this.trim(user.fullName);
  }

  public async fetchBoletaQuirurgica() {
    try {
      const result = await this.conn.query(boletaQuirurgicaQuery());
      return mapBoletaQuirurgicaRows(result);
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error consultando boleta quirurgica');
    }
  }

  public async fetchDetalle(ingreso: number, folio: number) {
    try {
      const params = [ingreso, folio];

      const [
        procedimientos,
        cupsAutorizados,
        programacion,
        cirugiasRealizadas,
        gestorqx,
        maos,
        auditoria,
      ] = await Promise.all([
        this.conn.query(getInfoProcedimientoQuery(), params),
        this.conn.query(getAutorizadosQuery(), params),
        this.conn.query(boletaQuirurgicaProgramacionQuery(), params),
        this.conn.query(cirugiasRealizadasQuery(ingreso)),
        this.conn.query(boletaQuirurgicaGestorQxQuery(), params),
        this.conn.query(boletaQuirurgicaMaosQuery(), params),
        this.conn.query(boletaQuirurgicaAuditoriaQuery(), params),
      ]);

      return mapBoletaQuirurgicaDetalle({
        procedimientos,
        cupsAutorizados,
        programacion,
        cirugiasRealizadas,
        gestorqx,
        maos,
        auditoria,
      });
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error consultando el detalle de la boleta quirurgica');
    }
  }

  public async guardarObservacion(body: GuardarObservacionDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const observacionRp = this.qr.manager.getRepository(BoletaQuirurgicaObservacionOrm);
      const usuario = this.getAuthUserName();

      await observacionRp.save(
        observacionRp.create({
          ingreso: body.ingreso,
          folio: body.folio,
          observacion: body.observacion,
          fechaObservacion: new Date(),
          gestor: this.trim(body.gestor),
          usuario,
        })
      );

      await this.qr.commitTransaction();
      return { created: true, usuario };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando observacion de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async guardarProgramacion(body: GuardarProgramacionDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const programacionRp = this.qr.manager.getRepository(BoletaQuirurgicaProgramacionOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const programacion = await programacionRp.findOne({ where });
      const payload = {
        sede: this.trim(body.institucion),
        fechaRecepcion: new Date(body.fechaRecepcion),
        estado: '',
        programada: this.trim(body.programada),
        fechaProgramacion: new Date(body.fechaProgramacion),
        observacion: '',
        estadoProg: this.trim(body.estadoProg),
      };

      if (!programacion) {
        await programacionRp.save(
          programacionRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            reqMaos: '',
            ...payload,
          })
        );

        await this.qr.commitTransaction();
        return { created: true, updated: false };
      }

      await programacionRp.update(where, payload);

      await this.qr.commitTransaction();
      return { created: false, updated: true };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando programacion de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async guardarGestorQx(body: GuardarGestorQxDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const gestorQxRp = this.qr.manager.getRepository(BoletaQuirurgicaGestorQxOrm);
      const auditoriaRp = this.qr.manager.getRepository(BoletaQuirurgicaAuditoriaOrm);
      const programacionRp = this.qr.manager.getRepository(BoletaQuirurgicaProgramacionOrm);
      const maosRp = this.qr.manager.getRepository(BoletaQuirurgicaMaosOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const gestorQx = await gestorQxRp.findOne({ where });
      const auditoria = await auditoriaRp.findOne({ where });
      const gestorQxPayload = {
        otrasValoraciones: this.trim(body.otrasValoraciones),
        observacion: this.trim(body.observacion),
        estadoAutorizacion: body.estadoAutorizacion,
      };
      const auditoriaPayload = {
        pendiente1: this.trim(body.pendiente1),
        pendiente2: this.trim(body.pendiente2),
        pendiente3: this.trim(body.pendiente3),
        pendiente4: this.trim(body.pendiente4),
      };

      if (!gestorQx) {
        await gestorQxRp.save(
          gestorQxRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaRecepcion: new Date(),
            ...gestorQxPayload,
          })
        );
      } else {
        await gestorQxRp.update(where, gestorQxPayload);
      }

      if (typeof body.reqMaos === 'boolean') {
        const reqMaos = body.reqMaos ? 'SI' : 'NO';
        const estado2Maos = body.reqMaos ? '' : 'SI';
        const maos = await maosRp.findOne({ where });
        const programacion = await programacionRp.findOne({ where });

        if (!maos) {
          await maosRp.save(
            maosRp.create({
              ingreso: body.ingreso,
              folio: body.folio,
              fechaEntrega: null,
              maosSolicitado: '',
              casaComercial: '',
              estadoMaos: '',
              estado2Maos,
              existencia: '',
            })
          );
        } else {
          await maosRp.update(where, {
            estado2Maos,
          });
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
              reqMaos,
              observacion: '',
              estadoProg: '',
            })
          );
        } else {
          await programacionRp.update(where, {
            reqMaos,
          });
        }
      }

      if (!auditoria) {
        await auditoriaRp.save(
          auditoriaRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaCaptacion: new Date(),
            municipio: '',
            tipo: '',
            autorizado: '',
            pendiente5: '',
            pendiente6: '',
            pendiente7: '',
            servicio: '',
            observacion: '',
            fechaFin: null,
            cambioCups: '',
            usuario: '',
            ...auditoriaPayload,
          })
        );
      } else {
        await auditoriaRp.update(where, auditoriaPayload);
      }

      await this.qr.commitTransaction();
      return { created: !gestorQx || !auditoria, updated: !!gestorQx && !!auditoria };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando gestor qx de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async guardarMaos(body: GuardarMaosDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const maosRp = this.qr.manager.getRepository(BoletaQuirurgicaMaosOrm);
      const programacionRp = this.qr.manager.getRepository(BoletaQuirurgicaProgramacionOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const maos = await maosRp.findOne({ where });
      const programacion = await programacionRp.findOne({ where });

      if (this.trim(programacion?.reqMaos).toUpperCase() === 'NO') {
        const finalizedPayload = { estado2Maos: 'SI' };

        if (!maos) {
          await maosRp.save(
            maosRp.create({
              ingreso: body.ingreso,
              folio: body.folio,
              fechaEntrega: null,
              maosSolicitado: '',
              casaComercial: '',
              estadoMaos: '',
              ...finalizedPayload,
              existencia: '',
            })
          );
        } else {
          await maosRp.update(where, finalizedPayload);
        }

        await this.qr.commitTransaction();
        return { skipped: true, finalized: true };
      }

      const payload = {
        maosSolicitado: this.trim(body.maosSolicitado),
        estadoMaos: this.trim(body.estadoMaos),
        casaComercial: this.trim(body.casaComercial),
        fechaEntrega: new Date(body.fechaEntrega),
        estado2Maos: this.trim(body.estado2Maos),
        existencia: this.trim(body.existencia),
      };

      if (!maos) {
        await maosRp.save(
          maosRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            ...payload,
          })
        );

        await this.qr.commitTransaction();
        return { created: true, updated: false };
      }

      await maosRp.update(where, payload);

      await this.qr.commitTransaction();
      return { created: false, updated: true };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando maos de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async guardarAutorizacion(body: GuardarAutorizacionDto, ip: string) {
    let transactionStarted = false;
    // const ip = this.getClientIp();

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const auditoriaRp = this.qr.manager.getRepository(BoletaQuirurgicaAuditoriaOrm);
      const observacionRp = this.qr.manager.getRepository(BoletaQuirurgicaObservacionOrm);
      const registroRp = this.qr.manager.getRepository(BoletaQuirurgicaRegistroOrm);
      const logRp = this.qr.manager.getRepository(BoletaQuirurgicaLogOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const observacion = this.trim(body.observacion);
      const usuarioLog = this.getAuthDoc();
      const autorizacionExistente = await auditoriaRp.findOne({
        where: { ingreso: body.ingreso, folio: body.folio },
      });

      if (!autorizacionExistente) {
        if (observacion) {
          await observacionRp.save(
            observacionRp.create({
              ingreso: body.ingreso,
              folio: body.folio,
              observacion,
              fechaObservacion: new Date(),
              gestor: 'AUTORIZACION',
              usuario: usuarioLog,
            })
          );
        }

        await auditoriaRp.save(
          auditoriaRp.create({
            ingreso: body.ingreso,
            fechaCaptacion: new Date(body.fechaCaptacion),
            municipio: this.trim(body.municipio),
            tipo: this.trim(body.tipo),
            autorizado: this.trim(body.autorizado),
            pendiente1: this.trim(body.pendiente1),
            pendiente2: this.trim(body.pendiente2),
            pendiente3: this.trim(body.pendiente3),
            pendiente4: this.trim(body.pendiente4),
            pendiente5: this.trim(body.pendiente5),
            pendiente6: this.trim(body.pendiente6),
            pendiente7: this.trim(body.pendiente7),
            servicio: this.trim(body.servicio),
            observacion,
            fechaFin: new Date(body.fechaGestor),
            cambioCups: '',
            usuario: '',
            folio: body.folio,
          })
        );

        await registroRp.update(where, { estado: 'EN GESTION' });
        await logRp.save(
          logRp.create({
            fecha: new Date(),
            usuario: usuarioLog,
            detalle: 'CAMBIO A ESTADO GESTION',
            modulo: 'AUTORIZACION',
            ingreso: body.ingreso,
            direccionIp: ip,
            host: this.request.hostname,
          })
        );

        await this.qr.commitTransaction();
        return { created: true, updated: false };
      }

      await auditoriaRp.update(where, {
        fechaCaptacion: new Date(body.fechaCaptacion),
        fechaFin: new Date(body.fechaGestor),
        municipio: this.trim(body.municipio),
        tipo: this.trim(body.tipo),
        autorizado: this.trim(body.autorizado),
        pendiente5: this.trim(body.pendiente5),
        pendiente6: this.trim(body.pendiente6),
        pendiente7: this.trim(body.pendiente7),
        servicio: this.trim(body.servicio),
        observacion,
        cambioCups: this.trim(body.cambioCups),
        usuario: this.trim(body.usuarioCambioCups),
      });
      await registroRp.update(where, { estado: this.trim(body.estado) || 'EN GESTION' });
      await logRp.save(
        logRp.create({
          fecha: new Date(),
          usuario: usuarioLog,
          detalle: 'ACTUALIZA A ESTADO AUDITORIA',
          modulo: 'AUDITORIA',
          ingreso: body.ingreso,
          direccionIp: ip,
          host: this.request.hostname,
        })
      );

      await this.qr.commitTransaction();
      return { created: false, updated: true };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando autorizacion de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async obtenerObservaciones(body: ObservacionesDto) {
    try {
      const observacionesRp = this.qr.manager.getRepository(BoletaQuirurgicaObservacionOrm);
      const where = { gestor: body.gestor, ingreso: body.ingreso, folio: body.folio };
      const observaciones = await observacionesRp.find({
        where,
        order: { fechaObservacion: 'DESC' },
      });
      return observaciones;
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error consultando observaciones de boleta quirurgica');
    }
  }

  public async inicializarRegistros(body: InicializarBoletaQuirurgicaDto) {
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
