import { Injectable, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import { CreateDietaDto } from '@lgc/die/presentation/dtos';
import { jornadasDietaTypeFactory, JORNADAS_DIETA } from '@lgc/die/domain/types';
import {
  dieCentroFactory,
  dietaEstadoFactory,
  dietaSubgrupoFactory,
  dietaJornadaFactory,
} from '../factories';
import {
  CentroOrm,
  DieCentroOrm,
  DieEstadoOrm,
  DieJornadaOrm,
  DieSubgrupoOrm,
  DietaConfExtraOrm,
  ScheduleOrm,
  SubgrupoOrm,
  TransactionDietaOrm,
} from '../orm';
import { validRangeForJornada } from '../utils/registrar-dietas.functions';
import { bloquearDietas } from '../utils/bloqueo-dietas';
import { DietasExecution, ResultadoRegistroDietas } from './dietas-execution';

class RegistroNoAplicable extends Error {
  constructor(
    message: string,
    readonly codigo: 'YA_REGISTRADO' | 'VALIDACION' = 'VALIDACION'
  ) {
    super(message);
  }
}

/** Núcleo compartido por el endpoint manual y el cierre automático. */
@Injectable()
export class RegistrarDietasSubgrupoService {
  private readonly logger = new Logger(RegistrarDietasSubgrupoService.name);

  public async execute(
    payload: CreateDietaDto,
    execution: DietasExecution
  ): Promise<ResultadoRegistroDietas> {
    const { conn, context, usuarioId } = execution;
    const fecha = new Date(`${execution.fecha.toISOString().slice(0, 10)}T00:00:00.000Z`);
    const auditoriaRp = conn.getRepository(TransactionDietaOrm);
    const auditoria = await auditoriaRp.save(
      Object.assign(new TransactionDietaOrm(), {
        usuarioId,
        subgrupoId: payload.subgrupoId,
        tipo: 1,
        jornada: payload.jornadaCode,
        createdAt: new Date(),
        success: false,
      })
    );
    const qr = conn.createQueryRunner();

    try {
      await qr.connect();
      await qr.startTransaction();
      await bloquearDietas(qr, context, fecha);

      const centroRp = qr.manager.getRepository(CentroOrm);
      const horarioRp = qr.manager.getRepository(ScheduleOrm);
      const subgrupoRp = qr.manager.getRepository(SubgrupoOrm);
      const dietaCentroRp = qr.manager.getRepository(DieCentroOrm);
      const dietaJornadaRp = qr.manager.getRepository(DieJornadaOrm);
      const dietaSubgrupoRp = qr.manager.getRepository(DieSubgrupoOrm);
      const dieEstadoRp = qr.manager.getRepository(DieEstadoOrm);
      const dieConfigRp = qr.manager.getRepository(DietaConfExtraOrm);

      const centro = await centroRp.findOne({ where: { id: payload.centroId } });
      if (!centro) throw new RegistroNoAplicable('No existe un centro con este id');
      const horario = await horarioRp.findOne({
        where: { id: payload.horarioId, clientId: centro.id },
      });
      if (!horario) throw new RegistroNoAplicable('Este horario no está relacionado a este centro');
      const jornada = jornadasDietaTypeFactory(payload.jornadaCode);
      if (!jornada) throw new RegistroNoAplicable('La jornada de dieta no es válida');

      horario.timeInMinutesToDate();
      if (
        !validRangeForJornada(
          horario,
          execution.origen === 'AUTOMATICA' || execution.canIgnoreHorario
        )
      ) {
        throw new RegistroNoAplicable('Ha expirado la jornada');
      }
      if (!payload.dietas.length) throw new RegistroNoAplicable('Debe existir al menos una dieta');
      const subgrupo = await subgrupoRp.findOne({ where: { id: payload.subgrupoId } });
      if (!subgrupo) throw new RegistroNoAplicable('Este subgrupo no existe');

      let dietaCentro = await dietaCentroRp.findOne({
        where: { fecha, centroId: centro.id },
      });
      let dietaJornada = dietaCentro
        ? await dietaJornadaRp.findOne({
            where: { fecha, horarioId: horario.id, dieCentroId: dietaCentro.id },
          })
        : null;
      if (
        dietaJornada &&
        (await dietaSubgrupoRp.findOne({
          where: { dieJornadaId: dietaJornada.id, subGrupoId: subgrupo.id },
        }))
      ) {
        throw new RegistroNoAplicable(
          'Este subgrupo ya se encuentra registrado en esta jornada',
          'YA_REGISTRADO'
        );
      }

      if (!dietaCentro) {
        dietaCentro = await dietaCentroRp.save(dieCentroFactory({ centroId: centro.id, fecha }));
      }
      if (!dietaJornada) {
        dietaJornada = await dietaJornadaRp.save(
          dietaJornadaFactory({
            dietaCentroId: dietaCentro.id,
            centroId: centro.id,
            jornada,
            horarioId: horario.id,
            fecha,
          })
        );
        if (jornada === JORNADAS_DIETA.DESAYUNO) dietaCentro.jornadaDesayunoId = dietaJornada.id;
        if (jornada === JORNADAS_DIETA.ALMUERZO) dietaCentro.jornadaAlmuerzoId = dietaJornada.id;
        if (jornada === JORNADAS_DIETA.CENA) dietaCentro.jornadaCenaId = dietaJornada.id;
        await dietaCentroRp.save(dietaCentro);
      }
      const dieSubgrupo = await dietaSubgrupoRp.save(
        dietaSubgrupoFactory({
          dieJornadaId: dietaJornada.id,
          subgrupoActual: subgrupo,
          userAuthId: usuarioId,
        })
      );

      const pacienteIds = payload.dietas.map(dieta => dieta.pacienteId);
      const camaIds = payload.dietas.map(dieta => dieta.camaId);
      const parametros = [fecha.toISOString().slice(0, 10), horario.id, ...camaIds, ...pacienteIds];
      const camasSql = camaIds.map((_, index) => `@${index + 2}`).join(',');
      const pacientesSql = pacienteIds
        .map((_, index) => `@${index + 2 + camaIds.length}`)
        .join(',');
      const existentes: { id: number }[] = await qr.query(
        `SELECT D.OID id FROM PDYDIEEST D
         INNER JOIN PDYDIEGRU G ON G.OID = D.PDYDIEGRU
         INNER JOIN PDYDIEJOR J ON J.OID = G.PDYDIEJOR
         WHERE J.DIEFECJOR = @0 AND J.DIEHORARIO = @1 AND D.ELIMINADO = 0
           AND (D.HPNDEFCAM IN (${camasSql}) OR D.GENPACIEN IN (${pacientesSql}))`,
        parametros
      );
      if (existentes.length) {
        const dietasRegistradas = await dieEstadoRp.find({
          where: { id: In(existentes.map(dieta => dieta.id)) },
        });
        dietasRegistradas.forEach(dieta => (dieta.isEliminado = true));
        await dieEstadoRp.save(dietasRegistradas);
      }

      const configuraciones = await dieConfigRp.find({ where: { pacienteId: In(pacienteIds) } });
      configuraciones.forEach(config => {
        config.verifyIfConfigIsLessThanMaxDays();
        if (config.isLessThanMaxDays) config.fechaUltimaDietaRegistrada = new Date();
      });
      if (configuraciones.length) await dieConfigRp.save(configuraciones);

      const dietas = payload.dietas
        .map(dieta =>
          dietaEstadoFactory({
            jornada,
            customDietaEstados: configuraciones,
            dieta,
            dieSubgrupoId: dieSubgrupo.id,
            context,
          })
        )
        .filter(dieta => !!dieta.combinacionCode);
      if (execution.origen === 'AUTOMATICA' && !dietas.length) {
        throw new RegistroNoAplicable('No hay pacientes con una dieta válida para registrar');
      }
      if (dietas.length) await dieEstadoRp.save(dietas);
      auditoria.success = true;
      await qr.manager.getRepository(TransactionDietaOrm).save(auditoria);
      await qr.commitTransaction();
      return {
        success: true,
        message: 'El subgrupo fue registrado en la jornada de dieta exitosamente',
        data: [],
        codigo: 'REGISTRADO',
        registradas: dietas.length,
      };
    } catch (error: any) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      auditoria.success = false;
      auditoria.detalleError = String(error.message).slice(0, 190);
      try {
        await auditoriaRp.save(auditoria);
      } catch (auditError: any) {
        this.logger.error(`No se pudo actualizar la auditoría de dietas: ${auditError.message}`);
      }
      if (error instanceof RegistroNoAplicable) {
        return {
          success: false,
          message: error.message,
          data: [],
          codigo: error.codigo,
          registradas: 0,
        };
      }
      throw error;
    } finally {
      try {
        await qr.release();
      } catch (error: any) {
        this.logger.error(`No se pudo liberar la conexión de dietas: ${error.message}`);
      }
    }
  }
}
