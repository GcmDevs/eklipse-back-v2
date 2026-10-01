import { BoletaQuirurgicaImpl } from './boleta-quirurgica.impl';
import {
  BoletaQuirurgicaAuditoriaOrm,
  BoletaQuirurgicaGestorQxOrm,
  BoletaQuirurgicaLogOrm,
  BoletaQuirurgicaMaosOrm,
  BoletaQuirurgicaObservacionOrm,
  BoletaQuirurgicaProgramacionOrm,
  BoletaQuirurgicaRegistroOrm,
} from '@orm/gcn/boleta-quirurgica';

type MockRepository = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
};

const createRepository = (): MockRepository => ({
  findOne: jest.fn(),
  create: jest.fn(payload => payload),
  save: jest.fn(async payload => payload),
  update: jest.fn(async () => ({ affected: 1 })),
});

const baseDto = {
  ingreso: 12345,
  folio: 99,
  fechaCaptacion: '2026-05-11',
  fechaGestor: '2026-05-12',
  municipio: 'Valledupar',
  tipo: 'AMBULATORIO',
  autorizado: 'SI',
  pendiente1: '',
  pendiente2: '',
  pendiente3: '',
  pendiente4: '',
  cumple: 'SI',
  bajoCotizacion: 'NO',
  pendiente7: 'SI',
  servicio: 'CIRUGIA',
  observacion: ' Requiere seguimiento ',
  estado: 'AUTORIZADO',
  cambioCups: 'NO',
  usuarioCambioCups: 'auditor.cups',
  nombrePc: 'PC-AUDITORIA',
  direccionIp: '10.0.0.5',
};

const observacionDto = {
  ingreso: 12345,
  folio: 99,
  observacion: ' Observacion desde ruta dedicada ',
  fecha: '2026-05-20T15:30:00.000Z',
  gestor: 'AUDITORIA',
};

const programacionDto = {
  ingreso: 12345,
  folio: 99,
  institucion: 'C. MEDICOS CENTRO',
  fechaRecepcion: '2026-05-22T14:00:00.000Z',
  programada: 'CUMPLIDA',
  fechaProgramacion: '2026-05-23T15:00:00.000Z',
  estadoProg: 'SI',
};

const gestorQxDto = {
  ingreso: 12345,
  folio: 99,
  otrasValoraciones: 'Cardiologia',
  observacion: 'Paciente apto',
  estadoAutorizacion: 'AUTORIZADO',
  pendiente1: 'MATERIALES OK',
  pendiente2: 'LABORATORIO OK',
  pendiente3: 'IMAGENES OK',
  pendiente4: 'ANESTESIA OK',
};

const gestorQxSinMaosDto = {
  ...gestorQxDto,
  estadoAutorizacion: 'SI',
  reqMaos: false,
};

const gestorQxConMaosDto = {
  ...gestorQxDto,
  estadoAutorizacion: 'SI',
  reqMaos: true,
};

const maosDto = {
  ingreso: 12345,
  folio: 99,
  maosSolicitado: 'SI',
  estadoMaos: 'EN GESTION',
  casaComercial: 'Casa Comercial Demo',
  fechaEntrega: '2026-05-24T14:00:00.000Z',
  estado2Maos: 'FINALIZADO',
  existencia: 'STOCK',
};

const inicializarDto = {
  ingreso: 12345,
  folio: 99,
};

const createService = () => {
  const auditoriaRepository = createRepository();
  const gestorQxRepository = createRepository();
  const observacionRepository = createRepository();
  const maosRepository = createRepository();
  const programacionRepository = createRepository();
  const registroRepository = createRepository();
  const logRepository = createRepository();

  const repositories = new Map<any, MockRepository>([
    [BoletaQuirurgicaAuditoriaOrm, auditoriaRepository],
    [BoletaQuirurgicaGestorQxOrm, gestorQxRepository],
    [BoletaQuirurgicaMaosOrm, maosRepository],
    [BoletaQuirurgicaObservacionOrm, observacionRepository],
    [BoletaQuirurgicaProgramacionOrm, programacionRepository],
    [BoletaQuirurgicaRegistroOrm, registroRepository],
    [BoletaQuirurgicaLogOrm, logRepository],
  ]);

  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      getRepository: jest.fn(entity => repositories.get(entity)),
    },
  };

  const service = Object.create(BoletaQuirurgicaImpl.prototype) as BoletaQuirurgicaImpl;
  Object.defineProperty(service, 'qr', { value: queryRunner });
  Object.defineProperty(service, 'auth', {
    get: () => ({
      user: {
        id: 7,
        document: '123456789',
        nombre: 'Usuario Auditor',
      },
    }),
  });

  return {
    service: service as any,
    queryRunner,
    auditoriaRepository,
    gestorQxRepository,
    maosRepository,
    observacionRepository,
    programacionRepository,
    registroRepository,
    logRepository,
  };
};

