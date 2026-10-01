import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  EntregaTurnoOrm,
  ETPacienteTurnoOrm,
  ETRegistroClinicoOrm,
  PacienteEvolucionOrm,
} from '@orm/gcn';
import { TABLE_NAMES } from '@common/application/constants';
import {
  CreateOrUpdateEvolucionDto,
  CreateRegistroClinicoDto,
  UpdateRegistroClinicoDto,
} from '@gestion-clinica/entrega-turnos/presentation/dtos';
import { EstanciaOrm } from '@orm/temp';
import { ENTREGADO } from '@gestion-clinica/entrega-turnos/application/types';
import { ATRegistroClinicoRes } from '@gestion-clinica/entrega-turnos/application/responses';
import { IngresoOrm } from '@orm/gen';
import { In, IsNull, Not } from 'typeorm';

@Injectable()
export class RegistroClinicoImpl extends BaseSource {
  public async verificarPacineteEstanciaActiva(ingresoId: number, subgrupoId: number) {
    await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, ingresoId);

    const estanciaRp = this.conn.getRepository(EstanciaOrm);
    const estancia = await estanciaRp.findOne({
      where: { ingreso: { id: ingresoId } },
      relations: ['ingreso', 'cama', 'cama.subgrupo'],
      order: { id: 'DESC' },
    });

    const mgs = '. Intenta actualizar la página o contacta al administrador.';

    if (!estancia) {
      throw new Error(`No existe una estancia activa para este paciente${mgs}`);
    }

    if (estancia.fechaEgreso) {
      throw new Error(`El paciente ya fue dado de alta${mgs}`);
    }

    if (estancia.cama.subgrupo?.id !== subgrupoId) {
      throw new Error(`El paciente ya no pertenece a este subgrupo${mgs}`);
    }

