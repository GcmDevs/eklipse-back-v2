import { BadRequestException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { GCM_CONTEXTS } from '@common/domain/types';
import {
  MedicamentoOrm,
  EkEmpleadoOrm,
  VehiculoOrm,
  MedicamentoPrevioOrm,
  ProcedimientoOrm,
  ProcedimientoTempOrm,
  TrasladoAccidenteOrm,
  TrasladoAsignacionOrm,
  TrasladoAsistencialOrm,
  TrasladoNotaOrm,
  TrasladoSignosVitalesOrm,
  TrasladoTramoOrm,
} from '@hpn/lgc/tas/orm/gcn';
import { TIPOS_EMPLEADO } from '@hpn/lgc/tas/types/gcn';
import {
  ACCIDENTE_TRANSITO,
  AREAS_RECOGIDA_VALUES,
  ASISTENCIA_TIPOS,
  CONDICIONES_CLINICAS_CODES,
  ESTADOS_ASISTENCIA,
  recuperarClimaSegmentado,
  recuperarTipoVehiculoSegmentado,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import {
  CreatePrimarioSegmentadoDto,
  FinalizarPrimarioSegmentadoDto,
  TripulanteSegmentadoDto,
  UpdatePrimarioAccidenteDto,
  UpdatePrimarioCondicionDto,
  UpdatePrimarioDiagnosticoDto,
  UpdatePrimarioEntregaDto,
  UpdatePrimarioEvidenciasDto,
  UpdatePrimarioPacienteDto,
  UpdatePrimarioTripulacionDto,
  UpdatePrimarioUbicacionDto,
} from '@hpn/lgc/tas/presentation/dtos';
import { RecursosCompartidosSource } from '../../services';

@Injectable()
export class PrimarioSegmentadoImpl extends RecursosCompartidosSource {
  public async create(body: CreatePrimarioSegmentadoDto) {
    return this.inTransaction(async () => {
      this.validateOperationalDates(body);
      await this.pacienteConTrasladoActivo(body);
      const paciente = await this.resolvePaciente(body);
      const trasladoRp = this.qr.manager.getRepository(TrasladoAsistencialOrm);
      const tramoRp = this.qr.manager.getRepository(TrasladoTramoOrm);

      const traslado = await trasladoRp.save(
        trasladoRp.create({
          centroId: body.centroId,
          pacienteId: paciente.pacienteId,
          ekPacienteId: paciente.ekPacienteId,
          usuarioId: this.auth.id,
          cupsCode: body.cupsCode,
          tipoCode: ASISTENCIA_TIPOS.PRIMARIO.getCode(),
          estadoCode: ESTADOS_ASISTENCIA.CREADO.getCode(),
          tipoRemisionCode: body.tipoRemisionCode,
          otroTipoRemision: body.otroTipoRemision,
          fechaCreacion: new Date(),
          fechaProgramada: new Date(body.solicitadoEl),
          isDeleted: false,
        })
      );

      const tramo = await tramoRp.save(
        tramoRp.create({
          trasladoId: traslado.id,
          orden: 1,
          tipoTramoCode: 1,
          estadoCode: ESTADOS_ASISTENCIA.CREADO.getCode(),
          horaSolicitud: new Date(body.solicitadoEl),
          horaDespacho: new Date(body.despachoHora),
          horaLlegadaEscena: new Date(body.llegadaEscenaHora),
          horaSalidaEscena: new Date(body.salidaEscenaHora),
          horaInicioRecorrido: new Date(body.salidaEscenaHora),
          isActivo: true,
        })
      );

      await this.createEstadoHistorial({
        trasladoId: traslado.id,
        tramoId: tramo.id,
        estadoCode: ESTADOS_ASISTENCIA.CREADO.getCode(),
        observacion: 'Traslado primario segmentado creado',
        qr: this.qr,
      });

      return {
        trasladoId: traslado.id,
        estadoCode: traslado.estadoCode,
        motivoBloqueado: false,
        editable: true,
      };
    });
  }

  public async findById(trasladoId: number) {
    await this.qr.connect();
    try {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId);
      const trasladoRp = this.qr.manager.getRepository(TrasladoAsistencialOrm);
      const detalle = await this.buildTrasladoDetailBaseQuery(trasladoRp)
        .leftJoinAndSelect('t.diagnostico', 'diagnostico')
        .leftJoinAndSelect('t.diagSecundario', 'diagSecundario')
        .leftJoinAndSelect('paciente.direccion', 'direccionPacienteSeg')
        .leftJoinAndSelect('paciente.telefono', 'telefonoPacienteSeg')
        .leftJoinAndSelect('t.accidente', 'accidente')
        .leftJoinAndSelect('accidente.vehiculos', 'vehiculosInvolucrados')
        .andWhere('t.id = :trasladoId', { trasladoId })
        .andWhere('t.GENUSUARIO = :usuarioId', { usuarioId: this.auth.id })
        .getOne();

      const [
        signosVitales,
        procedimientos,
        medicamentos,
        notas,
        medicamentosPrevios,
        asignaciones,
      ] = await Promise.all([
        this.qr.manager.getRepository(TrasladoSignosVitalesOrm).find({ where: { trasladoId } }),
        this.qr.manager.getRepository(ProcedimientoOrm).find({ where: { trasladoId }, relations: ['procedimiento'] }),
        this.qr.manager.getRepository(MedicamentoOrm).find({ where: { trasladoId }, relations: ['medicamento'] }),
        this.qr.manager.getRepository(TrasladoNotaOrm).find({ where: { trasladoId } }),
        this.qr.manager.getRepository(MedicamentoPrevioOrm).find({ where: { trasladoId }, relations: ['medicamento'] }),
        this.qr.manager.getRepository(TrasladoAsignacionOrm).find({ where: { trasladoId } }),
      ]);

      const catalogos = await this.catalogosSegmentadosEklipse(asignaciones, procedimientos);
      return {
        ...detalle,
        accidente: detalle?.accidente && traslado.tipoRemisionCode === ACCIDENTE_TRANSITO.getCode()
          ? this.accidenteParaRespuesta(detalle.accidente)
          : null,
        signosVitales,
        procedimientos: catalogos.procedimientos,
        medicamentos,
        notas,
        medicamentosPrevios,
        asignaciones: catalogos.asignaciones,
        motivoBloqueado: !!detalle?.accidente,
        editable: traslado.estadoCode === ESTADOS_ASISTENCIA.CREADO.getCode(),
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    } finally {
      if (!this.qr.isReleased) await this.qr.release();
    }
  }

  private accidenteParaRespuesta(accidente: TrasladoAccidenteOrm) {
    // Compatibilidad de lectura con registros previos al catálogo numérico.
    // Las nuevas escrituras reciben códigos numéricos validados en el DTO.
    const { area, clima, vehiculos, ...datos } = accidente;
    const valor = area == null ? '' : String(area).trim();
    const opcion = AREAS_RECOGIDA_VALUES.find(item =>
      String(item.getCode()) === valor || item.getForHumans().toUpperCase() === valor.toUpperCase()
    );
    if (valor && !opcion) {
      throw new Error('El área de recogida guardada no corresponde a un código válido (1: Urbana, 2: Rural).');
    }
    return {
      ...datos,
      areaCode: opcion?.getCode() ?? null,
      climaCode: recuperarClimaSegmentado(clima),
      vehiculos: (vehiculos ?? []).map(({ tipo, ...vehiculo }) => ({
        ...vehiculo,
        tipoCode: recuperarTipoVehiculoSegmentado(tipo, vehiculo.id),
      })),
    };
  }

  private async catalogosSegmentadosEklipse(
    asignaciones: TrasladoAsignacionOrm[],
    procedimientos: ProcedimientoOrm[]
  ) {
    const vehiculoIds = this.uniqueNumbers(asignaciones.map(item => item.vehiculoId));
    const empleadoIds = this.uniqueNumbers(asignaciones.flatMap(item => [item.conductorId, item.auxiliarId, item.medicoId]));
    const procedimientoIds = this.uniqueNumbers(procedimientos.map(item => item.ekprocedimientoId));
    if (!vehiculoIds.length && !empleadoIds.length && !procedimientoIds.length)
      return { asignaciones, procedimientos };

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    try {
      await ekQr.connect();
      const [vehiculos, empleados, temporales] = await Promise.all([
        vehiculoIds.length ? ekQr.manager.getRepository(VehiculoOrm).find({ where: { id: In(vehiculoIds) } }) : Promise.resolve([]),
        empleadoIds.length ? ekQr.manager.getRepository(EkEmpleadoOrm).find({ where: { id: In(empleadoIds) } }) : Promise.resolve([]),
        procedimientoIds.length ? ekQr.manager.getRepository(ProcedimientoTempOrm).find({ where: { id: In(procedimientoIds) } }) : Promise.resolve([]),
      ]);
      const vehiculoMap = new Map(vehiculos.map(item => [item.id, item]));
      const empleadoMap = new Map(empleados.map(item => [item.id, item]));
      const procedimientoMap = new Map(temporales.map(item => [item.id, item]));
      return {
        asignaciones: asignaciones.map(item => {
          const datos = this.enrichAsignacion(item, vehiculoMap, empleadoMap);
          return { ...item, ...datos, vehiculo: datos.vehiculo ? { ...datos.vehiculo, placa: datos.vehiculo.nombre } : null };
        }),
        procedimientos: procedimientos.map(item => ({
          ...item,
          ekprocedimiento: item.ekprocedimientoId ? procedimientoMap.get(item.ekprocedimientoId) ?? null : item.ekprocedimiento,
        })),
      };
    } finally {
      if (!ekQr.isReleased) await ekQr.release();
    }
  }

  public async updatePaciente(trasladoId: number, body: UpdatePrimarioPacienteDto) {
    return this.inTransaction(async () => {
      this.validateOperationalDates(body);
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      const accidentExists = await this.qr.manager
        .getRepository(TrasladoAccidenteOrm)
        .exist({ where: { trasladoId } });
      if (
        accidentExists &&
        traslado.tipoRemisionCode === ACCIDENTE_TRANSITO.getCode() &&
        body.tipoRemisionCode !== ACCIDENTE_TRANSITO.getCode()
      ) {
        throw new Error(
          'No se puede cambiar el motivo porque el traslado ya tiene informacion de accidente de transito'
        );
      }

      const paciente = await this.resolvePaciente(body);
      Object.assign(traslado, {
        centroId: body.centroId,
        cupsCode: body.cupsCode,
        pacienteId: paciente.pacienteId,
        ekPacienteId: paciente.ekPacienteId,
        tipoRemisionCode: body.tipoRemisionCode,
        otroTipoRemision: body.otroTipoRemision,
      });
      await this.qr.manager.getRepository(TrasladoAsistencialOrm).save(traslado);

      const tramo = await this.qr.manager
        .getRepository(TrasladoTramoOrm)
        .findOneOrFail({ where: { trasladoId, orden: 1 } });
      Object.assign(tramo, {
        horaSolicitud: new Date(body.solicitadoEl),
        horaDespacho: new Date(body.despachoHora),
        horaLlegadaEscena: new Date(body.llegadaEscenaHora),
        horaSalidaEscena: new Date(body.salidaEscenaHora),
        horaInicioRecorrido: new Date(body.salidaEscenaHora),
      });
      await this.qr.manager.getRepository(TrasladoTramoOrm).save(tramo);
      return { trasladoId, result: true, motivoBloqueado: accidentExists };
    });
  }

  public async updateUbicacion(trasladoId: number, body: UpdatePrimarioUbicacionDto) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      const tramoRp = this.qr.manager.getRepository(TrasladoTramoOrm);
      const tramo = await tramoRp.findOneOrFail({ where: { trasladoId, orden: 1 } });
      const origen = await this.resolveUbicacionSegmentada(body.origen, tramo, 'origen');
      const destino = await this.resolveUbicacionSegmentada(body.destino, tramo, 'destino');
      Object.assign(tramo, {
        origenId: origen.origenId,
        ekOrigenId: origen.ekOrigenId,
        destinoId: destino.origenId,
        ekDestinoId: destino.ekOrigenId,
      });
      await tramoRp.save(tramo);

      if (traslado.tipoRemisionCode === ACCIDENTE_TRANSITO.getCode()) {
        const accidente = await this.getOrCreateAccident(trasladoId);
        Object.assign(accidente, {
          area: body.areaCode,
          latitudOrigen: body.latitudOrigen,
          longitudOrigen: body.longitudOrigen,
          barrioOrigen: body.barrioOrigen,
          referenciaOrigen: body.referenciaOrigen,
          veredaOrigen: body.veredaOrigen,
          viaOrigen: body.viaOrigen,
          kilometroOrigen: body.kilometroOrigen,
        });
        await this.qr.manager.getRepository(TrasladoAccidenteOrm).save(accidente);
      }
      return { trasladoId, result: true };
    });
  }

  public async updateDiagnostico(
    trasladoId: number,
    body: UpdatePrimarioDiagnosticoDto,
    bodyMapImageName?: string
  ) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      if (body.eliminarMapaCorporal && (bodyMapImageName || body.bodyMapImageName)) {
        throw new Error('No puede cargar y eliminar el mapa corporal en la misma solicitud');
      }
      const mapaAnterior = traslado.triageImg;
      const mapaActual = body.eliminarMapaCorporal
        ? null
        : (bodyMapImageName ?? (body.bodyMapImageName?.trim() || traslado.triageImg));
      Object.assign(traslado, {
        diagnosticoId: body.diagPrincipalId,
        diagSecundarioId: body.diagSecundarioId,
        hallazgos: body.hallazgosClinicos,
        triageCode: body.triage,
        triageImg: mapaActual,
      });
      await this.qr.manager.getRepository(TrasladoAsistencialOrm).save(traslado);
      return {
        trasladoId,
        result: true,
        archivoAnterior: mapaAnterior && mapaAnterior !== mapaActual ? mapaAnterior : null,
      };
    });
  }

  public async updateCondicion(trasladoId: number, body: UpdatePrimarioCondicionDto) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      const condiciones = body.condicionesClinicas ?? [];
      if (new Set(condiciones).size !== condiciones.length) {
        throw new Error('Las condiciones clinicas no pueden contener codigos repetidos');
      }
      if (condiciones.some(codigo => !CONDICIONES_CLINICAS_CODES.includes(codigo))) {
        throw new Error('Las condiciones clinicas deben corresponder al catalogo vigente');
      }

      let fechaVistoBien: Date = null;
      if (condiciones.length) {
        if (typeof body.prenotificaAlSitio !== 'boolean') {
          throw new Error('prenotificaAlSitio es obligatorio cuando existe una condicion clinica');
        }
        this.validateFechaRegistro(
          body.fechaHoraVistoBienPaciente,
          'La fecha y hora de visto bueno'
        );
        fechaVistoBien = new Date(body.fechaHoraVistoBienPaciente);
        const tramo = await this.getTramoPrincipalOrFail(trasladoId);
        if (tramo.horaSolicitud && fechaVistoBien < tramo.horaSolicitud) {
          throw new Error('La última vez visto bien no puede ser anterior a la solicitud');
        }
        if (!body.medicamentosPrevios?.length) {
          throw new Error('Debe registrar al menos un medicamento previo');
        }
        body.medicamentosPrevios.forEach((medicamento, index) => {
          if (!medicamento.medicamentoId && !medicamento.descripcion?.trim()) {
            throw new Error(
              `El medicamento previo ${index + 1} debe tener medicamentoId, descripcion o ambos`
            );
          }
        });
      }

      traslado.condicionClinica = condiciones.length ? condiciones.join(',') : null;
      traslado.fechaHoraVistoBien = fechaVistoBien;
      traslado.prenotificaAlSitio = condiciones.length ? body.prenotificaAlSitio : null;
      await this.qr.manager.getRepository(TrasladoAsistencialOrm).save(traslado);
      await this.qr.manager.getRepository(MedicamentoPrevioOrm).delete({ trasladoId });
      if (condiciones.length && body.medicamentosPrevios?.length) {
        await this.createMedicamentosPrevios(trasladoId, body.medicamentosPrevios);
      }
      return { trasladoId, result: true };
    });
  }

  public async updateTripulacion(trasladoId: number, body: UpdatePrimarioTripulacionDto) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      const tramo = await this.qr.manager
        .getRepository(TrasladoTramoOrm)
        .findOneOrFail({ where: { trasladoId, orden: 1 } });
      const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
      await ekQr.connect();
      try {
        const { empleado: tripulanteAutenticado, rol } = await this.getTripulanteAutenticado(ekQr);
        const autenticado: TripulanteSegmentadoDto = {
          id: tripulanteAutenticado.id,
          nombre: tripulanteAutenticado.nombre,
          documento: tripulanteAutenticado.documento,
        };

        const campoAutenticado = rol === 'AUXILIAR' ? body.auxiliar : body.medico;
        if (
          campoAutenticado &&
          `${campoAutenticado.documento}`.trim() !== `${autenticado.documento}`.trim()
        ) {
          throw new BadRequestException(
            `No es posible asignar otro ${rol.toLowerCase()}. El traslado debe incluir al usuario autenticado`
          );
        }

        const payloadAsignacion = {
          ...body,
          auxiliar: rol === 'AUXILIAR' ? autenticado : body.auxiliar,
          medico: rol === 'MEDICO' ? autenticado : body.medico,
        };

        if (!payloadAsignacion.auxiliar) {
          throw new BadRequestException('Debe seleccionar un auxiliar para la tripulacion');
        }

        this.validateDocumentosUnicos(
          payloadAsignacion.conductor,
          payloadAsignacion.auxiliar,
          payloadAsignacion.medico
        );

        const resources = await this.resolveAssignmentResources(payloadAsignacion as any, ekQr);

        if (!resources.vehiculo || !resources.conductor || !resources.auxiliar) {
          throw new Error('Vehiculo, conductor y auxiliar son obligatorios');
        }
        if (resources.conductor.tipoCode !== TIPOS_EMPLEADO.CONDUCTOR.getCode()) {
          throw new BadRequestException(
            'El tripulante seleccionado no esta registrado como conductor'
          );
        }
        if (resources.auxiliar.tipoCode !== TIPOS_EMPLEADO.AUXILIAR.getCode()) {
          throw new BadRequestException(
            'El tripulante seleccionado no esta registrado como auxiliar'
          );
        }
        if (resources.medico && resources.medico.tipoCode !== TIPOS_EMPLEADO.MEDICO.getCode()) {
          throw new BadRequestException(
            'El tripulante seleccionado no esta registrado como medico'
          );
        }
        const asignacionRp = this.qr.manager.getRepository(TrasladoAsignacionOrm);
        const asignaciones = await asignacionRp.find({
          where: { trasladoId, tramoId: tramo.id },
          order: { fechaAsignacion: 'DESC', id: 'DESC' },
        });
        const asignacion = asignaciones.find(item => item.isActiva) ?? asignaciones[0];

        const asignacionNoIncluyeAutenticado =
          asignacion &&
          (rol === 'AUXILIAR'
            ? asignacion.auxiliarId !== tripulanteAutenticado.id
            : asignacion.medicoId !== tripulanteAutenticado.id);
        if (asignacionNoIncluyeAutenticado) {
          throw new Error(
            'La asignacion existente no incluye al usuario autenticado en el rol correspondiente'
          );
        }

        const asignacionesActivasAdicionales = asignaciones.filter(
          item => item.isActiva && item.id !== asignacion?.id
        );

        if (asignacionesActivasAdicionales.length) {
          asignacionesActivasAdicionales.forEach(item => {
            item.isActiva = false;
            item.estadoCode = ESTADOS_ASISTENCIA.REASIGNADO.getCode();
            item.fechaDesasignacion = new Date();
          });
          await asignacionRp.save(asignacionesActivasAdicionales);
        }

        if (asignacion) {
          asignacion.vehiculoId = resources.vehiculo.id;
          asignacion.conductorId = resources.conductor.id;
          asignacion.auxiliarId = resources.auxiliar.id;
          asignacion.medicoId = resources.medico?.id ?? null;
          asignacion.estadoCode = ESTADOS_ASISTENCIA.ASIGNADO.getCode();
          asignacion.isActiva = true;
          asignacion.fechaDesasignacion = null;
          await asignacionRp.save(asignacion);
        } else {
          await asignacionRp.save(
            asignacionRp.create({
              trasladoId,
              tramoId: tramo.id,
              vehiculoId: resources.vehiculo.id,
              conductorId: resources.conductor.id,
              auxiliarId: resources.auxiliar.id,
              medicoId: resources.medico?.id,
              asignadoPorId: this.auth.id,
              estadoCode: ESTADOS_ASISTENCIA.ASIGNADO.getCode(),
              fechaAsignacion: new Date(),
              isActiva: true,
              centroProcesamiento: this.auth.context.getNumericCode(),
            })
          );
        }
        traslado.acompananteNombre = body.acompananteNombre;
        traslado.acompananteDocumento = body.acompananteDocumento;
        /*     traslado.tipoTrasladoCode = body.tipoTrasladoCode ?? traslado.tipoTrasladoCode; */
        await this.qr.manager.getRepository(TrasladoAsistencialOrm).save(traslado);
        tramo.tipoTrasladoCode = traslado.tipoTrasladoCode;
        await this.qr.manager.getRepository(TrasladoTramoOrm).save(tramo);
      } finally {
        await ekQr.release();
      }
      return { trasladoId, result: true };
    });
  }

  public async updateAccidente(trasladoId: number, body: UpdatePrimarioAccidenteDto) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      this.ensureAccident(traslado);
      const accidente = await this.getOrCreateAccident(trasladoId);
      const { climaCode, ...datos } = body;
      Object.assign(accidente, datos, { clima: climaCode });
      await this.qr.manager.getRepository(TrasladoAccidenteOrm).save(accidente);
      return { trasladoId, accidenteId: accidente.id, result: true };
    });
  }

  public async updateEntrega(trasladoId: number, body: UpdatePrimarioEntregaDto) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      this.ensureAccident(traslado);
      if (typeof body.relato !== 'string' || !body.relato.trim()) {
        throw new Error('El relato de la entrega es obligatorio');
      }
      traslado.servicioRequeridoId = body.servicioRequeridoId;
      await this.qr.manager.getRepository(TrasladoAsistencialOrm).save(traslado);
      const accidente = await this.getOrCreateAccident(trasladoId);
      Object.assign(accidente, {
        pertenenciasEntregadas: body.pertenenciasEntregadas,
        relato: body.relato.trim(),
        custodia: body.custodia,
        consentimientoOtorgadoPor: body.consentimientoOtorgadoPor,
      });
      await this.qr.manager.getRepository(TrasladoAccidenteOrm).save(accidente);
      return { trasladoId, result: true };
    });
  }

  public async updateEvidencias(
    trasladoId: number,
    body: UpdatePrimarioEvidenciasDto,
    files: Express.Multer.File[] = []
  ) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      this.ensureAccident(traslado);
      await this.getOrCreateAccident(trasladoId);
      const tramoRp = this.qr.manager.getRepository(TrasladoTramoOrm);
      const tramo = await tramoRp.findOneOrFail({ where: { trasladoId, orden: 1 } });
      const anteriores = tramo.archivos ?? [];
      const anterioresPorNombre = new Map(anteriores.map(item => [item.nombre, item]));
      const nombresExistentes = (body.existentes ?? []).map(item => item.nombre);
      if (new Set(nombresExistentes).size !== nombresExistentes.length) {
        throw new Error('Las evidencias existentes no pueden contener nombres repetidos');
      }
      const evidenciaAjena = nombresExistentes.find(nombre => !anterioresPorNombre.has(nombre));
      if (evidenciaAjena) {
        throw new Error(`La evidencia ${evidenciaAjena} no pertenece al traslado`);
      }
      const metadata = files.map((file, index) => {
        const declared =
          body.nuevas?.find(item => item.nombre === file.originalname) ?? body.nuevas?.[index];
        return {
          nombre: file.filename,
          descripcion: declared?.descripcion ?? file.originalname,
          categoria: declared?.categoria ?? 'sitio',
          ruta: file.path,
          tipo: file.mimetype,
          tamano: file.size,
        };
      });
      const existentes = (body.existentes ?? []).map(item => {
        const almacenada = anterioresPorNombre.get(item.nombre);
        return {
          ...almacenada,
          descripcion: item.descripcion ?? almacenada.descripcion ?? almacenada.nombre,
          categoria: item.categoria,
        };
      });
      const nombresConservados = new Set(nombresExistentes);
      const archivosEliminados = anteriores
        .filter(item => !nombresConservados.has(item.nombre))
        .map(item => item.nombre);
      tramo.archivos = [...existentes, ...metadata];
      await tramoRp.save(tramo);
      return {
        trasladoId,
        evidencias: tramo.archivos,
        archivosEliminados,
        result: true,
      };
    });
  }

  public async finalizar(
    trasladoId: number,
    body: FinalizarPrimarioSegmentadoDto,
    signatureName?: string
  ) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
      this.ensureEditable(traslado);
      const tramoRp = this.qr.manager.getRepository(TrasladoTramoOrm);
      const tramo = await tramoRp.findOneOrFail({ where: { trasladoId, orden: 1 } });
      const seccionesPendientes = await this.validarSeccionesParaFinalizar(
        traslado,
        tramo,
        body,
        signatureName
      );
      if (seccionesPendientes.length) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'No se puede finalizar el traslado porque tiene secciones incompletas',
          completo: false,
          seccionesPendientes,
        });
      }

      const llegada = new Date(body.llegadaInstitucionHora);
      const recepcion = new Date(body.recepcionInstitucionHora);

      Object.assign(tramo, {
        horaLlegadaInst: llegada,
        horaRecepcionInst: recepcion,
        kmInicial: body.kmInicial,
        kmFinal: body.kmFinal,
        recibidoPorNombre: body.recibidoPorNombre.trim(),
        recibidoPorDocumento: body.recibidoPorDocumento.trim(),
        firmaImg: signatureName ?? body.recibidoPorFirmaImg,
        estadoCode: ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
        isActivo: false,
      });
      await tramoRp.save(tramo);
      traslado.kmInicial = body.kmInicial;
      traslado.estadoPacienteCode = body.estadoPacienteCode;
      traslado.estadoCode = ESTADOS_ASISTENCIA.FINALIZADO.getCode();
      await this.qr.manager.getRepository(TrasladoAsistencialOrm).save(traslado);
      await this.qr.manager.getRepository(TrasladoAsignacionOrm).update(
        { trasladoId, isActiva: true },
        {
          isActiva: false,
          estadoCode: ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
          // Cierre de la asignación en el sistema; la recepción clínica se conserva en el tramo.
          fechaDesasignacion: new Date(),
        }
      );
      await this.createEstadoHistorial({
        trasladoId,
        tramoId: tramo.id,
        estadoCode: ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
        observacion: 'Traslado primario segmentado finalizado',
        qr: this.qr,
      });
      return { trasladoId, result: true };
    });
  }
}
