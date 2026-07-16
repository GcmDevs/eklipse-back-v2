import { BaseSource } from '@common/infrastructure/services';
import { DominioAccionesEstados, NivelRiesgo } from '@hpn/estancias-prolongadas/application/enums';
import {
  ActualizarEstanciaProlongadaDto,
  CrearEstanProDto,
  CrearSeguimientoSemanaDto,
} from '@hpn/estancias-prolongadas/presentation/dtos';
import {
  crearAccionNotificaciones,
  getNotificacionUserIds,
  resolverNivelRiesgo,
  validarNotificacionUsers,
} from '@hpn/estancias-prolongadas/shared/utils/estancias-prolongadas.util';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DominioItemOrm,
  EstanciasProlongadasOrm,
  EstanciaItemPreguntasOrm,
  DominioAccionesOrm,
  DominioAccionNotificacionOrm,
  GestorEstanciaProlongadaUsuarioOrm,
  DominioOrm,
  SeguimientoSemanaOrm,
} from '@orm/hpn/estancias-prolongadas';
import { In, Repository } from 'typeorm';

@Injectable()
export class CrearEstanciasProlongadasImpl extends BaseSource {
  private async saveSeguimientoSemana(
    estanciaProlongadaId: number,
    body: CrearSeguimientoSemanaDto,
    options?: {
      estancia?: EstanciasProlongadasOrm;
      estanciaRp?: Repository<EstanciasProlongadasOrm>;
      seguimientoRp?: Repository<SeguimientoSemanaOrm>;
    }
  ) {
    const estanciaRp = options?.estanciaRp ?? this.conn.getRepository(EstanciasProlongadasOrm);
    const seguimientoRp = options?.seguimientoRp ?? this.conn.getRepository(SeguimientoSemanaOrm);

    const estancia =
      options?.estancia ?? (await estanciaRp.findOne({ where: { id: estanciaProlongadaId } }));

    if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');
    if (!estancia.estado) throw new ForbiddenException('La estancia ya esta cerrada');
    if (body.semanaNumero > 8) {
      throw new BadRequestException('El numero maximo de semanas es 8');
    }

    const seguimientoExistente = await seguimientoRp.findOne({
      where: { estanciaProlongadaId, semanaNumero: body.semanaNumero },
    });
    if (seguimientoExistente) {
      throw new BadRequestException('La semana ya existe para esta estancia');
    }

    if (body.semanaNumero > 1) {
      const seguimientoAnterior = await seguimientoRp.findOne({
        where: { estanciaProlongadaId, semanaNumero: body.semanaNumero - 1 },
      });
      if (!seguimientoAnterior) {
        throw new BadRequestException('No se puede crear una semana sin la anterior');
      }
    }

    const seguimiento = seguimientoRp.create({
      estanciaProlongadaId,
      semanaNumero: body.semanaNumero,
      fechaSeguimiento: new Date(body.fechaSeguimiento),
      esCritica: body.semanaNumero >= 4,
      estadoCodigo: body.estadoCodigo,
      destinoCodigo: body.destinoCodigo ?? null,
      accionCodigo: body.accionCodigo ?? null,
      responsable: body.responsable?.trim() ?? null,
      egresoEstimado: body.egresoEstimado ? new Date(body.egresoEstimado) : null,
      observaciones: body.observaciones?.trim() ?? null,
      escalada: body.escalada?.trim() ?? null,
      creadoPor: (this.auth.user as any)?.nombre ?? (this.auth.user as any)?.name ?? null,
      usuarioCreacionId: this.auth.user?.id ?? null,
    });

    return seguimientoRp.save(seguimiento);
  }

  public async crearEstanciasProlongadas(body: CrearEstanProDto) {
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
      const seguimientoRp = this.qr.manager.getRepository(SeguimientoSemanaOrm);

      const dominioItems = await dominioItemRp.find({
        where: {
          id: In(body.selectedItemIds),
          isActive: true,
        },
        relations: ['dominio'],
      });

      if (dominioItems.length !== body.selectedItemIds.length) {
        throw new NotFoundException(
          'Una o mas de las preguntas seleccionadas no existen o no están activas'
        );
      }

      const scoreTotal = dominioItems.reduce((acc, item) => acc + Number(item.puntos || 0), 0);
      const nivelRiesgo = resolverNivelRiesgo(scoreTotal);

      const estancia = estanciaRp.create({
        fechaIngreso: new Date(body.paciente.fechaIngreso),
        ingreso: body.paciente.ingreso,
        nombrePaciente: body.paciente.nombrePaciente.trim(),
        documento: body.paciente.documento.trim(),
        age: body.paciente.age,
        cama: body.paciente.cama.trim(),
        piso: body.paciente.piso?.trim() ?? null,
        municipio: body.paciente.municipio?.trim() ?? null,
        eps: body.paciente.eps?.trim() ?? null,
        auditor: body.paciente.auditor.trim(),
        medicoTratante: body.paciente.medicoTratante?.trim() ?? null,
        diagnostico: body.paciente.diagnostico?.trim() ?? null,
        currentLos: body.paciente.currentLos,
        sede: body.paciente.sede ?? null,
        grupo: body.paciente.grupo ?? null,
        scoreTotal,
        estado: true,
        usuarioCreacionId: this.auth.user.id,
        usuarioCerroId: null,
        fechaCierre: null,
        createdAt: new Date(),
        updatedAt: null,
        nivelRiesgo: nivelRiesgo,
      });

      const estanciaCreada = await estanciaRp.save(estancia);

      const preguntas = dominioItems.map(item =>
        preguntasRp.create({
          estanciaProlongadaId: estanciaCreada.id,
          dominioItemId: item.id,
          puntosAwarded: item.puntos,
          dominioTituloSnapshot: item.dominio.titulo,
          itemTituloSnapshot: item.titulo,
          itemSubTituloSnapshot: item.subTitulo ?? null,
          createdAt: new Date(),
        })
      );

      if (preguntas.length) await preguntasRp.save(preguntas);

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

      const actions = (body.acciones ?? []).map(action =>
        dominioAccionesRp.create({
          estanciaProlongadaId: estanciaCreada.id,
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
      const notificaciones = crearAccionNotificaciones(
        estanciaCreada.id,
        savedActions,
        body.acciones,
        notificacionRp
      );

      if (notificaciones.length) await notificacionRp.save(notificaciones);

      for (const seguimiento of body.seguimientos ?? []) {
        await this.saveSeguimientoSemana(estanciaCreada.id, seguimiento, {
          estancia: estanciaCreada,
          estanciaRp,
          seguimientoRp,
        });
      }

      await this.qr.commitTransaction();

      const data = await estanciaRp.findOne({
        where: { id: estanciaCreada.id },
        relations: ['preguntas', 'acciones', 'seguimientos'],
      });

      return data;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw error;
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