describe('BoletaQuirurgicaImpl autorizaciones', () => {
  it('guarda observacion dedicada y devuelve el usuario autenticado', async () => {
    const { service, queryRunner, observacionRepository } = createService();

    const result = await service.guardarObservacion(observacionDto);

    expect(observacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
        observacion: 'Observacion desde ruta dedicada',
        fecha: new Date('2026-05-20T15:30:00.000Z'),
        gestor: 'AUDITORIA',
        usuario: '123456789',
      })
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: true, usuario: '123456789' });
  });

  it('actualiza programacion existente por ingreso y folio', async () => {
    const { service, queryRunner, programacionRepository } = createService();
    programacionRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });

    const result = await service.guardarProgramacion(programacionDto);

    expect(programacionRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      expect.objectContaining({
        sede: 'C. MEDICOS CENTRO',
        fechaRecepcion: new Date('2026-05-22T14:00:00.000Z'),
        programada: 'CUMPLIDA',
        fechaProgramacion: new Date('2026-05-23T15:00:00.000Z'),
        estado: '',
        observacion: '',
        estadoProg: 'SI',
      })
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: false, updated: true });
  });

  it('actualiza gestor qx y auditoria en una sola transaccion', async () => {
    const { service, queryRunner, gestorQxRepository, auditoriaRepository } = createService();
    gestorQxRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    auditoriaRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });

    const result = await service.guardarGestorQx(gestorQxDto);

    expect(gestorQxRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      expect.objectContaining({
        otrasValoraciones: 'Cardiologia',
        observacion: 'Paciente apto',
        estadoAutorizacion: 'SI',
      })
    );
    expect(auditoriaRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      expect.objectContaining({
        pendiente1: 'MATERIALES OK',
        pendiente2: 'LABORATORIO OK',
        pendiente3: 'IMAGENES OK',
        pendiente4: 'ANESTESIA OK',
      })
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: false, updated: true });
  });

  it('crea gestor qx y auditoria si no existen para ingreso y folio', async () => {
    const { service, queryRunner, gestorQxRepository, auditoriaRepository } = createService();
    gestorQxRepository.findOne.mockResolvedValue(null);
    auditoriaRepository.findOne.mockResolvedValue(null);

    const result = await service.guardarGestorQx(gestorQxDto);

    expect(gestorQxRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
        otrasValoraciones: 'Cardiologia',
        observacion: 'Paciente apto',
        estadoAutorizacion: 'SI',
      })
    );
    expect(auditoriaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
        pendiente1: 'MATERIALES OK',
        pendiente2: 'LABORATORIO OK',
        pendiente3: 'IMAGENES OK',
        pendiente4: 'ANESTESIA OK',
      })
    );
    expect(auditoriaRepository.update).not.toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: true, updated: false });
  });

  it('finaliza maos cuando gestor qx marca reqMaos en no', async () => {
    const {
      service,
      queryRunner,
      gestorQxRepository,
      auditoriaRepository,
      maosRepository,
      programacionRepository,
    } = createService();
    gestorQxRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    auditoriaRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    maosRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    programacionRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });

    const result = await service.guardarGestorQx(gestorQxSinMaosDto);

    expect(programacionRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      { reqMaos: 'NO' }
    );
    expect(maosRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      { estado2Maos: 'SI' }
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: false, updated: true });
  });

  it('deja maos abierto cuando gestor qx marca reqMaos en si', async () => {
    const {
      service,
      queryRunner,
      gestorQxRepository,
      auditoriaRepository,
      maosRepository,
      programacionRepository,
    } = createService();
    gestorQxRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    auditoriaRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    maosRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    programacionRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });

    const result = await service.guardarGestorQx(gestorQxConMaosDto);

    expect(programacionRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      { reqMaos: 'SI' }
    );
    expect(maosRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      { estado2Maos: '' }
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: false, updated: true });
  });

  it('actualiza maos existente por ingreso y folio', async () => {
    const { service, queryRunner, maosRepository, programacionRepository } = createService();
    maosRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    programacionRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99, reqMaos: 'SI' });

    const result = await service.guardarMaos(maosDto);

    expect(maosRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      expect.objectContaining({
        maosSolicitado: 'SI',
        estadoMaos: 'EN GESTION',
        casaComercial: 'Casa Comercial Demo',
        fechaEntrega: new Date('2026-05-24T14:00:00.000Z'),
        estado2Maos: 'FINALIZADO',
        existencia: 'STOCK',
      })
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: false, updated: true });
  });

  it('crea maos si no existe para ingreso y folio', async () => {
    const { service, queryRunner, maosRepository, programacionRepository } = createService();
    maosRepository.findOne.mockResolvedValue(null);
    programacionRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99, reqMaos: 'SI' });

    const result = await service.guardarMaos(maosDto);

    expect(maosRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
        maosSolicitado: 'SI',
        estadoMaos: 'EN GESTION',
        casaComercial: 'Casa Comercial Demo',
        fechaEntrega: new Date('2026-05-24T14:00:00.000Z'),
        estado2Maos: 'FINALIZADO',
        existencia: 'STOCK',
      })
    );
    expect(maosRepository.update).not.toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: true, updated: false });
  });

  it('no gestiona maos y lo finaliza cuando programacion reqMaos es no', async () => {
    const { service, queryRunner, maosRepository, programacionRepository } = createService();
    maosRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    programacionRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99, reqMaos: 'NO' });

    const result = await service.guardarMaos(maosDto);

    expect(maosRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      { estado2Maos: 'SI' }
    );
    expect(maosRepository.update).not.toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      expect.objectContaining({
        maosSolicitado: 'SI',
        estadoMaos: 'EN GESTION',
        casaComercial: 'Casa Comercial Demo',
      })
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ skipped: true, finalized: true });
  });

  it('inicializa los registros faltantes sin duplicar los existentes', async () => {
    const {
      service,
      queryRunner,
      auditoriaRepository,
      gestorQxRepository,
      maosRepository,
      programacionRepository,
    } = createService();
    auditoriaRepository.findOne.mockResolvedValue(null);
    gestorQxRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });
    maosRepository.findOne.mockResolvedValue(null);
    programacionRepository.findOne.mockResolvedValue(null);

    const result = await service.inicializarRegistros(inicializarDto);

    expect(auditoriaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
      })
    );
    expect(gestorQxRepository.save).not.toHaveBeenCalled();
    expect(maosRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
      })
    );
    expect(programacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
      })
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      created: true,
      autorizacion: 'created',
      gestorQx: 'exists',
      maos: 'created',
      programacion: 'created',
    });
  });

  it('crea programacion si no existe para ingreso y folio', async () => {
    const { service, queryRunner, programacionRepository } = createService();
    programacionRepository.findOne.mockResolvedValue(null);

    const result = await service.guardarProgramacion(programacionDto);

    expect(programacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
        sede: 'C. MEDICOS CENTRO',
        fechaRecepcion: new Date('2026-05-22T14:00:00.000Z'),
        programada: 'CUMPLIDA',
        fechaProgramacion: new Date('2026-05-23T15:00:00.000Z'),
        estado: '',
        observacion: '',
        estadoProg: 'SI',
      })
    );
    expect(programacionRepository.update).not.toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: true, updated: false });
  });

  it('crea autorizacion por primera vez, observacion, estado en gestion y log', async () => {
    const {
      service,
      queryRunner,
      auditoriaRepository,
      observacionRepository,
      registroRepository,
      logRepository,
    } = createService();
    auditoriaRepository.findOne.mockResolvedValue(null);

    const result = await service.guardarAutorizacion(baseDto);

    expect(observacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
        observacion: 'Requiere seguimiento',
        area: 'AUDITORIA',
        usuario: 'Usuario Auditor',
      })
    );
    expect(auditoriaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ingreso: 12345,
        folio: 99,
        municipio: 'Valledupar',
        tipo: 'AMBULATORIO',
        autorizado: 'SI',
        pendiente5: 'SI',
        pendiente6: 'NO',
        pendiente7: 'SI',
        servicio: 'CIRUGIA',
        observacion: 'Requiere seguimiento',
      })
    );
    expect(registroRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      { estado: 'EN GESTION' }
    );
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario: 'Usuario Auditor',
        accion: 'CAMBIO A ESTADO GESTION',
        modulo: 'AUTORIZACION',
        ingreso: 12345,
        nombrePc: 'PC-AUDITORIA',
        direccionIp: '10.0.0.5',
      })
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: true, updated: false });
  });

  it('actualiza autorizacion existente, estado recibido y log', async () => {
    const {
      service,
      auditoriaRepository,
      observacionRepository,
      registroRepository,
      logRepository,
    } = createService();
    auditoriaRepository.findOne.mockResolvedValue({ ingreso: 12345, folio: 99 });

    const result = await service.guardarAutorizacion(baseDto);

    expect(observacionRepository.save).not.toHaveBeenCalled();
    expect(auditoriaRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      expect.objectContaining({
        municipio: 'Valledupar',
        tipo: 'AMBULATORIO',
        autorizado: 'SI',
        pendiente5: 'SI',
        pendiente6: 'NO',
        pendiente7: 'SI',
        servicio: 'CIRUGIA',
        observacion: 'Requiere seguimiento',
        cambioCups: 'NO',
        usuario: 'auditor.cups',
      })
    );
    expect(registroRepository.update).toHaveBeenCalledWith(
      { ingreso: 12345, folio: 99 },
      { estado: 'AUTORIZADO' }
    );
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'ACTUALIZA INFO',
        modulo: 'AUDITORIA',
      })
    );
    expect(result).toEqual({ created: false, updated: true });
  });

  it('hace rollback si ocurre error durante la transaccion', async () => {
    const { service, queryRunner, auditoriaRepository, registroRepository } = createService();
    auditoriaRepository.findOne.mockResolvedValue(null);
    registroRepository.update.mockRejectedValue(new Error('fallo db'));

    await expect(service.guardarAutorizacion(baseDto)).rejects.toThrow('fallo db');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