    return estancia;
  }

  public async getRegistrosClinicosByTurnoId(turnoId: number) {
    const pacienteTurnoRp = this.conn.getRepository(ETPacienteTurnoOrm);

    const registrosClinicosTurno = await pacienteTurnoRp.find({
      where: {
        entregaTurnoId: turnoId,
      },
      relations: [
        'registroClinico',
        'entregaTurno',
        'entregaTurno.cambiosTurno',
        'pacienteEvolucion',
        'pacienteEvolucion.paciente',
      ],
    });

    const turno = registrosClinicosTurno.map(rp => {
      const medicosIds = rp.entregaTurno.cambiosTurno
        .map(md => md.medicoId)
        .filter(md => md !== null);

      const medicosAutorizados = [rp.entregaTurno.medicoEntregaTurnoId, ...medicosIds].filter(
        Boolean
      );

      const fechaEvolucion = new Date(rp.pacienteEvolucion.fecha);
      const inicioTurno = new Date(rp.entregaTurno.fecha);
      const finTurno = rp.entregaTurno.fechaRecibido
        ? new Date(rp.entregaTurno.fechaRecibido)
        : new Date();

      const evolucionDentroDeTurno = fechaEvolucion >= inicioTurno && fechaEvolucion <= finTurno;

      const usuarioAutorizado = medicosAutorizados.includes(rp.pacienteEvolucion.usuarioId);

      const evolucionRegistradoToday = !!rp.registroClinico;

      const evolucionModificadaHoy =
        evolucionDentroDeTurno && rp.pacienteEvolucion.evolucion && usuarioAutorizado;

      return {
        paciente: {
          id: rp.pacienteEvolucion.paciente.id,
          nombre: rp.pacienteEvolucion.paciente.nombreCompleto,
          evolucionRegistradoToday,
          evolucionModificadaHoy,
        },
        registroClinico: rp.registroClinico,
      };
    });

    return turno;
  }

  public async getRegistrosClinicosByPacienteId(pacienteId: number) {
    const pacienteTurnoRp = this.conn.getRepository(ETPacienteTurnoOrm);
    const ingresoRp = this.conn.getRepository(IngresoOrm);

    const ingresoActual = await ingresoRp.findOne({
      where: { paciente: { id: pacienteId }, fechaEgreso: IsNull() },
      relations: ['detalleContrato', 'detalleContrato.contrato'],
      order: { id: 'DESC' },
    });

    const ingresoAnterior = await ingresoRp.findOne({
      where: { paciente: { id: pacienteId }, fechaEgreso: Not(IsNull()) },
      relations: ['detalleContrato', 'detalleContrato.contrato'],
      order: { id: 'DESC' },
    });

    const ingresosIds: number[] = [];
    if (ingresoActual) {
      ingresosIds.push(ingresoActual.id);
    }

    if (ingresoActual && ingresoAnterior && ingresoAnterior.fechaEgreso) {
      const codigoContrato = ingresoActual.detalleContrato?.contrato?.codigo ?? '';
      const esContratoPGP = codigoContrato.startsWith('8');

      const fechaIngresoActual = new Date(ingresoActual.fechaIngreso);
      const fechaEgresoAnterior = new Date(ingresoAnterior.fechaEgreso);
      const diferenciaHoras =
        (fechaIngresoActual.getTime() - fechaEgresoAnterior.getTime()) / (1000 * 60 * 60);

      const diaEgreso = fechaEgresoAnterior.getDate();
      const diaIngreso = fechaIngresoActual.getDate();

      const esCorteAdministrativo =
        esContratoPGP &&
        diaEgreso === 30 &&
        (diaIngreso === 30 || diaIngreso === 1) &&
        diferenciaHoras >= 0 &&
        diferenciaHoras <= 4;

      if (esCorteAdministrativo) {
        ingresosIds.push(ingresoAnterior.id);
      }
    }

    const turnoActivo = await pacienteTurnoRp.find({
      where: {
        pacienteEvolucion: { pacienteId: pacienteId, ingresoId: In(ingresosIds) },
      },
      relations: [
        'registroClinico.usuario',
        'entregaTurno',
        'entregaTurno.subgrupo',
        'entregaTurno.habilitador',
        'entregaTurno.medicoEntrega',
        'entregaTurno.medicoRecibe',
      ],
      order: {
        registroClinicoId: 'DESC',
      },
    });

    const registrosClinicos = turnoActivo
      .filter(turno => turno.registroClinico)
      .map(clinico => {
        const { registroClinico, entregaTurnoId, entregaTurno } = clinico;
        entregaTurno.habilitadoId;

        const registrosClinico = new ATRegistroClinicoRes();
        registrosClinico.id = registroClinico.id;
        registrosClinico.turnoId = entregaTurnoId;
        registrosClinico.turno = {
          fechaInicio: entregaTurno?.fecha ?? null,
          fechaFin: entregaTurno?.fechaRecibido ?? null,
          medicoEntrega: entregaTurno?.medicoEntrega
            ? {
                cedula: entregaTurno.medicoEntrega.cedula,
                nombreCompleto: entregaTurno.medicoEntrega.nombreCompleto,
              }
            : null,
          medicoRecibe: entregaTurno?.medicoRecibe
            ? {
                cedula: entregaTurno.medicoRecibe.cedula,
                nombreCompleto: entregaTurno.medicoRecibe.nombreCompleto,
              }
            : null,
          habilitador: entregaTurno?.habilitador
            ? {
                cedula: entregaTurno.habilitador.cedula,
                nombreCompleto: entregaTurno.habilitador.nombreCompleto,
              }
            : null,
        };
        registrosClinico.usuarioMedicoGuarda = {
          cedula: registroClinico.usuario.cedula,
          nombreCompleto: registroClinico.usuario.nombreCompleto,
        };
        registrosClinico.subgrupo = entregaTurno?.subgrupo
          ? {
              codigo: entregaTurno.subgrupo.codigo,
              nombre: entregaTurno.subgrupo.nombre,
            }
          : null;
        registrosClinico.diagnostico = registroClinico.diagnostico;
        registrosClinico.especialidadTratante = registroClinico.especialidadTratante;
        registrosClinico.fechaRegistro = registroClinico.fechaRegistro;
        registrosClinico.pendientes = registroClinico.pendientes;
        registrosClinico.reporteImg = registroClinico.reporteImg;
        registrosClinico.reporteLab = registroClinico.reporteLab;
        registrosClinico.tratamiento = registroClinico.tratamiento;
        return registrosClinico;
      });

    return registrosClinicos;
  }

  public async createOrUpdateEvolucion(body: CreateOrUpdateEvolucionDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, body.ingresoId);
      await this.verifyEntityExist('HPNSUBGRU', body.subgrupoId);
      await this.verifyEntityExist(TABLE_NAMES.adn.centros, body.centroId);

      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const entregaTurnoRp = this.qr.manager.getRepository(EntregaTurnoOrm);
      const pacienteEvolucionRp = this.qr.manager.getRepository(PacienteEvolucionOrm);
      const etPacienteTurnoRp = this.qr.manager.getRepository(ETPacienteTurnoOrm);

      // ESTO VERIFICA SI PACIENTE SE ENCUENTRA HOSPITALIZADO Y SI ESTA EN UN SUBGRUPO DETERMINDA
      await this.verificarPacineteEstanciaActiva(body.ingresoId, body.subgrupoId);

      // Buscar turno activo
      let entregaTurnoActual = await entregaTurnoRp.findOne({
        where: {
          subgrupo: { id: body.subgrupoId },
          centroAtencionId: body.centroId,
          isActivo: true,
        },
        relations: ['medicoEntrega', 'medicoRecibe', 'cambiosTurno'],
      });

      if (!entregaTurnoActual) {
        throw new Error(`El subgrupo aún no ha sido iniciado`);
      }

      /*    if (!entregaTurnoActual || (entregaTurnoActual && entregaTurnoActual.fechaRecibido)) {
           if (entregaTurnoActual && entregaTurnoActual.fechaRecibido) {
             if (entregaTurnoActual.isActivo) {
               entregaTurnoActual.isActivo = false;
               await entregaTurnoRp.save(entregaTurnoActual);
             }
           }
           const nuevoTurno = new EntregaTurnoOrm();
   
           nuevoTurno.medicoEntregaTurnoId = this.auth.id;
   
           nuevoTurno.fecha = new Date();
   
           nuevoTurno.estadoCode = ESTADOS.EN_PROCESO.getCode();
   
           nuevoTurno.isActivo = true;
   
           nuevoTurno.subgrupoId = body.subgrupoId;
   
           nuevoTurno.centroAtencionId = body.centroId;
   
           const turnoSave = await entregaTurnoRp.save(nuevoTurno);
   
           entregaTurnoActual = await entregaTurnoRp.findOne({
             where: { id: turnoSave.id },
             relations: ['medicoEntrega', 'medicoRecibe'],
           });
         } */

      if (entregaTurnoActual.estadoCode === ENTREGADO.getCode()) {
        throw new Error(
          `El subgrupo ya fue entregado por ${entregaTurnoActual.medicoEntrega.nombreCompleto}`
        );
      }

      const medicoAyudanteIds = entregaTurnoActual.cambiosTurno
        .map(medico => medico.medicoId)
        .filter(id => id != null);

      const medicoAutorizadoIds = [entregaTurnoActual.medicoEntregaTurnoId, ...medicoAyudanteIds];

      if (!medicoAutorizadoIds.includes(this.auth.id) && !entregaTurnoActual.fechaEntrega) {
        throw new Error(
          `No puedes registrar/modificar la evolución: el turno actual pertenece a ${
            entregaTurnoActual.medicoEntrega?.nombreCompleto ?? 'otro médico'
          }.`
        );
      }

      if (!medicoAutorizadoIds.includes(this.auth.id)) {
        throw new Error('Solo el médico con el turno actual puede registrar datos clínicos.');
      }

      let evolucionExistente = await pacienteEvolucionRp.findOne({
        where: { pacienteId: body.pacienteId, ingresoId: body.ingresoId },
        relations: ['pacientesTurnos', 'pacientesTurnos.entregaTurno'],
      });

      let pacienteTurno: ETPacienteTurnoOrm | null = null;

      if (evolucionExistente) {
        evolucionExistente.evolucion = body.evolucion;
        evolucionExistente.usuarioId = this.auth.id;
        evolucionExistente.fecha = new Date();
        await pacienteEvolucionRp.save(evolucionExistente);
        // Buscar el turno asociado a esa evolución

        const turnoAsociado = evolucionExistente.pacientesTurnos.find(
          pt => pt.entregaTurno.id === entregaTurnoActual.id
        );

        // Si está en el mismo turno, no se crea nada nuevo
        if (turnoAsociado) {
          pacienteTurno = turnoAsociado;
        } else {
          pacienteTurno = etPacienteTurnoRp.create({
            pacienteEvolucionId: evolucionExistente.id,
            entregaTurnoId: entregaTurnoActual.id,
          });
          await etPacienteTurnoRp.save(pacienteTurno);
        }
      } else {
        // No hay evolución previa → crear una nueva
        const nuevaEvolucion = new PacienteEvolucionOrm();
        nuevaEvolucion.ingresoId = body.ingresoId;
        nuevaEvolucion.pacienteId = body.pacienteId;
        nuevaEvolucion.evolucion = body.evolucion;
        nuevaEvolucion.fecha = new Date();
        nuevaEvolucion.usuarioId = this.auth.id;

        const evolucionSave = await pacienteEvolucionRp.save(nuevaEvolucion);

        // Asociar con el turno actual
        const nuevoPacienteTurno = etPacienteTurnoRp.create({
          entregaTurno: { id: entregaTurnoActual.id },
          pacienteEvolucion: { id: evolucionSave.id },
        });
        await etPacienteTurnoRp.save(nuevoPacienteTurno);
      }
      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async create(body: CreateRegistroClinicoDto): Promise<{
    registroClinicoId: number;
    pacienteTurnoId: number;
    entregaTurnoId: number;
    result: boolean;
  }> {
    let transactionStarted = false;

    try {
      const { diagnostico, reporteLab, reporteImg, pendientes, especialidadTratante, tratamiento } =
        body.datosClinicos;

      await this.verificarPacineteEstanciaActiva(body.ingresoId, body.subgrupoId);
      await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, body.ingresoId);
      await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, body.pacienteId);
      await this.verifyEntityExist('HPNSUBGRU', body.subgrupoId);

      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const entregaTurnoRp = this.qr.manager.getRepository(EntregaTurnoOrm);
      const etRegistroClinicoRp = this.qr.manager.getRepository(ETRegistroClinicoOrm);
      const etPacienteTurnoRp = this.qr.manager.getRepository(ETPacienteTurnoOrm);
      const pacienteEvolucionRp = this.qr.manager.getRepository(PacienteEvolucionOrm);

      let entregaTurno = await entregaTurnoRp.findOne({
        where: {
          subgrupoId: body.subgrupoId,
          centroAtencionId: body.centroId,
          isActivo: true,
        },
        relations: ['medicoEntrega', 'medicoRecibe', 'cambiosTurno'],
        order: { id: 'DESC' },
      });

      if (!entregaTurno) {
        throw new Error(`El turno no a sido inicido`);
      }

      // Si existe entrega y ya fue entregada pero no recibida
      if (entregaTurno && entregaTurno.fechaEntrega && !entregaTurno.fechaRecibido) {
        throw new Error(
          `No puedes registrar datos clínicos: el subgrupo fue entregado por ${
            entregaTurno.medicoEntrega?.nombreCompleto ?? 'otro médico'
          } y aún no ha sido recibido.`
        );
      }

      const medicoAyudanteIds = entregaTurno.cambiosTurno
        .map(medico => medico.medicoId)
        .filter(id => id != null);

      const medicoAutorizadoIds = [entregaTurno.medicoEntregaTurnoId, ...medicoAyudanteIds];
      //Si fue recibida por otro médico distinto al autenticado
      if (
        entregaTurno &&
        entregaTurno.fechaRecibido &&
        !medicoAutorizadoIds.includes(this.auth.id)
      ) {
        throw new Error(
          `No puedes registrar datos clínicos: el turno actual pertenece a ${
            entregaTurno.medicoRecibe?.nombreCompleto ?? 'otro médico'
          }.`
        );
      }

      //Si no hay entrega activa o ya fue recibida, crear nueva entrega
      /*   if (!entregaTurno || (entregaTurno && entregaTurno.fechaRecibido)) {
          if (entregaTurno && entregaTurno.isActivo) {
            entregaTurno.isActivo = false;
            await entregaTurnoRp.save(entregaTurno);
          }
          entregaTurno = entregaTurnoRp.create({
            medicoEntregaTurnoId: this.auth.id,
            fecha: Date(),
            estadoCode: ESTADOS.EN_PROCESO.getCode(),
            isActivo: true,
            centroAtencionId: body.centroId,
            subgrupoId: body.subgrupoId,
          });
          await entregaTurnoRp.save(entregaTurno);
        } */

      // Validación final: solo el médico actual puede registrar
      if (!medicoAutorizadoIds.includes(this.auth.id)) {
        throw new Error('Solo el médico con el turno actual puede registrar datos clínicos.');
      }

      // Buscar evolución del paciente
      let pacienteEvolucion = await pacienteEvolucionRp.findOne({
        where: { pacienteId: body.pacienteId, ingresoId: body.ingresoId },
        relations: ['pacientesTurnos', 'pacientesTurnos.entregaTurno'],
      });

      let pacienteTurno: ETPacienteTurnoOrm | null = null;

      if (pacienteEvolucion) {
        // Buscar el turno asociado a esa evolución
        const turnoAsociado = pacienteEvolucion.pacientesTurnos.find(
          pt => pt.entregaTurno.id === entregaTurno.id
        );

        if (turnoAsociado) {
          //Ya tiene turno asociado actual → reutilizar
          pacienteTurno = turnoAsociado;
        } else {
          // Nuevo turno → crear nuevo paciente turno
          pacienteTurno = etPacienteTurnoRp.create({
            pacienteEvolucionId: pacienteEvolucion.id,
            entregaTurnoId: entregaTurno.id,
          });
          await etPacienteTurnoRp.save(pacienteTurno);
        }
      } else {
        //No hay evolución → crear evolución y turno
        pacienteEvolucion = pacienteEvolucionRp.create({
          usuarioId: this.auth.id,
          ingresoId: body.ingresoId,
          pacienteId: body.pacienteId,
          evolucion: '',
          fecha: new Date(),
        });
        await pacienteEvolucionRp.save(pacienteEvolucion);

        pacienteTurno = etPacienteTurnoRp.create({
          pacienteEvolucionId: pacienteEvolucion.id,
          entregaTurnoId: entregaTurno.id,
        });
        await etPacienteTurnoRp.save(pacienteTurno);
      }

      //Crear registro clínico asociado al paciente turno actual
      const newRegistroClinico = etRegistroClinicoRp.create({
        fechaRegistro: new Date(),
        pacienteTurnoId: pacienteTurno.id,
        diagnostico,
        reporteLab,
        reporteImg,
        pendientes,
        especialidadTratante,
        tratamiento,
        usuarioId: this.auth.id,
      });
      await etRegistroClinicoRp.save(newRegistroClinico);

      // Asociar el registro clínico al paciente turno (si no está vinculado)
      if (!pacienteTurno.registroClinicoId) {
        pacienteTurno.registroClinicoId = newRegistroClinico.id;
        await etPacienteTurnoRp.save(pacienteTurno);
      }

      await this.qr.commitTransaction();

      return {
        registroClinicoId: newRegistroClinico.id,
        pacienteTurnoId: pacienteTurno.id,
        entregaTurnoId: entregaTurno.id,
        result: true,
      };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async update(
    body: UpdateRegistroClinicoDto
  ): Promise<{ registroClinicoId: number; pacienteTurnoId: number; result: boolean }> {
    let transactionStarted = false;
    try {
      await this.verificarPacineteEstanciaActiva(body.ingresoId, body.subgrupoId);

      const { diagnostico, reporteLab, reporteImg, pendientes, especialidadTratante, tratamiento } =
        body.datosClinicos;

      transactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();

      const etRegistroClinicoRp = this.qr.manager.getRepository(ETRegistroClinicoOrm);

      const registroClinico = await etRegistroClinicoRp.findOne({
        where: { id: body.registroClinicoId },
        relations: [
          'pacienteTurno',
          'pacienteTurno.entregaTurno',
          'pacienteTurno.entregaTurno',
          'pacienteTurno.entregaTurno.cambiosTurno',
        ],
      });

      if (!registroClinico) {
        throw new Error(`El registro clinico con ID ${body.registroClinicoId} no existe`);
      }

      if (registroClinico.pacienteTurno.entregaTurno.isActivo === false) {
        throw new Error(`El registro clinico con ID ${body.registroClinicoId} ya fue entregado`);
      }

      if (registroClinico.pacienteTurno.entregaTurno.fechaEntrega) {
        throw new Error(`El registro clinico con ID ${body.registroClinicoId} ya fue entregado`);
      }

      const medicoAyudanteIds = registroClinico.pacienteTurno.entregaTurno.cambiosTurno
        .map(medico => medico.medicoId)
        .filter(id => id != null);

      const medicoAutorizadoIds = [
        registroClinico.pacienteTurno.entregaTurno.medicoEntregaTurnoId,
        ...medicoAyudanteIds,
      ];

      if (!medicoAutorizadoIds.includes(this.auth.id)) {
        throw new Error(`Usted no puede actualizar este registro`);
      }

      if (diagnostico) registroClinico.diagnostico = diagnostico;
      if (reporteLab) registroClinico.reporteLab = reporteLab;
      if (reporteImg) registroClinico.reporteImg = reporteImg;
      if (pendientes) registroClinico.pendientes = pendientes;
      if (especialidadTratante) registroClinico.especialidadTratante = especialidadTratante;
      if (tratamiento) registroClinico.tratamiento = tratamiento;

      if (registroClinico.usuarioId !== this.auth.id) {
        registroClinico.usuarioId = this.auth.id;
      }

      await etRegistroClinicoRp.save(registroClinico);

      /* HISTORIAL */

      await this.qr.commitTransaction();
      return {
        registroClinicoId: registroClinico.id,
        pacienteTurnoId: registroClinico.pacienteTurno.entregaTurnoId,
        result: true,
      };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
