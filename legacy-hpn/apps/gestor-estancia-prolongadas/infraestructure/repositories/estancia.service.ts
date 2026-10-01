import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CierreBarreraCriticaCode,
  CierreDestinoFinalCode,
  CierreLosResultadoCode,
  CierreProtocoloSuficienteCode,
  SeguimientoAccionCode,
  SeguimientoDestinoCode,
  SeguimientoEstadoCode,
  cierreBarreraCriticaTypeFactory,
  cierreDestinoFinalTypeFactory,
  cierreLosResultadoTypeFactory,
  cierreProtocoloSuficienteTypeFactory,
  seguimientoAccionTypeFactory,
  seguimientoDestinoTypeFactory,
  seguimientoEstadoTypeFactory,
} from '@ctypes/hpn';
import { BaseSource } from '@common/infrastructure/services';
import {
  DominioAccionesOrm,
  DominioAccionNotificacionOrm,
  DominioItemOrm,
  DominioOrm,
  GestorEstanciaProlongadaUsuarioOrm,
  ProlongadaEstanciaOrm,
  SeguimientoSemanaOrm,
  EstanciaItemPreguntasOrm,
} from '@orm/hpn/estancia-prolongadas';
import { In, Repository } from 'typeorm';
import { DominioAccionesEstados, RiskLevel } from '../../application/enums';
import {
  ActivityFeedQueryDto,
  ActivityFeedSeverity,
  CerrarEstanciaDto,
  CrearEstanProDto,
  CrearSeguimientoSemanaDto,
  FindStaysQueryDto,
  UpdateDomainActionDto,
  UpdateEstanProDto,
} from '../../presentation/dtos';

type ActivityEventType =
  | 'estancia_creada'
  | 'estancia_cerrada'
  | 'seguimiento_guardado'
  | 'accion_completada'
  | 'accion_bloqueada'
  | 'escalada_activada'
  | 'caso_critico_detectado';

type ActivityFeedItem = {
  id: number;
  eventType: ActivityEventType;
  severity: ActivityFeedSeverity;
  pacienteNombre: string;
  pacienteDoc: string;
  descripcion: string;
  realizadoPor: string;
  sede: string;
  timestamp: string;
  losActual: number;
  semanaSeguimiento: number;
  requiereAtencion: boolean;
};

type PendingActivityFeedItem = ActivityFeedItem | null;

type ActivityFeedKpis = {
  moderado: number;
  critico: number;
  alto: number;
  cerrado: number;
};

@Injectable()
export class EstanciaService extends BaseSource {
  private getNotificationUserIds(
    actions: CrearEstanProDto['acciones'] | UpdateEstanProDto['acciones']
  ) {
    return [
      ...new Set(
        (actions ?? [])
          .flatMap(action => action.usuarioIds ?? [])
          .filter(usuarioId => Number.isInteger(usuarioId) && usuarioId > 0)
      ),
    ];
  }

  private async validateNotificationUsers(
    usuarioIds: number[],
    gestorUsuarioRp: Repository<GestorEstanciaProlongadaUsuarioOrm>
  ) {
    if (!usuarioIds.length) return;

    const usuarios = await gestorUsuarioRp.find({
      where: { usuarioId: In(usuarioIds), estado: true },
    });
    const validUsuarioIds = new Set(usuarios.map(usuario => usuario.usuarioId));
    const missingUsuarioIds = usuarioIds.filter(usuarioId => !validUsuarioIds.has(usuarioId));

    if (missingUsuarioIds.length) {
      throw new NotFoundException(
        `Uno o mas usuarios seleccionados para notificacion no existen o estan inactivos: ${missingUsuarioIds.join(
          ', '
        )}`
      );
    }
  }

