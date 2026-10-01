import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  DominioAccionesOrm,
  DominioAccionNotificacionOrm,
  DominioItemOrm,
  DominioOrm,
  EstanciaItemPreguntasOrm,
  GestorEstanciaProlongadaUsuarioOrm,
  ProlongadaEstanciaOrm,
  SeguimientoSemanaOrm,
} from '@orm/hpn/estancia-prolongadas';
import { EstanciaService } from './estancia.service';

type MockRepository = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

const createRepository = (): MockRepository => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(payload => payload),
  save: jest.fn(async payload => ({ id: 100, createdAt: new Date('2026-05-05T21:00:00.000Z'), ...payload })),
});

const createService = () => {
  const dominioItemRepository = createRepository();
  const preguntasRepository = createRepository();
  const dominioAccionesRepository = createRepository();
  const accionNotificacionRepository = createRepository();
  const dominioRepository = createRepository();
  const gestorUsuarioRepository = createRepository();
  const estanciaRepository = createRepository();
  const seguimientoRepository = createRepository();
  const repositories = new Map<any, MockRepository>([
    [DominioItemOrm, dominioItemRepository],
    [EstanciaItemPreguntasOrm, preguntasRepository],
    [DominioAccionesOrm, dominioAccionesRepository],
    [DominioAccionNotificacionOrm, accionNotificacionRepository],
    [DominioOrm, dominioRepository],
    [GestorEstanciaProlongadaUsuarioOrm, gestorUsuarioRepository],
    [ProlongadaEstanciaOrm, estanciaRepository],
    [SeguimientoSemanaOrm, seguimientoRepository],
  ]);
  const service = Object.create(EstanciaService.prototype) as EstanciaService;

  Object.defineProperty(service, 'conn', {
    value: {
      getRepository: jest.fn(entity => repositories.get(entity)),
    },
  });
  Object.defineProperty(service, 'qr', {
    value: {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        getRepository: jest.fn(entity => repositories.get(entity)),
      },
    },
  });
  Object.defineProperty(service, 'auth', {
    get: () => ({
      user: {
        id: 7,
        nombre: 'Disneris Ruiz',
      },
    }),
  });

  return {
    service: service as any,
    qr: (service as any).qr,
    dominioItemRepository,
    preguntasRepository,
    dominioAccionesRepository,
    accionNotificacionRepository,
    dominioRepository,
    gestorUsuarioRepository,
    estanciaRepository,
    seguimientoRepository,
  };
};

