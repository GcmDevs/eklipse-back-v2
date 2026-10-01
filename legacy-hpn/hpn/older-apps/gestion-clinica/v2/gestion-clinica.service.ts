import { Injectable, BadRequestException } from '@nestjs/common';
import { IMPORTANCIA_SUGGESTIONS } from './enums/importancia.enum';
import { Estado, ESTADO_SUGGESTIONS } from './enums/estado.enum';
import { UsuarioAreaOrm } from './entities/usuario-area.entity';
import { dataToUsuarioArea } from './factories/usuario-area.factory';
import { CreateManagementDto, ReasignarDto } from './dtos/management.dto';
import { dataToNewGestion } from './factories/gestion.factory';
import { TIPO_GESTION_SUGGESTIONS, TipoGestion } from './enums/tipo-gestion.enum';
import { json, jsonFromApi } from './experimental/compare';
import { ReasignarOrm } from './entities/reasignar.entity';
import { BaseSource } from '@common/infrastructure/services';
import {
  EkEmpleadoOrm,
  EntidadOrm,
  SolicitudTrasladoOrm,
  VehiculoOrm,
} from '../v1/infrastructure/orm';
import { SIGNOS_VISTALES_VALUES, SignoVitalType } from '../v1/domain/types';
import {
  addAbreviacionByCentro,
  GCM_CONTEXTS,
  GcmContextCode,
  gcmContextFactory,
} from '@common/domain/types';
import {
  fetchGestionesClinicas,
  GCM_HCN_GTC_CONTEXTOS,
  GestionI,
  tercerosGCMbyCentro,
} from './gestion-clinica.queries';
import { In } from 'typeorm';
import { cloneDeep, uniq } from 'lodash';
import { groupByKeyExtend } from '@hpn/ori/die/presentation/helpers';
import { UsuarioOrm } from '@hpn/old/orm/general';
import { GestionOrm } from '@hpn/gestion-clinica/v1/infrastructure/orm/gestion.orm';

@Injectable()
export class GestionClinicaService extends BaseSource {
  async reasignar(body: ReasignarDto) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const gestionRp = this.qr.manager.getRepository(GestionOrm);
      const reasignarRp = this.qr.manager.getRepository(ReasignarOrm);
      const gestion = await gestionRp.findOneOrFail({
        where: { id: body.gestionId },
        relations: ['solicitudAmbulancia'],
      });

      if (gestion.state !== 1) {
        throw new Error('Esta gestión ya fue iniciada, no puede ser reasignada');
      }

      const reasignar = await reasignarRp.find({ where: { gestionId: body.gestionId } });

      if (reasignar.length >= 3) {
        throw new Error('Esta gestión ya fue reasignada 3 veces');
      }

      const validTiposGestion = TIPO_GESTION_SUGGESTIONS.map(tg => tg.value);

      if (validTiposGestion.indexOf(body.areaId) < 0) {
        throw new Error('No existe area con este id');
      }

      const newReasignar = new ReasignarOrm();
      newReasignar.gestionId = gestion.id;
      newReasignar.usuarioId = this.auth.user.id;
      newReasignar.ultimaArea = gestion.area;
      newReasignar.observacion = body.observacion;
      newReasignar.createdAt = new Date();

      await reasignarRp.save(newReasignar);

      if (gestion.solicitudAmbulancia) {
        if (!gestion.solicitudAmbulancia.isReasignate) {
          const solicitudTrasladoRp = this.qr.manager.getRepository(SolicitudTrasladoOrm);
          const solictud = await solicitudTrasladoRp.findOne({
            where: { id: gestion.solicitudAmbulancia.id },
          });
          if (solictud) {
            solictud.isReasignate = true;
            solicitudTrasladoRp.save(solictud);
          }
        }
      }

      gestion.area = body.areaId;

      await gestionRp.save(gestion);

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  async exp() {
    const result: jsonFromApi[] = await this.conn.query(
      `SELECT * FROM GCMAGRUPGP2 WHERE CONTRATO = '8018'`
    );

    const res: any[] = [];

    json.map(_2 => {
      const exist = result.filter(_ => _.COD_CUPS === _2.CUPS);

      if (!exist.length) {
        res.push(_2);
      }
    });

    return {
      length: res.length,
      result: res,
    };
  }