  private createActionNotifications(
    estanciaProlongadaId: number,
    savedActions: DominioAccionesOrm[],
    requestedActions: CrearEstanProDto['acciones'] | UpdateEstanProDto['acciones'],
    notificacionRp: Repository<DominioAccionNotificacionOrm>
  ) {
    return savedActions.flatMap((savedAction, index) => {
      const requestedAction = requestedActions?.[index];
      const usuarioIds = requestedAction?.usuarioIds ?? [];
      const descripcion = `Nueva accion asignada: ${savedAction.accionEspecifica}`;

      return usuarioIds.map(usuarioId =>
        notificacionRp.create({
          usuarioId,
          estanciaProlongadaId,
          accionId: savedAction.id,
          descripcion,
          visto: false,
          fechaVisto: null,
          createdAt: new Date(),
        })
      );
    });
  }

  private formatColombiaTimestamp(date: Date): string {
    const colombiaTime = new Date(date.getTime() - 5 * 60 * 60 * 1000);
    return `${colombiaTime.toISOString().slice(0, 19)}-05:00`;
  }

  private isValidDate(date: Date): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  private calculateLosAt(fechaIngreso: Date, fechaEvento: Date, fallbackLos: number): number {
    if (!this.isValidDate(fechaIngreso) || !this.isValidDate(fechaEvento)) {
      return fallbackLos ?? 0;
    }

    const diff = fechaEvento.getTime() - fechaIngreso.getTime();
    return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
  }

  private resolveActivitySeverity(
    eventType: ActivityEventType,
    losActual: number
  ): ActivityFeedSeverity {
    if (eventType === 'escalada_activada' || eventType === 'caso_critico_detectado') {
      return 'critical';
    }
    if (eventType === 'accion_bloqueada' || losActual > 14) return 'warning';
    if (eventType === 'estancia_cerrada' || eventType === 'accion_completada') return 'success';
    return 'info';
  }

  private resolveActivityRequiresAttention(
    eventType: ActivityEventType,
    losActual: number,
    fechaEvento: Date,
    updatedAt?: Date
  ): boolean {
    if (eventType === 'escalada_activada' || eventType === 'caso_critico_detectado') return true;
    if (losActual >= 21) return true;
    if (eventType !== 'accion_bloqueada') return false;

    const lastChange = updatedAt ?? fechaEvento;
    const hoursWithoutChange = (Date.now() - lastChange.getTime()) / (60 * 60 * 1000);
    return hoursWithoutChange > 48;
  }

  private buildActivityEvent(params: {
    id: number;
    eventType: ActivityEventType;
    estancia: ProlongadaEstanciaOrm;
    fechaEvento: Date;
    descripcion: string;
    realizadoPor: string;
    semanaSeguimiento?: number;
    updatedAt?: Date;
  }): PendingActivityFeedItem {
    if (!this.isValidDate(params.fechaEvento)) return null;

    const losActual = this.calculateLosAt(
      params.estancia.fechaIngreso,
      params.fechaEvento,
      params.estancia.currentLos
    );
    const severity = this.resolveActivitySeverity(params.eventType, losActual);

    return {
      id: params.id,
      eventType: params.eventType,
      severity,
      pacienteNombre: params.estancia.nombrePaciente,
      pacienteDoc: params.estancia.documento,
      descripcion: params.descripcion,
      realizadoPor: params.realizadoPor,
      sede: params.estancia.sede,
      timestamp: this.formatColombiaTimestamp(params.fechaEvento),
      losActual,
      semanaSeguimiento: params.semanaSeguimiento ?? null,
      requiereAtencion: this.resolveActivityRequiresAttention(
        params.eventType,
        losActual,
        params.fechaEvento,
        params.updatedAt
      ),
    };
  }

  private resolvePerformer(nombre: string, cargo = 'GEP'): string {
    return `${nombre?.trim() || 'Sistema GEP'} · ${cargo}`;
  }

  private getAuthSedeId(): number {
    const context = this.auth?.context as any;
    if (!context?.getNumericCode) return null;
    return context.getNumericCode();
  }

