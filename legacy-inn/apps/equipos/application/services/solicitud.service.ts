import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@core/consecutivos/application';
import { UsuarioEqpService } from '@core/firmas';
import { SolicitudAprobacion } from '@equipos/domain/entities';
import { TipoAccionAprobacion } from '@equipos/domain/enums';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import { SolicitudRead } from '@equipos/domain/read';
import { SOLICITUD_APROBACION_REPOSITORY, SolicitudRepository } from '@equipos/domain/repositories';
import {
  FilterSolicitudDto,
  RejectSolicitudDto,
  ResponseCreatedSolicitudDto,
} from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import { REFERENCIA_ENTIDAD } from '../constants';
import { AccionAprobacionHandler } from '../handlers';
import { AccionHandlerRegistry } from '../handlers/accion-handler.registry';
import { generateCorrelationId } from '../helpers';
import { ProcessSolicitudBase, ProcessSolicitudInput } from '../types';
import { AuditEquipoService } from '../audit/audit-equipo.service';

@Injectable()
export class SolicitudService {
  constructor(
    @Inject(SOLICITUD_APROBACION_REPOSITORY)
    private readonly solicitudesRepository: SolicitudRepository,
    private readonly handlerRegistry: AccionHandlerRegistry,
    private readonly consecutivoService: ConsecutivoService,
    private readonly usuarioService: UsuarioEqpService,
    private readonly eventoService: AuditEquipoService,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async process(data: ProcessSolicitudInput): Promise<ResponseCreatedSolicitudDto> {
    const handler = this.handlerRegistry.get(data.tipoAccion);
    await handler.validate(data.equipoId, data.payload);
    await this.assertNotSolicitudPendiente(data.equipoId, data.tipoAccion, data.directaAccess);

    if (data.directaAccess) {
      await this.executeAsAdmin(data, handler);
      return { autoaprobada: true };
    }

    const solicitud = await this.createSolicitud(data);
    return {
      autoaprobada: false,
      solicitudId: solicitud.getId.getValor,
      solicitudCodigo: solicitud.getCodigo,
    };
  }

  async approve(id: number): Promise<SolicitudRead> {
    return this.txManager.transactional(async () => {
      const solicitud = await this.solicitudesRepository.findById(id);
      if (!solicitud) throw new ResourceNotFoundError('Solicitud no encontrada');

      const handler = this.handlerRegistry.get(solicitud.getTipoAccion);
      await handler.validate(solicitud.getEquipoId.getValor, solicitud.getPayload);

      const aprobadorId = getUser().id;
      const aprobador = await this.usuarioService.findById(aprobadorId);
      solicitud.approve(aprobador.id, aprobador.nombreCompleto);
      await this.solicitudesRepository.update(solicitud);

      await this.eventoService.register({
        equipoId: solicitud.getEquipoId.getValor,
        tipo: TipoEventoAuditEquipo.ACCION_APROBADA,
        descripcion: `${aprobador.nombreCompleto} aprobo: ${solicitud.getTipoAccion}`,
        autor: {
          id: aprobador.id,
          nombre: aprobador.nombreCompleto,
        },
        referenciaEntidad: REFERENCIA_ENTIDAD.SOLICITUD_APROBACION,
        referenciaId: id,
        metadata: { tipoAccion: solicitud.getTipoAccion, solicitudId: solicitud.getId.getValor },
        correlationId: solicitud.getCorrelationId,
        secuencia: 2,
      });

      await handler.execute(
        solicitud.getEquipoId.getValor,
        solicitud.getPayload,
        solicitud.getCorrelationId
      );

      return await this.solicitudesRepository.findViewById(id);
    });
  }

  async reject(id: number, { motivoRechazo }: RejectSolicitudDto): Promise<SolicitudRead> {
    return this.txManager.transactional(async () => {
      const solicitud = await this.solicitudesRepository.findById(id);
      if (!solicitud) throw new ResourceNotFoundError('Solicitud no encontrada');

      const aprobadorId = getUser().id;
      const aprobador = await this.usuarioService.findById(aprobadorId);

      solicitud.reject(aprobador.id, aprobador.nombreCompleto, motivoRechazo);
      await this.solicitudesRepository.update(solicitud);

      await this.eventoService.register({
        equipoId: solicitud.getEquipoId.getValor,
        tipo: TipoEventoAuditEquipo.ACCION_RECHAZADA,
        descripcion: `${aprobador.nombreCompleto} rechazo: ${solicitud.getTipoAccion}. Motivo: ${motivoRechazo}`,
        autor: {
          id: aprobador.id,
          nombre: aprobador.nombreCompleto,
        },
        referenciaEntidad: REFERENCIA_ENTIDAD.SOLICITUD_APROBACION,
        referenciaId: id,
        metadata: {
          solicitudId: solicitud.getId.getValor,
          tipoAccion: solicitud.getTipoAccion,
          motivoRechazo: motivoRechazo,
        },
        correlationId: solicitud.getCorrelationId,
        secuencia: 2,
      });

      return await this.solicitudesRepository.findViewById(id);
    });
  }

  private async executeAsAdmin(
    data: ProcessSolicitudBase,
    handler: AccionAprobacionHandler
  ): Promise<void> {
    const authorizeUsuarioId = getUser().id;
    const admin = await this.usuarioService.findById(authorizeUsuarioId);
    const codigoSolicitud = await this.consecutivoService.generate(
      CONSECUTIVOS_CODES.SOLICITUD_APROB
    );
    const correlationId = generateCorrelationId();
    const solicitud = SolicitudAprobacion.createAutoAprobada({
      codigo: codigoSolicitud,
      equipoId: data.equipoId,
      tipoAccion: data.tipoAccion,
      adminId: admin.id,
      adminNombre: admin.nombreCompleto,
      payload: data.payload,
    });

    await this.txManager.transactional(async () => {
      await this.solicitudesRepository.save(solicitud);
      await handler.execute(data.equipoId, data.payload, correlationId);

      const secuencia =
        (await this.eventoService.findMaxSecuenciaByCorrelationId(correlationId)) + 1;

      await this.eventoService.register({
        equipoId: data.equipoId,
        tipo: TipoEventoAuditEquipo.ACCION_APROBADA,
        descripcion: `${admin.nombreCompleto} ejecutó directamente: ${data.tipoAccion}`,
        autor: {
          id: admin.id,
          nombre: admin.nombreCompleto,
        },
        referenciaEntidad: REFERENCIA_ENTIDAD.SOLICITUD_APROBACION,
        referenciaId: solicitud.getId.getValor,
        metadata: {
          solicitudId: solicitud.getId.getValor,
          tipoAccion: data.tipoAccion,
          payload: data.payload,
        },
        correlationId,
        secuencia,
      });
    });
  }

  private async assertNotSolicitudPendiente(
    equipoId: number,
    tipoAccion: TipoAccionAprobacion,
    directAccess: boolean
  ): Promise<void> {
    const hasPendiente = await this.solicitudesRepository.existPendiente(equipoId, tipoAccion);
    if (!hasPendiente) return;

    const message = directAccess
      ? `Existe una solicitud pendiente de "${tipoAccion}" para este equipo. Resuélvala antes de realizar la acción directamente.`
      : `Ya existe una solicitud pendiente de "${tipoAccion}" para este equipo. No puede crear otra hasta que sea resuelta.`;

    throw new BadInputError(message);
  }

  private async createSolicitud(data: ProcessSolicitudBase): Promise<SolicitudAprobacion> {
    const usuarioSolicitante = getUser();
    const solicitante = await this.usuarioService.findById(usuarioSolicitante.id);
    const correlationId = generateCorrelationId();
    const numeroSolicitud = await this.consecutivoService.generate(
      CONSECUTIVOS_CODES.SOLICITUD_APROB
    );

    const solicitud = SolicitudAprobacion.create({
      codigo: numeroSolicitud,
      equipoId: data.equipoId,
      tipoAccion: data.tipoAccion,
      correlationId,
      solicitanteId: solicitante.id,
      solicitanteNombre: solicitante.nombreCompleto,
      payload: data.payload,
    });

    const saved = await this.solicitudesRepository.save(solicitud);

    await this.eventoService.register({
      equipoId: data.equipoId,
      tipo: TipoEventoAuditEquipo.ACCION_SOLICITADA,
      descripcion: `${solicitante.nombreCompleto} solicitó aprobación para: ${data.tipoAccion}`,
      autor: {
        id: solicitante.id,
        nombre: solicitante.nombreCompleto,
      },
      referenciaEntidad: REFERENCIA_ENTIDAD.SOLICITUD_APROBACION,
      referenciaId: saved.getId.getValor,
      metadata: {
        solicitudId: solicitud.getId.getValor,
        tipoAccion: data.tipoAccion,
        payload: data.payload,
      },
      correlationId,
      secuencia: 1,
    });

    return saved;
  }

  async getOneById(id: number): Promise<SolicitudRead> {
    const found = await this.solicitudesRepository.findViewById(id);
    if (!found) throw new ResourceNotFoundError(`Solicitud con id: ${id} no encontrada`);
    return found;
  }

  async getAll(filters: FilterSolicitudDto): Promise<[SolicitudRead[], number]> {
    return this.solicitudesRepository.findAllView(filters);
  }
}
