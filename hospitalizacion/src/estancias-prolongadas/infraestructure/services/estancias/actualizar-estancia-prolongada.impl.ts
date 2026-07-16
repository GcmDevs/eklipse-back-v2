import { BaseSource } from '@common/infrastructure/services';
import { DominioAccionesEstados } from '@hpn/estancias-prolongadas/application/enums';
import { ActualizarEstanciaProlongadaDto } from '@hpn/estancias-prolongadas/presentation/dtos';
import {
  crearAccionNotificaciones,
  getNotificacionUserIds,
  resolverNivelRiesgo,
  validarNotificacionUsers,
} from '@hpn/estancias-prolongadas/shared/utils/estancias-prolongadas.util';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DominioItemOrm,
  EstanciaItemPreguntasOrm,
  DominioAccionesOrm,
  DominioAccionNotificacionOrm,
  GestorEstanciaProlongadaUsuarioOrm,
  DominioOrm,
  EstanciasProlongadasOrm,
} from '@orm/hpn/estancias-prolongadas';
import { In } from 'typeorm';

@Injectable()
export class ActualizarEstanciaProlongadaImpl extends BaseSource {
  public async actualizarEstancia(id: number, body: ActualizarEstanciaProlongadaDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const dominioItemRp = this.qr.manager.getRepository(DominioItemOrm);
      const estanciaRp = this.qr.manager.getRepository(EstanciasProlongadasOrm);
      const preguntasRp = this.qr.manager.getRepository(EstanciaItemPreguntasOrm);
      const dominioAccionesRp = this.qr.manager.getRepository(DominioAccionesOrm);
      const notificacionRp = this.qr.manager.getRepository(DominioAccionNotificacionOrm);
      const gestorUsuarioRp = this.qr.manager.getRepository(GestorEstanciaProlongadaUsuarioOrm);
      const dominioRp = this.qr.manager.getRepository(DominioOrm);

      const stay = await estanciaRp.findOne({ where: { id } });
      if (!stay) throw new NotFoundException('Estancia prolongada no encontrada');

      if (body.paciente) {
        const paciente = body.paciente;

        if (paciente.fechaIngreso !== undefined)
          stay.fechaIngreso = new Date(paciente.fechaIngreso);
        if (paciente.nombrePaciente !== undefined) {
          stay.nombrePaciente = paciente.nombrePaciente.trim();
        }
        if (paciente.documento !== undefined) stay.documento = paciente.documento.trim();
        if (paciente.age !== undefined) stay.age = paciente.age;
        if (paciente.cama !== undefined) stay.cama = paciente.cama.trim();
        if (paciente.piso !== undefined) stay.piso = paciente.piso?.trim() ?? null;
        if (paciente.municipio !== undefined) {
          stay.municipio = paciente.municipio?.trim() ?? null;
        }
        if (paciente.eps !== undefined) stay.eps = paciente.eps?.trim() ?? null;
        if (paciente.auditor !== undefined) stay.auditor = paciente.auditor.trim();
        if (paciente.medicoTratante !== undefined) {
          stay.medicoTratante = paciente.medicoTratante?.trim() ?? null;
        }
        if (paciente.diagnostico !== undefined) {
          stay.diagnostico = paciente.diagnostico?.trim() ?? null;
        }
        if (paciente.currentLos !== undefined) stay.currentLos = paciente.currentLos;
        if (paciente.sede !== undefined) stay.sede = paciente.sede?.trim() ?? null;
        if (paciente.grupo !== undefined) stay.grupo = paciente.grupo?.trim() ?? null;
      }

      if (body.selectedItemIds !== undefined) {
        if (!body.selectedItemIds.length) {
          throw new BadRequestException('Debe seleccionar al menos una pregunta');
        }

        const dominioItems = await dominioItemRp.find({
          where: {
            id: In(body.selectedItemIds),
            isActive: true,
          },
          relations: ['dominio'],
        });

        if (dominioItems.length !== body.selectedItemIds.length) {
          throw new NotFoundException(
            'Una o mas de las preguntas seleccionadas no existen o no estan activas'
          );
        }

        const scoreTotal = dominioItems.reduce((acc, item) => acc + Number(item.puntos || 0), 0);
        stay.scoreTotal = scoreTotal;
        stay.nivelRiesgo = resolverNivelRiesgo(scoreTotal);

        await preguntasRp.delete({ estanciaProlongadaId: id });

        const answers = dominioItems.map(item =>
          preguntasRp.create({
            estanciaProlongadaId: id,
            dominioItemId: item.id,
            puntosAwarded: item.puntos,
            dominioTituloSnapshot: item.dominio.titulo,
            itemTituloSnapshot: item.titulo,
            itemSubTituloSnapshot: item.subTitulo ?? null,
            createdAt: new Date(),
          })
        );

        if (answers.length) await preguntasRp.save(answers);
      }

      if (body.acciones !== undefined) {
        const uniqueActionDomainIds = [
          ...new Set((body.acciones ?? []).map(action => action.dominioId)),
        ];
        const notificationUserIds = getNotificacionUserIds(body.acciones);

        if (uniqueActionDomainIds.length) {
          const domains = await dominioRp.find({
            where: {
              id: In(uniqueActionDomainIds),
            },
          });

          if (domains.length !== uniqueActionDomainIds.length) {
            throw new NotFoundException(
              'Una o mas de las acciones creadas hacen referencia a dominios que no existen'
            );
          }
        }
        await validarNotificacionUsers(notificationUserIds, gestorUsuarioRp);

        await notificacionRp.delete({ estanciaProlongadaId: id });
        await dominioAccionesRp.delete({ estanciaProlongadaId: id });

        const actions = body.acciones.map(action =>
          dominioAccionesRp.create({
            estanciaProlongadaId: id,
            dominioId: action.dominioId,
            accionEspecifica: action.accionEspecifica.trim(),
            estado: action.estado ?? DominioAccionesEstados.PENDIENTE,
            responsable: action.responsable?.trim() ?? null,
            tiempoEstimado: action.fechaEstimada ? new Date(action.fechaEstimada) : null,
            observaciones: action.observacion?.trim() ?? null,
            createdAt: new Date(),
          })
        );

        const savedActions = actions.length ? await dominioAccionesRp.save(actions) : [];
        const notifications = crearAccionNotificaciones(
          id,
          savedActions,
          body.acciones,
          notificacionRp
        );

        if (notifications.length) await notificacionRp.save(notifications);
      }

      stay.updatedAt = new Date();
      await estanciaRp.save(stay);

      await this.qr.commitTransaction();

      const data = await estanciaRp.findOne({
        where: { id },
        relations: ['preguntas', 'acciones'],
      });

      return {
        message: 'Estancia actualizada satisfactoriamente',
        data,
      };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw error;
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