describe('EstanciaService createStay', () => {
  it('crea la estancia y persiste seguimientos iniciales reutilizando la logica de seguimiento', async () => {
    const {
      service,
      qr,
      dominioItemRepository,
      estanciaRepository,
      seguimientoRepository,
      preguntasRepository,
    } = createService();

    dominioItemRepository.find.mockResolvedValue([
      {
        id: 11,
        puntos: 10,
        titulo: 'Item 1',
        subTitulo: 'Detalle',
        dominio: { titulo: 'Dominio 1' },
      },
    ]);
    estanciaRepository.findOne.mockResolvedValue({
      id: 100,
      estado: true,
      preguntas: [],
      acciones: [],
      seguimientos: [],
    });

    const result = await service.createStay({
      paciente: {
        fechaIngreso: '2026-05-05T12:00:00.000Z',
        ingreso: 123,
        nombrePaciente: 'Paciente Test',
        documento: '100200300',
        age: 50,
        cama: 'C-101',
        auditor: 'Auditora Test',
        currentLos: 7,
        sede: 'Sede Norte',
      },
      selectedItemIds: [11],
      seguimientos: [
        {
          semanaNumero: 1,
          fechaSeguimiento: '2026-05-12',
          estadoCodigo: 1,
          responsable: ' Disneris Ruiz ',
          observaciones: ' Seguimiento inicial ',
        },
      ],
    });

    expect(qr.startTransaction).toHaveBeenCalled();
    expect(preguntasRepository.save).toHaveBeenCalled();
    expect(seguimientoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        estanciaProlongadaId: 100,
        semanaNumero: 1,
        responsable: 'Disneris Ruiz',
        observaciones: 'Seguimiento inicial',
        usuarioCreacionId: 7,
      })
    );
    expect(seguimientoRepository.save).toHaveBeenCalledTimes(1);
    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: 100,
      })
    );
  });

  it('crea notificaciones para los usuarios seleccionados en las acciones', async () => {
    const {
      service,
      dominioItemRepository,
      dominioRepository,
      dominioAccionesRepository,
      accionNotificacionRepository,
      gestorUsuarioRepository,
      estanciaRepository,
    } = createService();

    dominioItemRepository.find.mockResolvedValue([
      {
        id: 11,
        puntos: 10,
        titulo: 'Item 1',
        subTitulo: 'Detalle',
        dominio: { titulo: 'Dominio 1' },
      },
    ]);
    dominioRepository.find.mockResolvedValue([{ id: 5 }]);
    gestorUsuarioRepository.find.mockResolvedValue([
      { id: 21, usuarioId: 3001, estado: true },
      { id: 22, usuarioId: 3002, estado: true },
    ]);
    dominioAccionesRepository.save.mockResolvedValue([
      {
        id: 501,
        estanciaProlongadaId: 100,
        accionEspecifica: 'Gestionar autorizacion',
      },
    ]);
    estanciaRepository.findOne.mockResolvedValue({
      id: 100,
      estado: true,
      preguntas: [],
      acciones: [],
      seguimientos: [],
    });

    await service.createStay({
      paciente: {
        fechaIngreso: '2026-05-05T12:00:00.000Z',
        ingreso: 123,
        nombrePaciente: 'Paciente Test',
        documento: '100200300',
        age: 50,
        cama: 'C-101',
        auditor: 'Auditora Test',
        currentLos: 7,
        sede: 'Sede Norte',
      },
      selectedItemIds: [11],
      acciones: [
        {
          dominioId: 5,
          accionEspecifica: ' Gestionar autorizacion ',
          usuarioIds: [3001, 3002],
        },
      ],
    });

    expect(gestorUsuarioRepository.find).toHaveBeenCalledWith({
      where: { usuarioId: expect.any(Object), estado: true },
    });
    expect(accionNotificacionRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        usuarioId: 3001,
        estanciaProlongadaId: 100,
        accionId: 501,
        descripcion: 'Nueva accion asignada: Gestionar autorizacion',
        visto: false,
      }),
      expect.objectContaining({
        usuarioId: 3002,
        estanciaProlongadaId: 100,
        accionId: 501,
        descripcion: 'Nueva accion asignada: Gestionar autorizacion',
        visto: false,
      }),
    ]);
  });
});

