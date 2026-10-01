import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AsignacionVehiculoDto,
  CancelarDto,
  CreateAndAsignarUsuarioDto,
  CreateNotaDto,
  NewAsignacionVehiculoDto,
  TrasladoInicarOrFinalizarDto,
} from '@hpn/gestion-clinica/v1/presentation/dtos';
import {
  CANCELADA,
  ESTADOS_TRASLADO,
  estadoTrasladoTypeFactory,
  SIGNOS_VISTALES,
  SIGNOS_VISTALES_VALUES,
  signoVitalesTypeFactory,
  TIPOS_EMPLEADO,
  tipoEmpleadoTypeFactory,
  tipoProfesionalTypeFactory,
  TIPOS_ESTADO_VITAL,
  TIPOS_TRASLADO,
  tipoTurnoEmpleadoTypeFactory,
} from '@hpn/gestion-clinica/v1/domain/types';
import {
  AsignacionVehiculoOrm,
  EkEmpleadoOrm,
  EmpleadoOrm,
  NotaOrm,
  SignoVitalOrm,
  SolicitudTrasladoOrm,
  VehiculoOrm,
} from '../orm';
import { BaseSource } from '@common/infrastructure/services';
import { UsuarioOrm } from '../../../../orm/general';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import { GestionOrm } from '@hpn/gestion-clinica/v1/infrastructure/orm/gestion.orm';

@Injectable()
export class TrasladoCrudImpl extends BaseSource {
  public async createAndAsignarEmpleado(body: CreateAndAsignarUsuarioDto) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      if (!body.empleado && !body.empleadoExiste) {
        throw new Error(`El registro no pudo ser completado, por favor intentelo nuevamente`);
      }

      const vehiculoRp = this.qr.manager.getRepository(VehiculoOrm);
      const asignacionVehiculoRp = this.qr.manager.getRepository(AsignacionVehiculoOrm);
      const empleadoRp = this.qr.manager.getRepository(EmpleadoOrm);
      const usuarioRp = this.qr.manager.getRepository(UsuarioOrm);

      const vehiculo = await vehiculoRp.findOne({ where: { placa: body.vehiculo.placa } });

      const newAsignacionVehiculo = new AsignacionVehiculoOrm();

      if (vehiculo) {
        newAsignacionVehiculo.vehiculoId = vehiculo.id;
      } else {
        const newVehiculo = new VehiculoOrm();
        newVehiculo.placa = body.vehiculo.placa.toUpperCase();
        const vh = await vehiculoRp.save(newVehiculo);
        newAsignacionVehiculo.vehiculoId = vh.id;
      }

      const empleadoIds: number[] = [];

      const empleodoDocumento: string[] = [];