  async getEvolutions() {
    try {
      return await this.conn.query(`seguimiento_evolucion_pacientes`);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getEvolutionsByDocumento(documento: string) {
    try {
      return await this.conn.query(`seguimiento_evolucion_pacientes `);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async fetchBySubgrupo(subgrupo: string) {
    try {
      return await this.conn.query(
        `SELECT
      HPNESTANC estanciaId,
      ADNINGRESO ingresoId,
      AINCONSEC ingresoConsecutivo,
      AINFECING fechaIngreso, 
      GPANOMPAC nombrePaciente,
      GPAEDAPAC edadPaciente,
      GPATELEFO telefonoPaciente,
      ACACODIGO codigoCentro,
      ACANOMBRE nombreCentro
      FROM GCVHOSCENPAC
      WHERE  (HESFECSAL IS NULL) AND (HCAESTADO < 3) AND HSUCODIGO = @0`,
        [subgrupo]
      );
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async fechasSalidas(inicio: Date, final: Date) {
    try {
      const result1 = await this.conn.query(
        `SELECT
        INGRESO,
        OID_INGRESO,
        CONS.FECHREGISTRO,
        FECHA_ESPECIALISTA,
        FECHA_MEDICO_GENERAL,
        FECHA_EPICIRISIS,
        FECHA_EGRESO,
        FECHA_SALIDA,
        CEDULA,
        PACIENTE,
        CAMA
        FROM INDICADORES_TIEMPOS_EGRESO
                LEFT JOIN (
                        SELECT
                    AINCONSEC,
                        FECHREGISTRO
                        FROM GCMHPNREGSALIDA
                        ) CONS ON CONS.AINCONSEC = INDICADORES_TIEMPOS_EGRESO.INGRESO
                WHERE CONVERT(DATE, FECHA_ESPECIALISTA, 103) BETWEEN  @0 AND @1
            OR CONVERT(DATE, FECHA_MEDICO_GENERAL, 103) BETWEEN  @0 AND @1
            OR CONVERT(DATE, FECHA_EPICIRISIS, 103) BETWEEN  @0 AND @1
            OR CONVERT(DATE, FECHA_EGRESO, 103) BETWEEN  @0 AND @1
            OR CONVERT(DATE, FECHA_SALIDA, 103) BETWEEN  @0 AND @1`,
        [inicio.toISOString().split('T')[0], final.toISOString().split('T')[0]]
      );
      return result1;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async gestionesPorPaciente(paciente: number, consecutivo: number) {
    const ekConn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);
    const repo = this.conn.getRepository(GestionOrm);
    const response = await repo.find({
      where: [{ patient: paciente }, { consecutive: consecutivo }],
      relations: [
        'solicitudAmbulancia.centroOrigen',
        'solicitudAmbulancia.centroOrigen.tercero',
        'solicitudAmbulancia.centroOrigen.tercero.direccion',
        'solicitudAmbulancia.deptoOrigen',
        'solicitudAmbulancia.municipioOrigen',
        'solicitudAmbulancia.centroDestino',
        'solicitudAmbulancia.centroDestino.tercero',
        'solicitudAmbulancia.centroDestino.tercero.direccion',
        'solicitudAmbulancia.deptoDestino',
        'solicitudAmbulancia.municipioDestino',
        'usuario',
        'solicitudAmbulancia.motivoTraslado',
        'solicitudAmbulancia.servicioDestino',
        //'solicitudAmbulancia.asigVehiculo.conductor',
        //'solicitudAmbulancia.medico',
        //'solicitudAmbulancia.medico.usuario',
        //'solicitudAmbulancia.asigVehiculo.auxiliar',
        //'solicitudAmbulancia.asigVehiculo.conductor.usuario',
        //'solicitudAmbulancia.asigVehiculo.auxiliar.usuario',
        'solicitudAmbulancia.observaciones',
      ],
    });

    const vehiculosIds: number[] = [];
    const entidadesIds: number[] = [];

    response.map(el => {
      if (el.solicitudAmbulancia) {
        if (!el.solicitudAmbulancia.centroOrigenId) {
          const newEntidadOrigen: EntidadOrm = {
            id: 1,
            nombre: el.solicitudAmbulancia.luagarOrigenNombre,
            tercero: null,
            terceroId: null,
          };
          el.solicitudAmbulancia.centroOrigen = el.solicitudAmbulancia.centroOrigenId
            ? el.solicitudAmbulancia.centroOrigen
            : newEntidadOrigen;
        } else {
          el.solicitudAmbulancia.direccionOrigen =
            el.solicitudAmbulancia.centroOrigen.tercero.direccion.direccion;
        }
        if (!el.solicitudAmbulancia.centroDestinoId) {
          const newEntidadDestino: EntidadOrm = {
            id: 2,
            nombre: el.solicitudAmbulancia.luagarDestinoNombre,
            tercero: null,
            terceroId: null,
          };
          el.solicitudAmbulancia.centroDestino = el.solicitudAmbulancia.centroDestinoId
            ? el.solicitudAmbulancia.centroDestino
            : newEntidadDestino;
        } else {
          el.solicitudAmbulancia.direccionDestino =
            el.solicitudAmbulancia.centroDestino.tercero.direccion.direccion;
        }

        if (el.solicitudAmbulancia.asigVehiculo && el.solicitudAmbulancia.asigVehiculo.vehiculoId) {
          vehiculosIds.push(el.solicitudAmbulancia.asigVehiculo.vehiculoId);
        }

        if (el.solicitudAmbulancia && el.solicitudAmbulancia.medicoId) {
          entidadesIds.push(el.solicitudAmbulancia.medicoId);
        }

        if (el.solicitudAmbulancia.asigVehiculo && el.solicitudAmbulancia.asigVehiculo.auxiliarId) {
          entidadesIds.push(el.solicitudAmbulancia.asigVehiculo.auxiliarId);
        }
      }

      if (el.usuario) {
        delete el.usuario.id;
        delete el.usuario.password;
        delete el.usuario.rol;
        delete el.usuario.status;
      }
    });

    const sharedEntidadRp = ekConn.getRepository(EkEmpleadoOrm);
    const sharedVehiculoRp = ekConn.getRepository(VehiculoOrm);

    const vehiculos = await sharedVehiculoRp.find({ where: { id: In(uniq(vehiculosIds)) } });
    const entidades = await sharedEntidadRp.find({ where: { id: In(uniq(entidadesIds)) } });

    response.map(r => {
      const t = r.solicitudAmbulancia;
      if (t) {
        if (t.medicoId) {
          const medico = entidades.filter(e => e.id === r.solicitudAmbulancia.medicoId);
          if (medico.length) {
            r.solicitudAmbulancia.medico = medico[0];
            delete r.solicitudAmbulancia.medico.id;
          }
        }

        if (t.asigVehiculo && t.asigVehiculo.auxiliarId) {
          const auxiliar = entidades.filter(e => e.id === t.asigVehiculo.auxiliarId);
          if (auxiliar.length) {
            t.auxiliar = auxiliar[0];
            delete t.auxiliar.id;
          }
        }
        if (t.asigVehiculo && t.asigVehiculo.conductorId) {
          const conductor = entidades.filter(e => e.id === t.asigVehiculo.conductorId);
          if (conductor.length) {
            t.conductor = conductor[0];
            delete t.conductor.id;
          }
        }
        if (t.asigVehiculo && t.asigVehiculo.vehiculoId) {
          const vehiculo = vehiculos.filter(e => e.id === t.asigVehiculo.vehiculoId);
          if (vehiculo.length) {
            t.asigVehiculo.vehiculo = vehiculo[0];
            t.vehiculo = vehiculo[0].placa;
          }
        }
      }
    });

    return response;
  }

  async getSuggestions() {
    try {
      return {
        priority: IMPORTANCIA_SUGGESTIONS,
        areas: TIPO_GESTION_SUGGESTIONS,
        estate: ESTADO_SUGGESTIONS,
        managementTypes: TIPO_GESTION_SUGGESTIONS,
      };
    } catch (error) {
      return null;
    }
  }

  async getDiagnosticos(consecutivo: number) {
    try {
      return this.conn.query(
        `
SELECT
F.OID folio,
F.HCFECFOL fecha,
D.DIACODIGO codigo,
D.DIANOMBRE diagnostico,
DP.HCPDIAPRIN esPrincipal,
ISNULL(DP.HCPOBSERV, 'SIN OBSERVACIONES') observaciones,
MD.USUNOMBRE documentoMedico,
MD.USUDESCRI nombreMedico
FROM ADNINGRESO I
INNER JOIN HCNFOLIO F ON F.ADNINGRESO = I.OID
INNER JOIN HCNDIAPAC DP ON DP.HCNFOLIO = F.OID
INNER JOIN GENDIAGNO D ON DP.GENDIAGNO = D.OID
INNER JOIN GENUSUARIO MD ON F.GENMEDICO = MD.OID
WHERE I.AINCONSEC = @0 ORDER BY F.HCFECFOL DESC
`,
        [consecutivo]
      );
    } catch (error) {
      throw new Error();
    }
  }

  async getPendingInterconsultations(patient: number) {
    try {
      return this.conn.query(`
     SELECT
I.HCNFECFOL date,
I.AINCONSEC consecutive,
I.HCIMOTIVO description,
I.GEEDESCRI speciality,
I.GASNOMBRE serviceArea,
I.HCACODIGO bedCode,
I.HCANOMBRE bedName,
I.HCACODIGO bedGroupCode,
I.HCANOMBRE bedGroupName,
I.HSUCODIGO bedSubgroupCode,
I.HSUNOMBRE bedSubgroupName,
I.ACANOMBRE centerName
FROM GCVHCNINTERC I
WHERE HCNINTERR IS NULL AND AINESTADO = 0 AND HCIREGSUS = 0 AND I.GENPACIEN = ${patient} ORDER BY AINCONSEC`);
    } catch (error) {
      throw new Error();
    }
  }

  async createGestion(body: CreateManagementDto) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const newGestion = dataToNewGestion(body, this.auth.user.id);

      const result = await this.qr.manager.save(GestionOrm, newGestion);

      await this.qr.commitTransaction();

      return result;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await this.qr.release();
    }
  }

  async addUsersToArea(body: { user: number; area: number }[]) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      //const newUsersToArea: UsuarioArea[] = [];

      for (let i = 0; i < body.length; i++) {
        let result: UsuarioAreaOrm;
        const obs = await this.qr.query(
          `select * from GCMHPNGESTUSUAREA where GENUSUARIO = @0 AND AREA = @1`,
          [body[i].user, body[i].area]
        );

        if (!obs[0]) {
          const newObs = dataToUsuarioArea(body[i].area, body[i].user, this.auth.user.id);
          result = await this.qr.manager.save(UsuarioAreaOrm, newObs);
        } else {
          const newUsArea = new UsuarioAreaOrm();
          newUsArea.id = obs[0].OID;
          newUsArea.user = obs[0].GENUSUARIO;
          newUsArea.area = obs[0].AREA;
          newUsArea.createdBy = obs[0].GENUSUREG;
          result = newUsArea;
        }

        // newUsersToArea.push(result);
      }
      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      return new BadRequestException();
    } finally {
      await this.qr.release();
    }
  }

  async removeUsersFromArea(body: { user: number; area: number }[]) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      for (let i = 0; i < body.length; i++) {
        await this.qr.manager
          .createQueryBuilder()
          .delete()
          .from(UsuarioAreaOrm)
          .where('GENUSUARIO = :userId and AREA = :areaId', {
            userId: body[i].user,
            areaId: body[i].area,
          })
          .execute();
      }
      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      return new BadRequestException();
    } finally {
      await this.qr.release();
    }
  }

  async getUserAreas(id?: number) {
    try {
      const user = id ? id : this.auth.user.id;

      const repo = this.conn.getRepository(UsuarioAreaOrm);
      return await repo.find({ where: { user } });
    } catch (error) {
      return new BadRequestException();
    }
  }

  async findManagementsByArea(body: number[]) {
    if (!body.length) body = [0];

    body = body.filter(b => b !== TipoGestion.TRANSLADOS_AMBULANCIA);

    try {
      let conditional = `AREASIGNADA IN(${body}) AND `;

      const hasAllPermissions = body.indexOf(999) >= 0;

      if (hasAllPermissions)
        conditional = `AREASIGNADA NOT IN(${TipoGestion.TRANSLADOS_AMBULANCIA}) AND `;

      const date = this.sumarDias(new Date(), -2).toISOString().split('T')[0];

      const query = fetchGestionesClinicas(conditional);

      const result: any[] = await this.conn.query(query, [date]);

      result.map(value => {
        value.codigo = addAbreviacionByCentro(this.auth.context, value.id, value.centroId);
        value.contexto = this.auth.context;
        value.traslados = [];
      });

      return result;
    } catch (error) {
      return new BadRequestException(error.message);
    }
  }

  async findTrasladosByArea(body: number[]) {
    if (!body.length) body = [0];
    try {
      const ekConn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);

      const sharedEntidadRp = ekConn.getRepository(EkEmpleadoOrm);
      const sharedVehiculoRp = ekConn.getRepository(VehiculoOrm);

      const hasAllPermissions = body.indexOf(999) >= 0;

      body = body.filter(b => b === TipoGestion.TRANSLADOS_AMBULANCIA);
      body.push(0);

      let conditional = `AREASIGNADA IN(${body}) AND `;

      if (hasAllPermissions) {
        conditional = `AREASIGNADA IN(${TipoGestion.TRANSLADOS_AMBULANCIA}) AND `;
      }

      let miTerceroEnOtroCentro: string[] = [];

      if (this.auth.context === GCM_CONTEXTS.ALTACENTRO) {
        miTerceroEnOtroCentro.push(tercerosGCMbyCentro(this.auth.context, 1, 2)[0].documento);
        miTerceroEnOtroCentro.push(tercerosGCMbyCentro(this.auth.context, 2, 2)[0].documento);
      } else miTerceroEnOtroCentro.push(tercerosGCMbyCentro(this.auth.context, 0, 2)[0].documento);

      const results: GestionI[] = [];

      const usuariosBBDDExterna: { usuarioId: number; contextoNumberCode: number }[] = [];

      let ctxs = [...GCM_HCN_GTC_CONTEXTOS];
      if (this.auth.context === GCM_CONTEXTS.ALTACENTRO) {
        ctxs = [GCM_CONTEXTS.ALTACENTRO, GCM_CONTEXTS.VALLEDUPAR];
      }

      for (let index = 0; index < ctxs.length; index++) {
        const element = ctxs[index];
        const qr = this.dynamicQR(element);
        await qr.connect();

        try {
          const date = this.sumarDias(new Date(), -2).toISOString().split('T')[0];

          const result: GestionI[] = await qr.manager.query(fetchGestionesClinicas(conditional), [
            date,
          ]);

          result.forEach(r => {
            if (r.processorId && r.centroProcesamiento) {
              usuariosBBDDExterna.push({
                usuarioId: r.processorId,
                contextoNumberCode: r.centroProcesamiento,
              });
            }
            if (r.finisherId && r.centroCierre) {
              usuariosBBDDExterna.push({
                usuarioId: r.finisherId,
                contextoNumberCode: r.centroCierre,
              });
            }
            if (r.canceladoPor && r.centroCancelacion) {
              usuariosBBDDExterna.push({
                usuarioId: r.canceladoPor,
                contextoNumberCode: r.centroCancelacion,
              });
            }
          });

          const trasladoRp = qr.manager.getRepository(SolicitudTrasladoOrm);
          const traslados = await trasladoRp.find({
            relations: [
              'municipioOrigen',
              'municipioOrigen.departamento',
              'municipioDestino',
              'municipioDestino.departamento',
              'centroDestino',
              'centroOrigen',
              'centroOrigen.tercero.direccion',
              'centroDestino.tercero.direccion',
              'motivoTraslado',
              'asigVehiculo',
              'observaciones',
              'observaciones.usuario',
              'servicioDestino',
              'signoVital',
            ],
          });

          const vehiculosIds: number[] = [];
          const entidadesIds: number[] = [];

          result.map(value => {
            value.contexto = element;
            value.codigo = addAbreviacionByCentro(element, value.id, value.centroId);

            const misTraslados = traslados.filter(t => t.gestionId === value.id);

            misTraslados.map(tras => {
              if (tras.medicoId) entidadesIds.push(tras.medicoId);
              if (tras.asigVehiculo && tras.asigVehiculo.vehiculoId) {
                vehiculosIds.push(tras.asigVehiculo.vehiculoId);
              }
              if (tras.asigVehiculo && tras.asigVehiculo.auxiliarId) {
                entidadesIds.push(tras.asigVehiculo.auxiliarId);
              }
              if (tras.asigVehiculo && tras.asigVehiculo.conductorId) {
                entidadesIds.push(tras.asigVehiculo.conductorId);
              }

              if (tras.asigVehiculo) {
                if (tras.asigVehiculoId) {
                  const data = ['usuario', 'isUsuario', 'usuarioId', 'tipoEmpleadoCode'];
                  if (tras.medico && tras.medico.usuario) {
                    tras.medico.documento = tras.medico.usuario.cedula;
                    tras.medico.nombre = tras.medico.usuario.nombreCompleto;
                    data.forEach(el => delete tras.medico[el]);
                  }
                  if (tras.asigVehiculo.auxiliar) {
                    if (tras.asigVehiculo.auxiliar.usuario) {
                      tras.auxiliar = {
                        id: tras.asigVehiculo.auxiliar.usuario.id,
                        nombre: tras.asigVehiculo.auxiliar.usuario.nombreCompleto,
                        documento: tras.asigVehiculo.auxiliar.usuario.cedula,
                      };
                      data.forEach(el => delete tras.asigVehiculo.auxiliar[el]);
                    } else {
                      tras.auxiliar = tras.asigVehiculo.auxiliar;
                    }
                  }

                  if (tras.asigVehiculo.conductor) {
                    if (tras.asigVehiculo.conductor.usuario) {
                      tras.conductor = {
                        id: tras.asigVehiculo.conductor.usuario.id,
                        nombre: tras.asigVehiculo.conductor.usuario.nombreCompleto,
                        documento: tras.asigVehiculo.conductor.usuario.cedula,
                      };
                      data.forEach(el => delete tras.asigVehiculo.conductor[el]);
                    } else {
                      tras.conductor = tras.asigVehiculo.conductor;
                    }
                  }

                  if (tras.fechaInicioTraslado && tras.signoVital) {
                    const signos: { key: SignoVitalType; cantidad: string; unidad: string }[] = [];
                    SIGNOS_VISTALES_VALUES.forEach(signo => {
                      signos.push({
                        key: signo,
                        cantidad: signo.getForHumans().toLowerCase(),
                        unidad: signo.getUnidadMedidas(),
                      });
                    });

                    signos.forEach(signo => {
                      tras.signoVital.set(signo.key, tras.signoVital[signo.cantidad], signo.unidad);
                      delete tras.signoVital[signo.cantidad];
                    });
                  }

                  if (tras.recibidoPorId) entidadesIds.push(tras.recibidoPorId);
                }
              }
            });

            value.traslados = misTraslados;
          });

          const vehiculos = await sharedVehiculoRp.find({ where: { id: In(uniq(vehiculosIds)) } });
          const entidades = await sharedEntidadRp.find({ where: { id: In(uniq(entidadesIds)) } });

          result.map(value => {
            value.traslados.map((t: SolicitudTrasladoOrm) => {
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
                const auxiliar = cloneDeep(entidades).filter(
                  e => e.id === t.asigVehiculo.auxiliarId
                );
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
                  const vehiculo = cloneDeep(vehiculos).filter(
                    e => e.id === t.asigVehiculo.vehiculoId
                  );
                  if (vehiculo.length) {
                    t.asigVehiculo.vehiculo = vehiculo[0];
                    t.vehiculo = vehiculo[0].placa;
                  }
                }
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
          });

          if (this.auth.context === element) {
            results.push(...result);
          } else {
            const relacionadoConMiClinica: any[] = [];

            result.forEach(r => {
              let yaAgregado = false;

              r.traslados.forEach(t => {
                if (t.centroDestino) {
                  if (
                    this.auth.context === GCM_CONTEXTS.ALTACENTRO ||
                    miTerceroEnOtroCentro.includes(`${t.centroDestino.tercero.documento}`)
                  ) {
                    if (!yaAgregado) {
                      relacionadoConMiClinica.push(r);
                      yaAgregado = true;
                    }
                  }
                }
              });
            });

            results.push(...relacionadoConMiClinica);
          }
        } catch (error) {
          throw new Error(error.message);
        } finally {
          await qr.release();
        }
      }

      const usuariosBBDDGrouped = groupByKeyExtend({
        data: usuariosBBDDExterna,
        colWithKey: 'contextoNumberCode',
      });

      const usuarios: UsuarioOrm[] = [];

      for (let index = 0; index < GCM_HCN_GTC_CONTEXTOS.length; index++) {
        const element = GCM_HCN_GTC_CONTEXTOS[index];
        const qr = this.dynamicQR(element);
        await qr.connect();

        try {
          const usuariosBBDDFiltered = cloneDeep(usuariosBBDDGrouped).filter(
            u => u.key === element.getNumericCode()
          );
          if (usuariosBBDDFiltered.length) {
            const usuarioRp = qr.manager.getRepository(UsuarioOrm);
            const usuariosTemp = await usuarioRp.find({
              where: { id: In(usuariosBBDDFiltered[0].rows.map(r => r.usuarioId)) },
            });
            usuariosTemp.map(u => {
              u.contexto = element;
            });

            usuarios.push(...usuariosTemp);
          }
        } catch (error) {
          throw new Error(error.message);
        } finally {
          await qr.release();
        }
      }

      results.map(r => {
        if (r.processorId && r.centroProcesamiento) {
          const u = usuarios.filter(
            u => u.contexto.getNumericCode() === r.centroProcesamiento && u.id === r.processorId
          );
          if (u.length) {
            r.processorFullName = u[0].nombreCompleto;
            r.processorContexto = u[0].contexto;
          }
        }
        if (r.finisherId && r.centroCierre) {
          const u = usuarios.filter(
            u => u.contexto.getNumericCode() === r.centroCierre && u.id === r.finisherId
          );
          if (u.length) {
            r.finisherFullName = u[0].nombreCompleto;
            r.finisherContexto = u[0].contexto;
          }
        }
        if (r.canceladoPor && r.centroCancelacion) {
          const u = usuarios.filter(
            u => u.contexto.getNumericCode() === r.centroCancelacion && u.id === r.canceladoPor
          );
          if (u.length) {
            r.canceladoPorNombre = u[0].nombreCompleto;
            r.canceladoPorCedula = u[0].cedula;
            r.canceladoContexto = u[0].contexto;
          }
        }
      });

      return results;
    } catch (error) {
      return new BadRequestException(error.message);
    }
  }

  async changeManagementState(management: number, state: number, contextoCode?: GcmContextCode) {
    const conn = contextoCode ? this.dynamicConn(gcmContextFactory(contextoCode)) : this.conn;

    const repo = conn.getRepository(GestionOrm);
    const gestion = await repo.findOneOrFail({ where: { id: management } });

    const qr = conn.createQueryRunner();
    await qr.connect();
    try {
      if (state !== Estado.EN_PROCESO && state !== Estado.CERRADA) return new BadRequestException();

      if (state !== gestion.state && gestion.state !== Estado.CERRADA && gestion) {
        await qr.startTransaction();
        if (state === Estado.EN_PROCESO) {
          gestion.state = state;
          gestion.inProcessAt = new Date();
          gestion.inProcessBy = this.auth.user.id;
          gestion.centroProcesamiento = this.auth.context.getNumericCode();
        } else if (state === Estado.CERRADA) {
          gestion.state = state;
          gestion.closedAt = new Date();
          gestion.closedBy = this.auth.user.id;
          gestion.centroCierre = this.auth.context.getNumericCode();
        }
        await qr.manager.save(GestionOrm, gestion);
        await qr.commitTransaction();
      }

      let query = {};
      if (state === Estado.EN_PROCESO) {
        query = {
          processedAt: new Date(),
          processorFullName: this.auth.user.fullName,
          processorId: this.auth.user.id,
        };
      } else if (state === Estado.CERRADA) {
        query = {
          finishedAt: new Date(),
          finisherFullName: this.auth.user.fullName,
          finisherId: this.auth.user.id,
        };
      }

      return query;
    } catch (error) {
      await qr.rollbackTransaction();
      return new BadRequestException();
    } finally {
      await qr.release();
    }
  }

  sumarDias(fecha: Date, dias: number): Date {
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
  }
}