  private buildActivityFeedKpis(estancias: ProlongadaEstanciaOrm[]): ActivityFeedKpis {
    return estancias.reduce(
      (acc, estancia) => {
        const nivelRiesgo = estancia.nivelRiesgo?.toLowerCase();
        const tieneSeguimientoCritico = (estancia.seguimientos ?? []).some(
          seguimiento => seguimiento.esCritica || seguimiento.semanaNumero >= 4
        );
        if (!estancia.estado) acc.cerrado += 1;

        if (nivelRiesgo === RiskLevel.MODERADO) acc.moderado += 1;
        if (nivelRiesgo === RiskLevel.ALTO) acc.alto += 1;
        if (estancia.scoreTotal >= 41 || estancia.currentLos >= 21 || tieneSeguimientoCritico) {
          acc.critico += 1;
        }

        return acc;
      },
      { moderado: 0, critico: 0, alto: 0, cerrado: 0 }
    );
  }

  private mapSeguimiento(seguimiento: SeguimientoSemanaOrm) {
    return {
      ...seguimiento,
      estado: seguimientoEstadoTypeFactory(seguimiento.estadoCodigo as SeguimientoEstadoCode),
      destino: seguimiento.destinoCodigo
        ? seguimientoDestinoTypeFactory(seguimiento.destinoCodigo as SeguimientoDestinoCode)
        : null,
      accion: seguimiento.accionCodigo
        ? seguimientoAccionTypeFactory(seguimiento.accionCodigo as SeguimientoAccionCode)
        : null,
    };
  }

  private mapCierre(estancia: ProlongadaEstanciaOrm, fechaEgreso: string) {
    return {
      fechaEgreso,
      losTotal: estancia.losTotal,
      destinoFinal: cierreDestinoFinalTypeFactory(
        estancia.destinoFinalCodigo as CierreDestinoFinalCode
      ),
      firmaMedico: estancia.firmaMedico,
      losResultado: cierreLosResultadoTypeFactory(
        estancia.losResultadoCodigo as CierreLosResultadoCode
      ),
      barreraCritica: cierreBarreraCriticaTypeFactory(
        estancia.barreraCriticaCodigo as CierreBarreraCriticaCode
      ),
      accionEfectiva: estancia.accionEfectiva,
      accionInefectiva: estancia.accionInefectiva,
      leccionAprendida: estancia.leccionAprendida,
      protocoloSuficiente: cierreProtocoloSuficienteTypeFactory(
        estancia.protocoloSuficienteCodigo as CierreProtocoloSuficienteCode
      ),
      observacionesCierre: estancia.observacionesCierre,
    };
  }

  private resolveRiskLevel(scoreTotal: number): RiskLevel {
    if (scoreTotal >= 41) return RiskLevel.ALTO;
    if (scoreTotal >= 21) return RiskLevel.MODERADO;
    return RiskLevel.BAJO;
  }