      if (body.empleadoExiste.length) {
        let usuario: UsuarioOrm;

        for (let i = 0; i < body.empleadoExiste.length; i++) {
          const tipo = body.empleadoExiste[i].tipoEmpleadoCode;

          const auxiliar = tipo === TIPOS_EMPLEADO.AUXILIAR.getCode();

          const conductor = tipo === TIPOS_EMPLEADO.CONDUCTOR.getCode();

          const empleado = await empleadoRp.findOne({
            where: { usuarioId: body.empleadoExiste[i].id },
            relations: ['usuario'],
          });

          if (!empleado) {
            usuario = await usuarioRp.findOne({ where: { id: body.empleadoExiste[i].id } });

            if (!usuario) {
              throw new Error(`El ID del usuario ${body.empleadoExiste[i].id} es inválido.`);
            }

            const newEmpledo = new EmpleadoOrm();
            newEmpledo.usuarioId = usuario.id;
            newEmpledo.tipoEmpleadoCode = tipo;
            const empleadoLocal = await empleadoRp.save(newEmpledo);

            const existenEmpleadoAsignado = await asignacionVehiculoRp.findOne({
              where: [
                { auxiliarId: empleadoLocal.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
                { conductorId: empleadoLocal.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
              ],
            });

            if (existenEmpleadoAsignado) {
              throw new Error(
                `El ID del usuario ${body.empleadoExiste[i].id} ya se encuentra registrado.`
              );
            }

            if (auxiliar) newAsignacionVehiculo.auxiliarId = empleadoLocal.id;
            if (conductor) newAsignacionVehiculo.conductorId = empleadoLocal.id;
          } else {
            const existenEmpleadoAsignado = await asignacionVehiculoRp.findOne({
              where: [
                { auxiliarId: empleado.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
                { conductorId: empleado.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
              ],
            });

            if (existenEmpleadoAsignado) {
              throw new Error(`El ID del usuario ${empleado.id} ya se encuentra registrado.`);
            }
            if (auxiliar) newAsignacionVehiculo.auxiliarId = empleado.id;
            if (conductor) newAsignacionVehiculo.conductorId = empleado.id;
          }
        }
      }

      if (body.empleado.length) {
        for (let i = 0; i < body.empleado.length; i++) {
          const tipo = body.empleado[i].tipoEmpleadoCode;
          const auxiliar = tipo === TIPOS_EMPLEADO.AUXILIAR.getCode();
          const conductor = tipo === TIPOS_EMPLEADO.CONDUCTOR.getCode();

          const empleado = await empleadoRp.findOne({
            where: { documento: body.empleado[i].documento },
            relations: ['usuario'],
          });

          if (!empleado) {
            const newEmpledo = new EmpleadoOrm();
            newEmpledo.documento = body.empleado[i].documento;
            newEmpledo.nombre = body.empleado[i].nombre.toUpperCase();
            newEmpledo.tipoEmpleadoCode = tipo;
            const empleadoLocal = await empleadoRp.save(newEmpledo);

            const existenEmpleadoAsignado = await asignacionVehiculoRp.findOne({
              where: [
                { auxiliarId: empleadoLocal.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
                { conductorId: empleadoLocal.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
              ],
            });

            if (existenEmpleadoAsignado) {
              throw new Error(
                `El ID del usuario ${body.empleado[i].id} ya se encuentra registrado`
              );
            }

            if (auxiliar) newAsignacionVehiculo.auxiliarId = empleadoLocal.id;
            if (conductor) newAsignacionVehiculo.conductorId = empleadoLocal.id;
          } else {
            if (body.empleado[i].id === 0) {
              throw new Error(
                `El numero de ${body.empleado[i].documento} ya se encuentra asociado a un empleado`
              );
            }
            const existenEmpleadoAsignado = await asignacionVehiculoRp.findOne({
              where: [
                { auxiliarId: empleado.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
                { conductorId: empleado.id, vehiculoId: newAsignacionVehiculo.vehiculoId },
              ],
            });

            if (existenEmpleadoAsignado) {
              throw new Error(`El ID del usuario ${empleado.id} ya se encuentra registrado.`);
            }

            if (auxiliar) newAsignacionVehiculo.auxiliarId = empleado.id;
            if (conductor) newAsignacionVehiculo.conductorId = empleado.id;
          }
        }
      }

      if (newAsignacionVehiculo.auxiliarId === newAsignacionVehiculo.conductorId) {
        throw new Error(
          `El registro no puede ser completado porque el mismo empleado ha sido asignado tanto como auxiliar como conductor. Por favor, revisa los datos ingresados.`
        );
      }

      newAsignacionVehiculo.fechaInicial = new Date();

      newAsignacionVehiculo.isActivo = body.isActivo;

      newAsignacionVehiculo.tipoTurno = body.tipoTurnoCode;

      await asignacionVehiculoRp.save(newAsignacionVehiculo);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await this.qr.release();
    }
  }

  public async asignar(body: NewAsignacionVehiculoDto) {
    const usuarioId = this.auth.user.id;

    const qr = this.dynamicQR(gcmContextFactory(body.contexto));
    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

    try {
      await qr.connect();

      await qr.startTransaction();

      const gestionRp = qr.manager.getRepository(GestionOrm);
      const asignacionVehiculoRp = qr.manager.getRepository(AsignacionVehiculoOrm);
      // const empleadoRp = qr.manager.getRepository(EmpleadoOrm);
      // const usuarioRp = qr.manager.getRepository(UsuarioOrm);

      const gestion = await gestionRp.findOne({
        where: { id: body.gestionId, solicitudAmbulancia: { id: body.trasladoId } },
        relations: ['solicitudAmbulancia'],
      });

      if (!gestion) {
        throw new Error(
          `La gestion con id ${body.gestionId} no fue encontrada, intentelo nuevamente`
        );
      }

      const solicitudTrasladoRp = qr.manager.getRepository(SolicitudTrasladoOrm);

      const solicitudTraslado = await solicitudTrasladoRp.findOne({
        where: { gestionId: body.gestionId, id: body.trasladoId },
      });

      if (!gestion.solicitudAmbulancia || !solicitudTraslado) {
        throw new Error(`Esta gestión no cuenta con solicitud de traslado`);
      }

      if (gestion.solicitudAmbulancia.id !== solicitudTraslado.id) {
        throw new Error(`La solicitud de traslado no le pertenece a esta gestión`);
      }

      if (gestion.state === TIPOS_ESTADO_VITAL.CANCELADA.getCode()) {
        throw new Error(`Esta gestión fue CANCELADA, por favor actualice`);
      }

      if (
        gestion.state !== TIPOS_ESTADO_VITAL.ASIGNADA.getCode() &&
        solicitudTraslado.tipoTraslado !== TIPOS_TRASLADO.REDONDO.getCode()
      ) {
        throw new Error(`Esta gestión no está en estado ASIGNADA, no puede ser gestionada`);
      }

      if (solicitudTraslado.estado !== ESTADOS_TRASLADO.PENDIENTE.getCode()) {
        throw new Error(
          `Este traslado ya se encuentra en estado ${estadoTrasladoTypeFactory(
            solicitudTraslado.estado
          ).getForHumans()} por favor actualice`
        );
      }

      const newAsignacion = new AsignacionVehiculoOrm();

      const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);

      const vehiculo = await vehiculoRp.findOne({ where: { id: body.asigVehiculoId } });

      if (!vehiculo) {
        throw new Error(
          `No se encuentra ningun vehiculo asociado a este ID ${body.asigVehiculoId}`
        );
      }

      newAsignacion.vehiculoId = vehiculo.id;

      const ekHpnEntidadRp = ekQr.manager.getRepository(EkEmpleadoOrm);

      let conductor: EkEmpleadoOrm, auxiliar: EkEmpleadoOrm, medico: EkEmpleadoOrm;

      if (body.auxiliar) {
        auxiliar = await ekHpnEntidadRp.findOne({
          where: { documento: body.auxiliar.documento },
        });

        if (!auxiliar) {
          const newEnt = new EkEmpleadoOrm();
          newEnt.nombre = body.auxiliar.nombre;
          newEnt.documento = body.auxiliar.documento;
          newEnt.tipoCode = TIPOS_EMPLEADO.AUXILIAR.getCode();
          auxiliar = await ekHpnEntidadRp.save(newEnt);
        }
        newAsignacion.auxiliarId = auxiliar.id;
      }

      if (body.medico) {
        medico = await ekHpnEntidadRp.findOne({
          where: { documento: body.medico.documento },
        });
        if (!medico) {
          const newEnt = new EkEmpleadoOrm();
          newEnt.nombre = body.medico.nombre;
          newEnt.documento = body.medico.documento;
          newEnt.tipoCode = TIPOS_EMPLEADO.MEDICO.getCode();
          medico = await ekHpnEntidadRp.save(newEnt);
        }
        gestion.solicitudAmbulancia.medicoId = medico.id;
      }

      if (body.conductor) {
        conductor = await ekHpnEntidadRp.findOne({
          where: { documento: body.conductor.documento },
        });
        if (!conductor) {
          const newEnt = new EkEmpleadoOrm();
          newEnt.nombre = body.conductor.nombre;
          newEnt.documento = body.conductor.documento;
          newEnt.tipoCode = TIPOS_EMPLEADO.CONDUCTOR.getCode();
          conductor = await ekHpnEntidadRp.save(newEnt);
        }
        newAsignacion.conductorId = conductor.id;
      }

      newAsignacion.fechaInicial = new Date();
      newAsignacion.isActivo = true;
      newAsignacion.tipoTurno = tipoTurnoEmpleadoTypeFactory(1).getCode();
      newAsignacion.asignadoPorId = usuarioId;

      await asignacionVehiculoRp.save(newAsignacion);

      gestion.state = TIPOS_ESTADO_VITAL.EN_PROCESO.getCode();
      gestion.inProcessAt = new Date();
      gestion.inProcessBy = this.auth.user.id;

      gestion.solicitudAmbulancia.observacionCompletado = body.observacion;
      gestion.solicitudAmbulancia.asigVehiculoId = newAsignacion.id;
      gestion.solicitudAmbulancia.nombreAcompanante = body.acompanante.nombre;
      gestion.solicitudAmbulancia.documentoAcompanante = body.acompanante.documento;
      gestion.solicitudAmbulancia.estado = ESTADOS_TRASLADO.ASIGNADO.getCode();

      gestion.centroProcesamiento = this.auth.context.getNumericCode();

      await solicitudTrasladoRp.save(gestion.solicitudAmbulancia);

      await gestionRp.save(gestion);

      /*    const asignacionVehiculo = await asignacioVehiculoRp.findOne({
        where: { id: body.asigVehiculoId, isActivo: true },
      });

      if (!asignacionVehiculo) {
        throw new Error(
          `El ID ${body.asigVehiculoId} de la asignación no es valido o esta inactivo.`
        );
      }
 */
      // const usuarioRp = this.qr.manager.getRepository(UsuarioOrm);

      await qr.commitTransaction();
      await ekQr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      await ekQr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await qr.release();
      await ekQr.release();
    }
  }

  public async iniciarOrFinalizar(body: TrasladoInicarOrFinalizarDto) {
    const conn = this.dynamicConn(gcmContextFactory(body.contextoCode));

    const qr = conn.createQueryRunner();

    const usuarioId = this.auth.user.id;
    try {
      await qr.connect();

      await qr.startTransaction();

      const trasladoRp = qr.manager.getRepository(SolicitudTrasladoOrm);

      const usuarioRp = qr.manager.getRepository(UsuarioOrm);

      const traslado = await trasladoRp.findOne({
        where: { id: body.trasladoId },
        relations: ['asigVehiculo', 'gestion'],
      });

      if (!traslado) {
        throw new Error(
          `La gestion con id ${body.trasladoId} no fue encontrada, intentelo nuevamente`
        );
      }

      if (traslado.estado === CANCELADA.getCode()) {
        throw new Error('Este traslado fue CANCELADO, por favor actualiza la pagina');
      }

      if (!traslado.asigVehiculo) {
        throw new Error(`La solicitud con ${traslado.id} no se encuentra asignada`);
      }

      if (body.estadoCode === traslado.estado) {
        throw new Error(
          `El traslado ya fue ${estadoTrasladoTypeFactory(
            traslado.estado
          ).getForHumans()} por favor actualice la pagina`
        );
      }

      const newSignos = new SignoVitalOrm();

      if (body.signosVitales) {
        const signoRp = qr.manager.getRepository(SignoVitalOrm);

        body.signosVitales.forEach(signo => {
          const code = signoVitalesTypeFactory(signo.signoCode as any).getCode();
          SIGNOS_VISTALES_VALUES.forEach(value => {
            if (value.getCode() === code) {
              newSignos[`${value.getForHumans().toLowerCase()}`] =
                code === SIGNOS_VISTALES.TA.getCode()
                  ? `${signo.cantidad}/${signo.ta}`
                  : signo.cantidad;
            }
          });
        });

        newSignos.createdAt = new Date();

        newSignos.usuarioId = usuarioId;

        newSignos.iniciadoPorCentro = this.auth.context.getNumericCode();

        newSignos.observacion = body.observacion;

        await signoRp.save(newSignos);

        traslado.signoVitalId = newSignos.id;

        traslado.fechaInicioTraslado = new Date();

        traslado.estado = ESTADOS_TRASLADO.INICIADO.getCode();
      }

      if (body.recibido) {
        const ekConn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);

        const empleadoRp = ekConn.manager.getRepository(EkEmpleadoOrm);

        const empleado = await empleadoRp.findOne({
          where: [{ documento: body.recibido.documento }],
        });

        const newEmpleado = new EkEmpleadoOrm();

        if (!empleado) {
          const usuario = await usuarioRp.findOne({ where: { cedula: body.recibido.documento } });

          if (usuario) {
            // newEmpleado.usuarioId = usuario.id;
            newEmpleado.nombre = usuario.nombreCompleto;
            newEmpleado.documento = usuario.cedula;
            newEmpleado.tipoCode = body.recibido.tipoEmpleadoCode as any;
            // newEmpleado.creadoPorId = usuarioId;
            //newEmpleado.fechaCreacion = new Date();
          } else {
            newEmpleado.nombre = body.recibido.nombre;
            newEmpleado.documento = body.recibido.documento;
            newEmpleado.tipoCode = body.recibido.tipoEmpleadoCode as any;
            // newEmpleado.creadoPorId = usuarioId;
            //newEmpleado.fechaCreacion = new Date();
          }
          await empleadoRp.save(newEmpleado);
        }

        if (empleado && empleado.tipoCode !== body.recibido.tipoEmpleadoCode) {
          const tipo = tipoProfesionalTypeFactory(empleado.tipoCode as any);
          let otroTipoUsuario = null;
          if (!tipo) otroTipoUsuario = tipoEmpleadoTypeFactory(empleado.tipoCode as any);
          throw new Error(
            `El usuario ingresado no es un ${tipoProfesionalTypeFactory(
              body.recibido.tipoEmpleadoCode as any
            ).getForHumans()} porque está resgistrado como ${
              tipo ? tipo.getForHumans() : otroTipoUsuario.getForHumans()
            }.`
          );
        }

        traslado.finalizadoPorId = usuarioId;
        traslado.recibidoPorId = empleado ? empleado.id : newEmpleado.id;
        traslado.finalizadObservacion = body.observacion;
        traslado.fechaFinTraslado = new Date();
        traslado.nitInstitucion = body.recibido.institucion.nit;
        traslado.nombreInstitucion = body.recibido.institucion.nombre;
        traslado.estado = ESTADOS_TRASLADO.FINALIZADO.getCode();
        traslado.finalizadoPorCentro = this.auth.context.getNumericCode();
      }
      await trasladoRp.save(traslado);

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }

  public async addNota(nota: CreateNotaDto) {
    const usuarioId = this.auth.user.id;

    const conn = this.dynamicConn(gcmContextFactory(nota.contextoCode));

    const qr = conn.createQueryRunner();

    try {
      await qr.connect();

      await qr.startTransaction();

      const gestionRp = qr.manager.getRepository(NotaOrm);

      const solicitudRp = qr.manager.getRepository(SolicitudTrasladoOrm);

      const trasladoExiste = await solicitudRp.findOne({ where: { id: nota.trasladoId } });

      if (!trasladoExiste) {
        throw new Error(
          `No se encuentra traslado con ID ${nota.trasladoId} por favor intentelo nuevamento.`
        );
      }

      if (trasladoExiste.estado !== ESTADOS_TRASLADO.INICIADO.getCode()) {
        const option = estadoTrasladoTypeFactory(trasladoExiste.estado);
        const estado = [ESTADOS_TRASLADO.ASIGNADO, ESTADOS_TRASLADO.PENDIENTE].indexOf(option) > 0;
        const mgs = estado ? 'no a sido' : 'fue';
        throw new Error(
          `No se puedes agregar esta nota, por que el traslado ${mgs} ${option.getForHumans()}, por favor actualiza.`
        );
      }

      const newNota = new NotaOrm();
      newNota.solicitudTrasladoId = nota.trasladoId;
      newNota.nota = nota.nota.toUpperCase();
      newNota.tipoProfesional = nota.tipo;
      newNota.usuarioId = usuarioId;
      newNota.fecha = new Date();
      newNota.usuarioCentro = this.auth.context.getNumericCode();

      await gestionRp.save(newNota);

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }

  public async cancelar(body: CancelarDto) {
    const usuarioId = this.auth.user.id;

    const conn = this.dynamicConn(gcmContextFactory(body.contextoCode));

    const qr = conn.createQueryRunner();

    try {
      await qr.connect();
      await qr.startTransaction();

      const solicitudRp = qr.manager.getRepository(SolicitudTrasladoOrm);

      const trasladoExiste = await solicitudRp.findOne({ where: { id: body.trasladoId } });

      if (!trasladoExiste) {
        throw new Error(
          `No se encuentra traslado con ID ${body.trasladoId} por favor intentelo nuevamento.`
        );
      }

      if (trasladoExiste.canceladoPorId) {
        throw new Error(`El traslado con id ${body.trasladoId} ya se encuentra cancelado.`);
      }

      if (trasladoExiste.fechaInicioTraslado || trasladoExiste.fechaFinTraslado) {
        throw new Error(`Este traslado no puede ser CANCELADO por que ya se encuentra iniciado`);
      }

      trasladoExiste.canceladoPorId = usuarioId;
      trasladoExiste.fechaCancelacion = new Date();
      trasladoExiste.cancObservacion = body.obs.toUpperCase();
      /*  trasladoExiste.tipoProfesional = body.tipo; */
      trasladoExiste.estado = ESTADOS_TRASLADO.CANCELADO.getCode();
      trasladoExiste.canceladoPorCentro = this.auth.context.getNumericCode();

      await solicitudRp.save(trasladoExiste);

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }

  /* ------------------------------------------------- */

  public async oldAsignar(body: AsignacionVehiculoDto) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const gestionRp = this.qr.manager.getRepository(GestionOrm);

      const gestion = await gestionRp.findOne({
        where: { id: body.gestionId },
        relations: ['solicitudAmbulancia'],
      });

      if (!gestion) {
        throw new Error(
          `La gestion con id ${body.gestionId} no fue encontrada, intentelo nuevamente`
        );
      }

      const solicitudTrasladoRp = this.qr.manager.getRepository(SolicitudTrasladoOrm);

      const solicitudTraslado = await solicitudTrasladoRp.findOne({
        where: { gestionId: body.gestionId },
      });

      if (!gestion.solicitudAmbulancia || !solicitudTraslado) {
        throw new Error(`Esta gestión no cuenta con solicitud de traslado`);
      }

      if (!gestion.solicitudAmbulancia.id !== !solicitudTraslado.id) {
        throw new Error(`La solicitud de traslado no le pertenece a esta gestión`);
      }

      if (gestion.state !== TIPOS_ESTADO_VITAL.ASIGNADA.getCode()) {
        throw new Error(`Esta gestión no está en estado ASIGNADA, no puede ser gestionada`);
      }

      const empleadoRp = this.qr.manager.getRepository(EmpleadoOrm);
      const usuarioRp = this.qr.manager.getRepository(UsuarioOrm);

      let conductor = await empleadoRp.findOne({
        where: body.conductorId
          ? { usuarioId: body.conductorId }
          : { documento: body.docConductor },
        relations: ['usuario'],
      });

      let medico = await empleadoRp.findOne({
        where: body.medicoId ? { usuarioId: body.medicoId } : { documento: body.docMedico },
        relations: ['usuario'],
      });

      let auxiliar = await empleadoRp.findOne({
        where: body.auxiliarId ? { usuarioId: body.auxiliarId } : { documento: body.docAuxiliar },
        relations: ['usuario'],
      });

      let existeConductor = conductor ? true : false,
        existeMedico = medico ? true : false,
        existeAuxiliar = auxiliar ? true : false;

      if (body.medicoId && !existeMedico) {
        const medicoFromUsuario = await usuarioRp.findOne({ where: { id: body.medicoId } });
        if (medicoFromUsuario) {
          const newMedico = new EmpleadoOrm();
          newMedico.usuarioId = medicoFromUsuario.id;
          newMedico.tipoEmpleadoCode = 1;
          medico = await empleadoRp.save(newMedico);
          medico.usuario = medicoFromUsuario;
          existeMedico = true;
        } else {
          throw new Error('No existe medico con este id');
        }
      }

      if (!body.medicoId && !existeMedico) {
        if (!body.docMedico || !body.nombreMedico) {
          throw new Error('Necesita mas información del medico');
        }
        const newMedico = new EmpleadoOrm();
        newMedico.tipoEmpleadoCode = 1;
        newMedico.documento = body.docMedico;
        newMedico.nombre = body.nombreMedico;
        medico = await empleadoRp.save(newMedico);
        existeMedico = true;
      }

      if (body.auxiliarId && !existeAuxiliar) {
        const auxiliarFromUsuario = await usuarioRp.findOne({ where: { id: body.auxiliarId } });
        if (auxiliarFromUsuario) {
          const newAuxiliar = new EmpleadoOrm();
          newAuxiliar.usuarioId = auxiliarFromUsuario.id;
          newAuxiliar.tipoEmpleadoCode = 2;
          auxiliar = await empleadoRp.save(newAuxiliar);
          auxiliar.usuario = auxiliarFromUsuario;
          existeAuxiliar = true;
        } else throw new Error('No existe auxiliar con este id');
      }

      if (!body.auxiliarId && !existeAuxiliar) {
        if (!body.docAuxiliar || !body.nombreAuxiliar) {
          throw new Error('Necesita mas información del auxiliar');
        }
        const newAuxiliar = new EmpleadoOrm();
        newAuxiliar.documento = body.docAuxiliar;
        newAuxiliar.nombre = body.nombreAuxiliar;
        newAuxiliar.tipoEmpleadoCode = 2;
        auxiliar = await empleadoRp.save(newAuxiliar);
        existeAuxiliar = true;
      }

      if (body.conductorId && !existeConductor) {
        const conductorFromUsuario = await usuarioRp.findOne({ where: { id: body.conductorId } });
        if (conductorFromUsuario) {
          const newConductor = new EmpleadoOrm();
          newConductor.usuarioId = conductorFromUsuario.id;
          newConductor.tipoEmpleadoCode = 3;
          conductor = await empleadoRp.save(newConductor);
          conductor.usuario = conductorFromUsuario;
          existeConductor = true;
        } else {
          throw new Error('No existe conductor con este id');
        }
      }

      if (!body.conductorId && !existeConductor) {
        if (!body.docConductor || !body.nombreConductor) {
          throw new Error('Necesita mas información del conductor');
        }
        const newConductor = new EmpleadoOrm();
        newConductor.documento = body.docConductor;
        newConductor.nombre = body.nombreConductor;
        newConductor.tipoEmpleadoCode = 3;
        conductor = await empleadoRp.save(newConductor);
        existeConductor = true;
      }

      gestion.state = TIPOS_ESTADO_VITAL.EN_PROCESO.getCode();
      gestion.inProcessAt = new Date();
      gestion.inProcessBy = this.auth.user.id;

      gestion.solicitudAmbulancia.medicoId = medico.id;
      //gestion.solicitudAmbulancia.auxiliarId = auxiliar.id;
      //gestion.solicitudAmbulancia.conductorId = conductor.id;

      //gestion.solicitudAmbulancia.vehiculoId = body.vehiculo;
      gestion.solicitudAmbulancia.nombreAcompanante = body.acompanante;
      gestion.solicitudAmbulancia.documentoAcompanante = body.docAcompanante;
      gestion.solicitudAmbulancia.observacionCompletado = body.observacion;

      await solicitudTrasladoRp.save(gestion.solicitudAmbulancia);

      await gestionRp.save(gestion);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await this.qr.release();
    }
  }
}
