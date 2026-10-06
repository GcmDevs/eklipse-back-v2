import { BadRequestException, Injectable } from '@nestjs/common';
import { dataToNewGestion, dataToNewSolicitudTraslado } from '../factories';
import { SolicitudTrasladoOrm } from '../orm/solicitud-traslado.orm';
import {
  MotivoCancelacionTrasladoType,
  MotivoCancelacionType,
  SIGNOS_VISTALES_VALUES,
  SignoVitalType,
  TIPOS_TRASLADO,
  motivoCancelacionTrasladoTypeFactory,
  motivoCancelacionTypeFactory,
} from '@hpn/gestion-clinica/v1/domain/types';
import { EkEmpleadoOrm, MotivoTrasladoOrm, ServicioOrm, VehiculoOrm } from '../orm';
import { In, IsNull, Not } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import { CancelarGestionDto, CreateGestionDto } from '../../presentation/dtos';
import { UsuarioOrm } from '@hpn/old/orm/general';
import { UserStatusCode } from '@hpn/old/types/general';
import {
  addAbreviacionByCentro,
  GCM_CONTEXTS,
  GCM_CONTEXTS_VALUES,
  GcmContextCode,
  gcmContextFactory,
  GcmContextType,
} from '@common/domain/types';
import {
  GCM_HCN_GTC_CONTEXTOS,
  tercerosGCMbyCentro,
} from 'hpn/older-apps/gestion-clinica/v2/gestion-clinica.queries';
import { cloneDeep, uniq } from 'lodash';
import { groupByKey } from '@lgc/die/presentation/helpers';
import { GestionOrm } from '@hpn/gestion-clinica/v1/infrastructure/orm/gestion.orm';