  private async saveSeguimientoSemana(
    estanciaProlongadaId: number,
    body: CrearSeguimientoSemanaDto,
    options?: {
      estancia?: ProlongadaEstanciaOrm;
      estanciaRp?: Repository<ProlongadaEstanciaOrm>;
      seguimientoRp?: Repository<SeguimientoSemanaOrm>;
    }
  ) {
    const estanciaRp = options?.estanciaRp ?? this.conn.getRepository(ProlongadaEstanciaOrm);
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

  public async createStay(body: CrearEstanProDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const dominioItemRp = this.qr.manager.getRepository(DominioItemOrm);
      const estanciaRp = this.qr.manager.getRepository(ProlongadaEstanciaOrm);
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
      const riskLevel = this.resolveRiskLevel(scoreTotal);

      const stay = estanciaRp.create({
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
        nivelRiesgo: riskLevel,
      });

      const estanciaCreada = await estanciaRp.save(stay);

      const answers = dominioItems.map(item =>
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

      if (answers.length) await preguntasRp.save(answers);

      const uniqueActionDomainIds = [
        ...new Set((body.acciones ?? []).map(action => action.dominioId)),
      ];
      const notificationUserIds = this.getNotificationUserIds(body.acciones);
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
      await this.validateNotificationUsers(notificationUserIds, gestorUsuarioRp);

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
      const notifications = this.createActionNotifications(
        estanciaCreada.id,
        savedActions,
        body.acciones,
        notificacionRp
      );

      if (notifications.length) await notificacionRp.save(notifications);

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

  public async getStaysActivo() {
    const stayRp = this.conn.getRepository(ProlongadaEstanciaOrm);
    const data = await stayRp.find({
      where: { estado: true, usuarioCreacionId: this.auth.user.id },
      order: { createdAt: 'DESC' },
      relations: ['preguntas', 'acciones', 'seguimientos'],
    });
    if (!data.length) {
      throw new NotFoundException('No se encontraron estancias activas');
    }

    return data;
  }
  // public async getStaysActivo() {
  //   const stayRp = this.conn.getRepository(ProlongadaEstanciaOrm);
  //   const data = await stayRp.find({
  //     where: { estado: true },
  //     order: { createdAt: 'DESC' },
  //     relations: ['preguntas', 'acciones', 'seguimientos'],
  //   });
  //   if (!data.length) {
  //     throw new NotFoundException('No se encontraron estancias activas');
  //   }

  //   return data;
  // }

  public async getStaysInActivo() {
    const stayRp = this.conn.getRepository(ProlongadaEstanciaOrm);
    const data = await stayRp.find({
      where: { estado: false },
      order: { createdAt: 'DESC' },
      relations: ['preguntas', 'acciones'],
    });
    if (!data.length) {
      throw new NotFoundException('No se encontraron estancias inactivas');
    }

    return data;
  }

  public async getStays(query: FindStaysQueryDto) {
    const stayRp = this.conn.getRepository(ProlongadaEstanciaOrm);
    const qb = stayRp.createQueryBuilder('estanciaProlongada');
    // .where('estanciaProlongada.deletedAt IS NULL');

    if (query.documento) {
      qb.andWhere('estanciaProlongada.document LIKE :document', {
        document: `%${query.documento.trim()}%`,
      });
    }

    if (query.auditor) {
      qb.andWhere('estanciaProlongada.auditor LIKE :auditor', {
        auditor: `%${query.auditor.trim()}%`,
      });
    }

    if (query.nivelRiesgo) {
      qb.andWhere('estanciaProlongada.riskLevel = :riskLevel', { riskLevel: query.nivelRiesgo });
    }

    if (query.cama) {
      qb.andWhere('estanciaProlongada.bed LIKE :bed', { bed: `%${query.cama.trim()}%` });
    }

    if (query.admissionDateFrom) {
      qb.andWhere('estanciaProlongada.admissionDate >= :admissionDateFrom', {
        admissionDateFrom: new Date(query.admissionDateFrom),
      });
    }

    if (query.admissionDateTo) {
      qb.andWhere('estanciaProlongada.admissionDate <= :admissionDateTo', {
        admissionDateTo: new Date(query.admissionDateTo),
      });
    }

    const data = await qb.orderBy('estanciaProlongada.createdAt', 'DESC').getMany();

    return data;
  }

  public async obtenerActivityFeed(query: ActivityFeedQueryDto) {
    const limit = query.limit ?? 50;
    const authSedeId = this.getAuthSedeId();

    if (query.sedeId && authSedeId && query.sedeId !== authSedeId) {
      return {
        data: [],
        meta: {
          total: 0,
          returned: 0,
          generadoEn: new Date(),
        },
      };
    }

    const estanciaRp = this.conn.getRepository(ProlongadaEstanciaOrm);
    const estancias = await estanciaRp.find({
      relations: ['seguimientos', 'acciones'],
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });
    const kpis = this.buildActivityFeedKpis(estancias);

    const eventos = estancias.flatMap(estancia => {
      const estanciaEventos: PendingActivityFeedItem[] = [
        this.buildActivityEvent({
          id: estancia.id,
          eventType: 'estancia_creada',
          estancia,
          fechaEvento: estancia.createdAt,
          descripcion: 'Se creo un nuevo caso de estancia prolongada.',
          realizadoPor: this.resolvePerformer(estancia.auditor, 'Auditoria Concurrente'),
        }),
      ];

      if (estancia.scoreTotal >= 41) {
        estanciaEventos.push(
          this.buildActivityEvent({
            id: estancia.id * 10 + 1,
            eventType: 'caso_critico_detectado',
            estancia,
            fechaEvento: estancia.createdAt,
            descripcion: 'El puntaje total supera el umbral critico definido para el caso.',
            realizadoPor: this.resolvePerformer(estancia.auditor, 'Auditoria Concurrente'),
          })
        );
      }

      if (!estancia.estado && estancia.fechaCierre) {
        estanciaEventos.push(
          this.buildActivityEvent({
            id: estancia.id * 10 + 2,
            eventType: 'estancia_cerrada',
            estancia,
            fechaEvento: estancia.fechaCierre,
            descripcion: 'Se cerro el caso de estancia prolongada con egreso registrado.',
            realizadoPor: this.resolvePerformer(estancia.auditor, 'GCM'),
          })
        );
      }

      (estancia.seguimientos ?? []).forEach(seguimiento => {
        const isEscalada = seguimiento.esCritica || seguimiento.semanaNumero >= 4;
        estanciaEventos.push(
          this.buildActivityEvent({
            id: seguimiento.id,
            eventType: isEscalada ? 'escalada_activada' : 'seguimiento_guardado',
            estancia,
            fechaEvento: seguimiento.createdAt,
            descripcion: isEscalada
              ? 'Se activo escalada a Gobierno Clinico por seguimiento critico del caso.'
              : `Seguimiento semana ${seguimiento.semanaNumero} registrado.`,
            realizadoPor: this.resolvePerformer(seguimiento.creadoPor, 'GCM'),
            semanaSeguimiento: seguimiento.semanaNumero,
          })
        );
      });

      (estancia.acciones ?? []).forEach(accion => {
        const estado = accion.estado?.toLowerCase();
        if (estado !== DominioAccionesEstados.COMPLETADO && estado !== 'bloqueado') return;

        estanciaEventos.push(
          this.buildActivityEvent({
            id: accion.id,
            eventType: estado === 'bloqueado' ? 'accion_bloqueada' : 'accion_completada',
            estancia,
            fechaEvento: accion.updatedAt ?? accion.createdAt,
            descripcion:
              estado === 'bloqueado'
                ? `Accion bloqueada: ${accion.accionEspecifica}`
                : `Accion completada: ${accion.accionEspecifica}`,
            realizadoPor: this.resolvePerformer(accion.responsable, 'GCM'),
            updatedAt: accion.updatedAt,
          })
        );
      });

      return estanciaEventos.filter(Boolean) as ActivityFeedItem[];
    });

    const filtered = eventos
      .filter(event => !query.severity || event.severity === query.severity)
      .filter(
        event =>
          query.requiereAtencion === undefined || event.requiereAtencion === query.requiereAtencion
      )
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));

    const data = filtered.slice(0, limit);

    return {
      data,
      kpis,
      meta: {
        total: filtered.length,
        returned: data.length,
        generadoEn: new Date(),
      },
    };
  }

  public async getStayById(id: number) {
    const stayRp = this.conn.getRepository(ProlongadaEstanciaOrm);
    const seguimientoRp = this.conn.getRepository(SeguimientoSemanaOrm);

    const data = await stayRp.findOne({
      where: { id },
      relations: ['preguntas', 'preguntas.dominioItem', 'acciones', 'acciones.dominio'],
    });

    if (!data) throw new NotFoundException('Estancia prolongada no encontrada');

    const seguimientos = await seguimientoRp.find({
      where: { estanciaProlongadaId: id },
      order: { semanaNumero: 'ASC' },
    });

    return {
      message: 'Estancia encontrada satisfactoriamente',
      data: {
        ...data,
        seguimientos: seguimientos.map(seguimiento => this.mapSeguimiento(seguimiento)),
      },
    };
  }

  public async crearSeguimiento(estanciaProlongadaId: number, body: CrearSeguimientoSemanaDto) {
    const data = await this.saveSeguimientoSemana(estanciaProlongadaId, body);
    return this.mapSeguimiento(data);
  }

  public async listarSeguimientos(estanciaProlongadaId: number) {
    const estanciaRp = this.conn.getRepository(ProlongadaEstanciaOrm);
    const seguimientoRp = this.conn.getRepository(SeguimientoSemanaOrm);

    const estancia = await estanciaRp.findOne({ where: { id: estanciaProlongadaId } });
    if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');

    const seguimientos = await seguimientoRp.find({
      where: { estanciaProlongadaId },
      order: { semanaNumero: 'ASC' },
    });

    return seguimientos.map(seguimiento => this.mapSeguimiento(seguimiento));
  }

  public async cerrarEstancia(estanciaProlongadaId: number, body: CerrarEstanciaDto) {
    const estanciaRp = this.conn.getRepository(ProlongadaEstanciaOrm);

    const estancia = await estanciaRp.findOne({ where: { id: estanciaProlongadaId } });
    if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');
    if (!estancia.estado) throw new BadRequestException('La estancia ya esta cerrada');

    const fechaEgreso = new Date(body.fechaEgreso);
    if (fechaEgreso < estancia.fechaIngreso) {
      throw new BadRequestException(
        'La fecha de egreso no puede ser anterior a la fecha de ingreso'
      );
    }

    estancia.estado = false;
    estancia.fechaCierre = fechaEgreso;
    estancia.usuarioCerroId = this.auth.user.id;
    estancia.fechaEgreso = fechaEgreso;
    estancia.losTotal = body.losTotal;
    estancia.destinoFinalCodigo = body.destinoFinalCodigo;
    estancia.firmaMedico = body.firmaMedico?.trim() ?? null;
    estancia.losResultadoCodigo = body.losResultadoCodigo;
    estancia.barreraCriticaCodigo = body.barreraCriticaCodigo;
    estancia.accionEfectiva = body.accionEfectiva?.trim() ?? null;
    estancia.accionInefectiva = body.accionInefectiva?.trim() ?? null;
    estancia.leccionAprendida = body.leccionAprendida?.trim() ?? null;
    estancia.protocoloSuficienteCodigo = body.protocoloSuficienteCodigo;
    estancia.observacionesCierre = body.observacionesCierre?.trim() ?? null;
    estancia.updatedAt = new Date();

    const data = await estanciaRp.save(estancia);

    return {
      id: data.id,
      estado: data.estado ? 1 : 0,
      fechaCierre: data.fechaCierre,
      usuarioCerroId: data.usuarioCerroId,
      cierre: this.mapCierre(data, body.fechaEgreso),
    };
  }

  public async updateStay(id: number, body: UpdateEstanProDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const dominioItemRp = this.qr.manager.getRepository(DominioItemOrm);
      const estanciaRp = this.qr.manager.getRepository(ProlongadaEstanciaOrm);
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
        stay.nivelRiesgo = this.resolveRiskLevel(scoreTotal);

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
        const notificationUserIds = this.getNotificationUserIds(body.acciones);

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
        await this.validateNotificationUsers(notificationUserIds, gestorUsuarioRp);

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
        const notifications = this.createActionNotifications(
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

  public async updateAction(
    estanciaProlongadaId: number,
    actionId: number,
    body: UpdateDomainActionDto
  ) {
    const actionRp = this.conn.getRepository(DominioAccionesOrm);

    const action = await actionRp.findOne({
      where: {
        id: actionId,
        estanciaProlongadaId,
      },
      relations: ['estanciaProlongada', 'dominio'],
    });

    if (!action) throw new NotFoundException('Acción no encontrada para la estancia solicitada');

    if (body.estados !== undefined) action.estado = body.estados;
    if (body.responsable !== undefined) action.responsable = body.responsable?.trim() ?? null;
    if (body.estimatedDate !== undefined) {
      action.tiempoEstimado = body.estimatedDate ? new Date(body.estimatedDate) : null;
    }
    if (body.observacion !== undefined) action.observaciones = body.observacion?.trim() ?? null;

    const data = await actionRp.save(action);

    return data;
  }
}