describe('EstanciaService getStaysActivo', () => {
  it('lista solo las estancias activas creadas por el usuario autenticado', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.find.mockResolvedValue([{ id: 100, estado: true, usuarioCreacionId: 7 }]);

    const result = await service.getStaysActivo();

    expect(estanciaRepository.find).toHaveBeenCalledWith({
      where: { estado: true, usuarioCreacionId: 7 },
      order: { createdAt: 'DESC' },
      relations: ['preguntas', 'acciones', 'seguimientos'],
    });
    expect(result).toHaveLength(1);
    expect(result[0].usuarioCreacionId).toBe(7);
  });

  it('retorna 404 cuando el usuario no tiene estancias activas creadas', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.find.mockResolvedValue([]);

    await expect(service.getStaysActivo()).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('EstanciaService seguimientos', () => {
  it('retorna 404 cuando la estancia no existe al crear seguimiento', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.crearSeguimiento(45, {
        semanaNumero: 1,
        fechaSeguimiento: '2026-05-05',
        estadoCodigo: 1,
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retorna 403 cuando la estancia esta cerrada al crear seguimiento', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({ id: 45, estado: false });

    await expect(
      service.crearSeguimiento(45, {
        semanaNumero: 1,
        fechaSeguimiento: '2026-05-05',
        estadoCodigo: 1,
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('retorna 400 cuando la semana ya existe para la estancia', async () => {
    const { service, estanciaRepository, seguimientoRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({ id: 45, estado: true });
    seguimientoRepository.findOne.mockResolvedValue({ id: 1 });

    await expect(
      service.crearSeguimiento(45, {
        semanaNumero: 1,
        fechaSeguimiento: '2026-05-05',
        estadoCodigo: 1,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna 400 cuando falta la semana anterior', async () => {
    const { service, estanciaRepository, seguimientoRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({ id: 45, estado: true });
    seguimientoRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(
      service.crearSeguimiento(45, {
        semanaNumero: 3,
        fechaSeguimiento: '2026-05-19',
        estadoCodigo: 1,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crea semana critica desde semana 4 y mapea catalogos por codigo', async () => {
    const { service, estanciaRepository, seguimientoRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({ id: 45, estado: true });
    seguimientoRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 3 });

    const result = await service.crearSeguimiento(45, {
      semanaNumero: 4,
      fechaSeguimiento: '2026-05-26',
      estadoCodigo: 1,
      destinoCodigo: 1,
      accionCodigo: 3,
      responsable: ' Disneris Ruiz ',
      egresoEstimado: '2026-06-02',
      observaciones: ' Observacion ',
    });

    expect(seguimientoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        estanciaProlongadaId: 45,
        semanaNumero: 4,
        esCritica: true,
        estadoCodigo: 1,
        destinoCodigo: 1,
        accionCodigo: 3,
        responsable: 'Disneris Ruiz',
        observaciones: 'Observacion',
        usuarioCreacionId: 7,
      })
    );
    expect(result.estado.getCode()).toBe(1);
    expect(result.destino.getForHumans()).toBe('Domicilio con cuidador');
    expect(result.accion.getCode()).toBe(3);
  });

  it('lista seguimientos ordenados y mapeados', async () => {
    const { service, estanciaRepository, seguimientoRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({ id: 45, estado: true });
    seguimientoRepository.find.mockResolvedValue([
      {
        id: 1,
        estanciaProlongadaId: 45,
        semanaNumero: 1,
        fechaSeguimiento: new Date('2026-05-05T00:00:00.000Z'),
        esCritica: false,
        estadoCodigo: 1,
      },
    ]);

    const result = await service.listarSeguimientos(45);

    expect(seguimientoRepository.find).toHaveBeenCalledWith({
      where: { estanciaProlongadaId: 45 },
      order: { semanaNumero: 'ASC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].estado.getForHumans()).toBe('Sin cambio');
  });
});

describe('EstanciaService cierre', () => {
  it('retorna 404 cuando la estancia no existe al cerrar', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.cerrarEstancia(45, {
        fechaEgreso: '2026-05-20',
        losTotal: 42,
        destinoFinalCodigo: 1,
        losResultadoCodigo: 2,
        barreraCriticaCodigo: 2,
        protocoloSuficienteCodigo: 2,
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retorna 400 cuando la estancia ya esta cerrada', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({ id: 45, estado: false });

    await expect(
      service.cerrarEstancia(45, {
        fechaEgreso: '2026-05-20',
        losTotal: 42,
        destinoFinalCodigo: 1,
        losResultadoCodigo: 2,
        barreraCriticaCodigo: 2,
        protocoloSuficienteCodigo: 2,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna 400 cuando fechaEgreso es anterior a fechaIngreso', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({
      id: 45,
      estado: true,
      fechaIngreso: new Date('2026-05-21T00:00:00.000Z'),
    });

    await expect(
      service.cerrarEstancia(45, {
        fechaEgreso: '2026-05-20',
        losTotal: 42,
        destinoFinalCodigo: 1,
        losResultadoCodigo: 2,
        barreraCriticaCodigo: 2,
        protocoloSuficienteCodigo: 2,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cierra la estancia guardando codigos y retorna catalogos mapeados', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.findOne.mockResolvedValue({
      id: 45,
      estado: true,
      fechaIngreso: new Date('2026-05-01T00:00:00.000Z'),
    });

    const result = await service.cerrarEstancia(45, {
      fechaEgreso: '2026-05-20',
      losTotal: 42,
      destinoFinalCodigo: 1,
      firmaMedico: ' Dr. Carlos Mendez ',
      losResultadoCodigo: 2,
      barreraCriticaCodigo: 2,
      accionEfectiva: ' Accion efectiva ',
      accionInefectiva: ' Accion inefectiva ',
      leccionAprendida: ' Leccion ',
      protocoloSuficienteCodigo: 2,
      observacionesCierre: ' Observaciones ',
    });

    expect(estanciaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: false,
        usuarioCerroId: 7,
        losTotal: 42,
        destinoFinalCodigo: 1,
        firmaMedico: 'Dr. Carlos Mendez',
        losResultadoCodigo: 2,
        barreraCriticaCodigo: 2,
        protocoloSuficienteCodigo: 2,
      })
    );
    expect(result.estado).toBe(0);
    expect(result.cierre.destinoFinal.getCode()).toBe(1);
    expect(result.cierre.losResultado.getForHumans()).toBe('mayor_controlado');
  });
});

describe('EstanciaService activity feed', () => {
  it('retorna eventos derivados ordenados por timestamp descendente con meta', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.find.mockResolvedValue([
      {
        id: 45,
        nombrePaciente: 'Juan Carlos Perez Lopez',
        documento: '10234567',
        sede: 'Sede Norte',
        fechaIngreso: new Date('2026-04-16T00:00:00.000Z'),
        createdAt: new Date('2026-04-16T08:00:00.000Z'),
        estado: true,
        currentLos: 22,
        scoreTotal: 42,
        nivelRiesgo: 'alto',
        auditor: 'Maria Gonzalez',
        seguimientos: [
          {
            id: 11,
            semanaNumero: 4,
            esCritica: true,
            createdAt: new Date('2026-05-08T15:30:00.000Z'),
            usuarioCreacionId: 7,
            creadoPor: 'Maria Gonzalez',
          },
        ],
        acciones: [],
      },
      {
        id: 46,
        nombrePaciente: 'Ana Maria Rodriguez',
        documento: '52098765',
        sede: 'Sede Sur',
        fechaIngreso: new Date('2026-04-29T00:00:00.000Z'),
        createdAt: new Date('2026-04-29T09:00:00.000Z'),
        estado: true,
        currentLos: 10,
        scoreTotal: 20,
        nivelRiesgo: 'moderado',
        auditor: 'Carlos Medina',
        seguimientos: [
          {
            id: 12,
            semanaNumero: 2,
            esCritica: false,
            estadoCodigo: 1,
            createdAt: new Date('2026-05-08T14:15:00.000Z'),
            creadoPor: 'Carlos Medina',
          },
        ],
        acciones: [],
      },
    ]);

    const result = await service.obtenerActivityFeed({ limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBeGreaterThanOrEqual(2);
    expect(result.meta.returned).toBe(2);
    expect(result.kpis).toEqual({
      moderado: 1,
      critico: 1,
      alto: 1,
      cerrado: 0,
    });
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        eventType: 'escalada_activada',
        severity: 'critical',
        pacienteNombre: 'Juan Carlos Perez Lopez',
        pacienteDoc: '10234567',
        sede: 'Sede Norte',
        losActual: 22,
        semanaSeguimiento: 4,
        requiereAtencion: true,
      })
    );
    expect(result.data[0].timestamp).toMatch(/-05:00$/);
    expect(result.data[1].eventType).toBe('seguimiento_guardado');
  });

  it('filtra por severidad y requiereAtencion', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.find.mockResolvedValue([
      {
        id: 45,
        nombrePaciente: 'Juan Carlos Perez Lopez',
        documento: '10234567',
        sede: 'Sede Norte',
        fechaIngreso: new Date('2026-04-16T00:00:00.000Z'),
        createdAt: new Date('2026-04-16T08:00:00.000Z'),
        estado: true,
        currentLos: 22,
        scoreTotal: 42,
        auditor: 'Maria Gonzalez',
        seguimientos: [],
        acciones: [],
      },
      {
        id: 46,
        nombrePaciente: 'Ana Maria Rodriguez',
        documento: '52098765',
        sede: 'Sede Sur',
        fechaIngreso: new Date('2026-04-29T00:00:00.000Z'),
        createdAt: new Date('2026-04-29T09:00:00.000Z'),
        estado: false,
        fechaCierre: new Date('2026-05-08T12:00:00.000Z'),
        usuarioCerroId: 8,
        currentLos: 10,
        scoreTotal: 20,
        auditor: 'Carlos Medina',
        seguimientos: [],
        acciones: [],
      },
    ]);

    const result = await service.obtenerActivityFeed({
      severity: 'critical',
      requiereAtencion: true,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].eventType).toBe('caso_critico_detectado');
    expect(result.data[0].severity).toBe('critical');
    expect(result.data[0].requiereAtencion).toBe(true);
  });

  it('no falla cuando un registro tiene fechas nulas en datos historicos', async () => {
    const { service, estanciaRepository } = createService();
    estanciaRepository.find.mockResolvedValue([
      {
        id: 45,
        nombrePaciente: 'Paciente Historico',
        documento: '100',
        sede: 'Sede Norte',
        fechaIngreso: null,
        createdAt: null,
        estado: true,
        currentLos: 22,
        scoreTotal: 20,
        auditor: 'Auditor Historico',
        seguimientos: [
          {
            id: 12,
            semanaNumero: 2,
            esCritica: false,
            estadoCodigo: 1,
            createdAt: new Date('2026-05-08T14:15:00.000Z'),
            creadoPor: 'Carlos Medina',
          },
        ],
        acciones: [],
      },
    ]);

    const result = await service.obtenerActivityFeed({ limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].eventType).toBe('seguimiento_guardado');
    expect(result.data[0].losActual).toBe(22);
    expect(result.data[0].timestamp).toMatch(/-05:00$/);
  });
});