@Injectable()
export class CreateGestionService extends BaseSource {
  public async fetchUsuarios(status: UserStatusCode[]): Promise<UsuarioOrm[]> {
    try {
      const repository = this.conn.getRepository(UsuarioOrm);
      const usuarios: UsuarioOrm[] = [];

      for (let i = 0; i < status.length; i++) {
        const result = await repository.find({
          where: { status: status[i] },
          select: ['id', 'nombreCompleto', 'status', 'cedula'],
          relations: ['rol'],
        });
        usuarios.push(...result);
      }

      usuarios.map(u => {
        u.username = u.cedula;
        delete u.cedula;
      });

      return usuarios;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetch(placa: string) {
    try {
      const ekConn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);

      const traslados: SolicitudTrasladoOrm[] = [];

      const sharedEntidadRp = ekConn.getRepository(EkEmpleadoOrm);
      const sharedVehiculoRp = ekConn.getRepository(VehiculoOrm);

      let miTerceroEnOtroCentro: string[] = [];

      if (this.auth.context === GCM_CONTEXTS.ALTACENTRO) {
        miTerceroEnOtroCentro.push(tercerosGCMbyCentro(this.auth.context, 1, 2)[0].documento);
        miTerceroEnOtroCentro.push(tercerosGCMbyCentro(this.auth.context, 2, 2)[0].documento);
      } else {
        miTerceroEnOtroCentro.push(tercerosGCMbyCentro(this.auth.context, 0, 2)[0].documento);
      }

      const usuariosBBDDExterna: {
        usuarioId: number;
        contextoCode: GcmContextCode;
        contexto: GcmContextType;
      }[] = [];

      for (let index = 0; index < GCM_HCN_GTC_CONTEXTOS.length; index++) {
        const element = GCM_HCN_GTC_CONTEXTOS[index];
        const qr = this.dynamicQR(element);
        await qr.connect();

        try {
          const solicitudesRp = qr.manager.getRepository(SolicitudTrasladoOrm);

          const solicitudes = await solicitudesRp.find({
            where: [
              {
                asigVehiculoId: Not(IsNull()),
                gestion: { state: In([1, 2]) },
              },
            ],
            relations: [
              'gestion',
              'gestion.paciente',
              'gestion.ingreso',
              'gestion.ingreso.cama',
              'gestion.ingreso.cama.subgrupo',
              'gestion.ingreso.contrato',
              'municipioOrigen',
              'municipioOrigen.departamento',
              'deptoOrigen',
              'municipioDestino',
              'municipioDestino.departamento',
              'deptoDestino',
              'centroDestino',
              'centroOrigen',
              'centroOrigen.tercero.direccion',
              'centroDestino.tercero.direccion',
              'motivoTraslado',
              'asigVehiculo',
              'observaciones',
              'servicioDestino',
              'signoVital',
            ],
          });

          const vehiculosIds: number[] = [];
          const entidadesIds: number[] = [];

          const ekPlacaVehiculo = await sharedVehiculoRp.findOne({ where: { placa } });

          if (!ekPlacaVehiculo) throw new Error('No existe esta placa');

          const solicitudesPorPlaca = solicitudes.filter(soli => {
            if (ekPlacaVehiculo && soli.asigVehiculo.vehiculoId === ekPlacaVehiculo.id) {
              soli.asigVehiculo.vehiculo = ekPlacaVehiculo;
              soli.vehiculo = ekPlacaVehiculo.placa;
              return true;
            }
            return false;
          });

          solicitudesPorPlaca.map(value => {
            (value as any).contexto = element;
            (value as any).codigo = addAbreviacionByCentro(
              element,
              value.id,
              value.gestion.ingreso.centroId
            );

            if (value.medicoId) entidadesIds.push(value.medicoId);
            if (value.asigVehiculo && value.asigVehiculo.vehiculoId) {
              vehiculosIds.push(value.asigVehiculo.vehiculoId);
            }
            if (value.asigVehiculo && value.asigVehiculo.auxiliarId) {
              entidadesIds.push(value.asigVehiculo.auxiliarId);
            }
            if (value.asigVehiculo && value.asigVehiculo.conductorId) {
              entidadesIds.push(value.asigVehiculo.conductorId);
            }

            delete value.empleados;
            if (value.asigVehiculo) delete value.asigVehiculo.empleados;

            value.gestion.paciente.documento;

            value.gestion.paciente.nombreCompleto;

            const data = [
              'asigVehiculoId',
              'usuario',
              'usuarioId',
              'tipoEmpleadoCode',
              'isUsuario',
              'auxiliar',
            ];

            if (value.asigVehiculo.auxiliar) {
              if (value.asigVehiculo.auxiliar.usuarioId) {
                value.asigVehiculo.auxiliar.nombre =
                  value.asigVehiculo.auxiliar.usuario.nombreCompleto;
                value.asigVehiculo.auxiliar.documento = value.asigVehiculo.auxiliar.usuario.cedula;
              }
              data.forEach(el => delete value.asigVehiculo.auxiliar[el]);
              delete value.auxiliar;
            }

            if (value.asigVehiculo.conductor) {
              if (value.asigVehiculo.conductor.usuarioId) {
                value.asigVehiculo.conductor.nombre =
                  value.asigVehiculo.conductor.usuario.nombreCompleto;
                value.asigVehiculo.conductor.documento =
                  value.asigVehiculo.conductor.usuario.cedula;
              }
              data.forEach(el => delete value.asigVehiculo.conductor[el]);
              delete value.conductor;
            }

            if (value.signoVital) {
              const signos: { key: SignoVitalType; cantidad: string; unidad: string }[] = [];
              SIGNOS_VISTALES_VALUES.forEach(signo => {
                signos.push({
                  key: signo,
                  cantidad: signo.getForHumans().toLowerCase(),
                  unidad: signo.getUnidadMedidas(),
                });
              });

              signos.forEach(signo => {
                value.signoVital.set(signo.key, value.signoVital[signo.cantidad], signo.unidad);
                delete value.signoVital[signo.cantidad];
              });
            }

            if (value.recibidoPorId) entidadesIds.push(value.recibidoPorId);
          });

          const entidades = await sharedEntidadRp.find({ where: { id: In(uniq(entidadesIds)) } });

          solicitudesPorPlaca.map(t => {
            if (t.medicoId) {
              const medico = cloneDeep(entidades).filter(e => e.id === t.medicoId);
              if (medico.length) {
                t.medico = medico[0];
                delete t.medico.id;
                delete t.medico.isUsuario;
                delete t.medico.tipoCode;
              }
            }

            if (t.asigVehiculo && t.asigVehiculo.auxiliarId) {
              const auxiliar = cloneDeep(entidades).filter(e => e.id === t.asigVehiculo.auxiliarId);
              if (auxiliar.length) {
                t.asigVehiculo.auxiliar = auxiliar[0];
                delete t.asigVehiculo.auxiliar.id;
                delete t.asigVehiculo.auxiliar.isUsuario;
                delete t.asigVehiculo.auxiliar.tipoCode;
              }

              if (t.asigVehiculo && t.asigVehiculo.conductorId) {
                const conductor = cloneDeep(entidades).filter(
                  e => e.id === t.asigVehiculo.conductorId
                );
                if (conductor.length) {
                  t.asigVehiculo.conductor = conductor[0];
                  delete t.asigVehiculo.conductor.id;
                  delete t.asigVehiculo.conductor.isUsuario;
                  delete t.asigVehiculo.conductor.tipoCode;
                }
              }

              if (t.asigVehiculo && t.asigVehiculo.vehiculoId) {
                if (ekPlacaVehiculo) {
                  t.asigVehiculo.vehiculo = ekPlacaVehiculo;
                  t.vehiculo = ekPlacaVehiculo.placa;
                }
              }
            }

            if (t.observaciones.length > 0) {
              t.observaciones.forEach(obs => {
                if (obs.usuarioCentro) {
                  const ctx = GCM_CONTEXTS_VALUES.filter(
                    c => c.getNumericCode() === obs.usuarioCentro
                  )[0];
                  const dt = {
                    usuarioId: obs.usuarioId,
                    contexto: ctx,
                    contextoCode: ctx.getCode(),
                  };

                  usuariosBBDDExterna.push(dt);
                }
              });
            }

            if (t.recibidoPorId) {
              const recibido = cloneDeep(entidades).filter(e => e.id === t.recibidoPorId)[0];
              if (recibido) {
                t.recibidoPor = new EkEmpleadoOrm();
                t.recibidoPor.nombre = recibido.nombre;
                t.recibidoPor.documento = recibido.documento;
                t.recibidoPor.tipoCode = recibido.tipoCode;
              }
            }
          });

          const trasladosCloneDeep = cloneDeep(solicitudesPorPlaca);

          if (this.auth.context === element) {
            traslados.push(...trasladosCloneDeep);
          } else {
            const relacionadoConMiClinica: any[] = [];
            trasladosCloneDeep.forEach(r => {
              if (r.centroDestino) {
                if (miTerceroEnOtroCentro.indexOf(`${r.centroDestino.tercero.documento}`) >= 0) {
                  relacionadoConMiClinica.push(r);
                }
              }
            });

            traslados.push(...relacionadoConMiClinica);
          }
          const usuariosBBDDGrouped = groupByKey(usuariosBBDDExterna, 'contextoCode');

          const usuarios: UsuarioOrm[] = [];

          for (let index = 0; index < usuariosBBDDGrouped.length; index++) {
            const element = usuariosBBDDGrouped[index];
            const ctx = gcmContextFactory(element.key);
            const qr = this.dynamicQR(ctx);
            await qr.connect();

            try {
              const usuarioRp = qr.manager.getRepository(UsuarioOrm);
              const usuariosTemp = await usuarioRp.find({
                where: { id: In(element.rows.map(r => r.usuarioId)) },
              });

              usuariosTemp.map(u => {
                u.contexto = ctx;
              });

              usuarios.push(...usuariosTemp);
            } catch (error) {
              throw new Error(error.message);
            } finally {
              await qr.release();
            }
          }

          traslados.map(r => {
            r.observaciones.map(obs => {
              if (obs.usuarioId && obs.usuarioCentro) {
                const u = usuarios.filter(
                  u => u.contexto.getNumericCode() === obs.usuarioCentro && u.id === obs.usuarioId
                );
                if (u.length) {
                  obs.usuario = new UsuarioOrm();
                  obs.usuario.nombreCompleto = u[0].nombreCompleto;
                  obs.usuario.cedula = u[0].cedula;
                  obs.usuario.contexto = u[0].contexto;
                }
              }
            });
          });
        } catch (error) {
          throw new Error(error.message);
        } finally {
          await qr.release();
        }
      }

      /*  {
              auxiliar: [
                {
                  documento: usuario.cedula,
                },
                {
                  usuario: {
                    cedula: usuario.cedula,
                  },
                },
              ],
            },
            {
              conductor: [
                {
                  documento: usuario.cedula,
                },
                {
                  usuario: {
                    cedula: usuario.cedula,
                  },
                },
              ],
            }, */

      // console.log("value",solicitudes);

      //    console.log(traslados.length);

      return traslados;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async createGestion(body: CreateGestionDto) {
    try {
      await this.qr.connect();

      await this.qr.startTransaction();

      const gestionRp = this.qr.manager.getRepository(GestionOrm);

      const newGestion = dataToNewGestion(body, this.auth.user.id);

      const gestion = await gestionRp.save(newGestion);

      if (body.solicitudAmbulancia) {
        const solicitudTrasladoRp = this.qr.manager.getRepository(SolicitudTrasladoOrm);

        const solicitudTrasladoExiste = await solicitudTrasladoRp.findOne({
          where: { gestionId: gestion.id },
        });

        if (solicitudTrasladoExiste) {
          throw new Error('Ya existe una solicitud de traslado para esta gestión');
        }

        if (body.solicitudAmbulancia.motTraslado.id === 0) {
          const motTrasladoRp = this.qr.manager.getRepository(MotivoTrasladoOrm);

          const pattern = body.solicitudAmbulancia.motTraslado.nombre;

          const motivoTraslado = await motTrasladoRp.findOne({
            where: { nombre: pattern },
          });

          if (motivoTraslado) {
            throw new Error('Ya existe un motivo de traslado con este nombre');
          }

          const newMotivoTraslado = new MotivoTrasladoOrm();

          newMotivoTraslado.nombre = pattern;

          const saveTraslado = await motTrasladoRp.save(newMotivoTraslado);

          body.solicitudAmbulancia.motTraslado = saveTraslado;
        }
        if (body.solicitudAmbulancia.servicioDestino) {
          if (body.solicitudAmbulancia.servicioDestino.id === 0) {
            const servicioDestinoRp = this.qr.manager.getRepository(ServicioOrm);

            const pattern = body.solicitudAmbulancia.servicioDestino.nombre;

            const servicioDestino = await servicioDestinoRp.findOne({
              where: { nombre: pattern },
            });

            if (servicioDestino) {
              throw new Error('Ya existe un servicio con este nombre');
            }

            const newServicio = new ServicioOrm();

            newServicio.nombre = pattern;
            const saveServicio = await servicioDestinoRp.save(newServicio);

            body.solicitudAmbulancia.servicioDestino = saveServicio;
          }
        }

        const solicitudTrasldo = dataToNewSolicitudTraslado(body.solicitudAmbulancia, gestion);

        const traslado = await solicitudTrasladoRp.save(solicitudTrasldo);

        if (body.solicitudAmbulancia.tipoTraslado === TIPOS_TRASLADO.REDONDO.getCode()) {
          const traslodRedondo = dataToNewSolicitudTraslado(
            body.solicitudAmbulancia,
            gestion,
            true
          );
          await solicitudTrasladoRp.save(traslodRedondo);
        }
      }

      await this.qr.commitTransaction();
      return gestion;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await this.qr.release();
    }
  }

  public async cancelar(body: CancelarGestionDto) {
    const conn = body.contextoCode
      ? this.dynamicConn(gcmContextFactory(body.contextoCode))
      : this.conn;

    const qr = conn.createQueryRunner();

    try {
      await qr.connect();

      await qr.startTransaction();

      const gestionRp = qr.manager.getRepository(GestionOrm);

      const gestion = await gestionRp.findOne({
        where: { id: body.gestionId, area: body.areaId },
      });

      if (!gestion) {
        throw new Error(
          `La gestion con id ${body.gestionId} no fue encontrada, por favor intentelo nuevamente`
        );
      }

      if (gestion.canceladoPorId) {
        throw new Error(`Esta gestion con id ${body.gestionId} ya se encuentra cancelada.`);
      }

      if (gestion.state !== 1) {
        throw new Error(
          `Esta gestion no puede ser cancelada, porque ya se encuentra en seguimiento.`
        );
      }

      let motivoT: MotivoCancelacionTrasladoType;
      let motivoN: MotivoCancelacionType;

      if (body.isTipoGestion === 2) {
        motivoT = motivoCancelacionTrasladoTypeFactory(body.motivoCancelacionTCode);
        if (!motivoT) throw new Error('Este motivo de cancelación no es valido');
      }

      if (body.isTipoGestion === 1) {
        motivoN = motivoCancelacionTypeFactory(body.motivoCancelacionNCode);
        if (!motivoN) throw new Error('Este motivo de cancelación no es valido');
      }

      gestion.canceladoPorId = this.auth.user.id;

      gestion.tipoGestion = body.isTipoGestion === 1 ? 1 : 2;
      gestion.motivoCancelacion = body.isTipoGestion === 2 ? motivoT.getCode() : motivoN.getCode();
      gestion.fechaCancelacion = new Date();
      gestion.centroCancelacion = this.auth.context.getNumericCode();
      gestion.observacionCance = body.observacion.toUpperCase();
      gestion.state = 4;

      const updateGestion = await gestionRp.save(gestion);

      await qr.commitTransaction();
      return updateGestion;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }
}
