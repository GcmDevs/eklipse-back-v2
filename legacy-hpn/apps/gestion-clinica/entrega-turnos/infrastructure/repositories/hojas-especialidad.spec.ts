jest.mock('@common/infrastructure/services', () => ({ BaseSource: class {} }));
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IngresoOrm } from '@orm/gen';
import { MedicoOrm, EspecialidadOrm } from '@orm/gen/medicos';
import {
  EntregaTurnoOrm,
  HojaEspecialidadOrm,
  HojaEspecialidadVersionOrm,
  PacienteTemporalOrm,
} from '@orm/gcn';
import { EstanciaOrm } from '@orm/temp';
import { HojasEspecialidadImpl } from './hojas-especialidad';

const repository = () => ({
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn(v => v),
  save: jest.fn(async v => v),
});

function escenario() {
  const ingreso = repository(),
    estancia = repository(),
    turno = repository(),
    medico = repository();
  const temporal = repository(),
    hojas = repository(),
    versiones = repository(),
    especialidad = repository();
  ingreso.findOne.mockResolvedValue({ id: 10, fechaEgreso: null });
  estancia.findOne.mockResolvedValue({
    id: 20,
    ingresoId: 10,
    fechaEgreso: null,
    cama: {
      centroId: '1',
      subGrupoId: 5,
      grupo: { nombre: 'HOSPITALIZACIÓN' },
      subgrupo: { nombre: 'PISO 1' },
    },
  });
  turno.findOne.mockResolvedValue({
    estadoCode: 2,
    medicoEntregaTurnoId: 7,
    fechaEntrega: null,
    cambiosTurno: [],
  });
  especialidad.findOne.mockResolvedValue({ id: 30, codigo: 'CARD', nombre: 'Cardiología' });
  const hoja = {
    id: 40,
    ingresoId: 10,
    especialidadId: 30,
    contenido: 'Anterior',
    activa: true,
    version: 1,
    especialidad: { id: 30, codigo: 'CARD', nombre: 'Cardiología' },
    ultimoAutor: null,
  };
  hojas.findOne.mockImplementation(async () => hoja);
  hojas.find.mockImplementation(async () => [hoja]);
  const repositories = new Map<any, any>([
    [IngresoOrm, ingreso],
    [EstanciaOrm, estancia],
    [EntregaTurnoOrm, turno],
    [MedicoOrm, medico],
    [PacienteTemporalOrm, temporal],
    [HojaEspecialidadOrm, hojas],
    [HojaEspecialidadVersionOrm, versiones],
    [EspecialidadOrm, especialidad],
  ]);
  const manager = {
    getRepository: jest.fn(entity => repositories.get(entity)),
    query: jest.fn().mockResolvedValue([{ id: 30, codigo: 'CARD', nombre: 'Cardiología' }]),
  };
  const conn = { ...manager, manager, transaction: jest.fn(async fn => fn(manager)) };
  const service = Object.create(HojasEspecialidadImpl.prototype) as HojasEspecialidadImpl;
  Object.defineProperty(service, 'conn', { value: conn });
  Object.defineProperty(service, 'auth', { get: () => ({ id: 7 }) });
  return {
    service,
    ingreso,
    estancia,
    turno,
    medico,
    temporal,
    hojas,
    versiones,
    especialidad,
    hoja,
    conn,
  };
}

describe('Hojas de especialidad', () => {
  it('consulta solo las interconsultas del ingreso solicitado, sin duplicar especialidades', async () => {
    const s = escenario();
    const cardiologia = { id: 30, codigo: 'CARD', nombre: 'Cardiología' };
    const nefrologia = { id: 31, codigo: 'NEFR', nombre: 'Nefrología' };
    s.conn.query.mockImplementation(async (_sql, parametros) =>
      parametros[0] === 10 ? [cardiologia] : [nefrologia]
    );
    await expect(s.service.catalogo(10)).resolves.toEqual([cardiologia]);
    await expect(s.service.catalogo(11)).resolves.toEqual([nefrologia]);
    expect(s.conn.query).toHaveBeenCalledWith(
      expect.stringMatching(
        /SELECT DISTINCT[\s\S]*HCNINTERC[\s\S]*HCNFOLIO[\s\S]*GENESPECI[\s\S]*F.ADNINGRESO = @0/
      ),
      [10]
    );
    expect(s.conn.query).toHaveBeenCalledWith(expect.any(String), [11]);
  });
  it('rechaza un ingreso inexistente al consultar el catálogo', async () => {
    const s = escenario();
    s.ingreso.findOne.mockResolvedValue(null);
    await expect(s.service.catalogo(10)).rejects.toBeInstanceOf(NotFoundException);
    expect(s.conn.query).not.toHaveBeenCalled();
  });
  it('un ingreso sin interconsultas devuelve opciones vacías y no permite agregar', async () => {
    const s = escenario();
    s.conn.query.mockResolvedValue([]);
    await expect(s.service.catalogo(10)).resolves.toEqual([]);
    await expect(s.service.agregar(10, 30)).rejects.toBeInstanceOf(BadRequestException);
    expect(s.hojas.save).not.toHaveBeenCalled();
  });
  it('rechaza una especialidad ajena dentro de la transacción aunque se envíe por API', async () => {
    const s = escenario();
    await expect(s.service.agregar(10, 31)).rejects.toThrow(
      'La especialidad no está disponible en las interconsultas de este ingreso.'
    );
    expect(s.conn.transaction).toHaveBeenCalledTimes(1);
    expect(s.conn.manager.query).toHaveBeenCalledWith(expect.any(String), [10]);
    expect(s.hojas.findOne).not.toHaveBeenCalled();
    expect(s.hojas.save).not.toHaveBeenCalled();
  });
  it('no reactiva hojas archivadas cuya especialidad ya no está disponible', async () => {
    const s = escenario();
    s.hoja.activa = false;
    s.conn.query.mockResolvedValue([]);
    await expect(s.service.agregar(10, 30)).rejects.toBeInstanceOf(BadRequestException);
    expect(s.hoja).toMatchObject({ activa: false, contenido: 'Anterior', version: 1 });
    expect(s.hojas.save).not.toHaveBeenCalled();
    expect(s.versiones.save).not.toHaveBeenCalled();
  });
  it('conserva consultables las hojas y versiones aunque ya no haya interconsultas', async () => {
    const s = escenario();
    s.conn.query.mockResolvedValue([]);
    s.hoja.activa = false;
    s.versiones.find.mockResolvedValue([
      {
        id: 1,
        version: 1,
        contenido: 'Anterior',
        fecha: new Date(),
        usuarioId: 7,
        autor: { nombreCompleto: 'Médico' },
      },
    ]);
    await expect(s.service.listar(10)).resolves.toMatchObject({
      hojas: [{ id: 40, contenido: 'Anterior', activa: false, puedeConsultar: true }],
    });
    await expect(s.service.historial(10, 40)).resolves.toMatchObject([
      { version: 1, contenido: 'Anterior' },
    ]);
    expect(s.conn.query).not.toHaveBeenCalled();
  });
  it('guarda contenido y versión en la misma transacción, con bloqueo y autor autenticado', async () => {
    const s = escenario();
    const resultado = await s.service.guardar(10, 40, { version: 1, contenido: 'Nuevo' });
    expect(s.conn.transaction).toHaveBeenCalledTimes(1);
    expect(s.hojas.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 40, ingresoId: 10 },
        lock: { mode: 'pessimistic_write' },
      })
    );
    expect(s.versiones.save).toHaveBeenCalledWith(
      expect.objectContaining({ hojaId: 40, version: 2, contenido: 'Nuevo', usuarioId: 7 })
    );
    expect(resultado).toMatchObject({ contenido: 'Nuevo', version: 2, puedeEditar: true });
  });
  it('rechaza una versión antigua sin escribir contenido ni historial', async () => {
    const s = escenario();
    await expect(
      s.service.guardar(10, 40, { version: 0, contenido: 'Viejo' })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(s.hojas.save).not.toHaveBeenCalled();
    expect(s.versiones.save).not.toHaveBeenCalled();
  });
  it('no crea versiones si no cambia el texto', async () => {
    const s = escenario();
    await s.service.guardar(10, 40, { version: 1, contenido: 'Anterior' });
    expect(s.hojas.save).not.toHaveBeenCalled();
    expect(s.versiones.save).not.toHaveBeenCalled();
  });
  it('permite vaciar contenido y conserva esa corrección en el historial', async () => {
    const s = escenario();
    await s.service.guardar(10, 40, { version: 1, contenido: '' });
    expect(s.versiones.save).toHaveBeenCalledWith(
      expect.objectContaining({ contenido: '', version: 2 })
    );
  });
  it('permite a un especialista escribir sin turno activo', async () => {
    const s = escenario();
    s.turno.findOne.mockResolvedValue(null);
    s.medico.find.mockResolvedValue([{ especialidadId: 30 }]);
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Especialista' })
    ).resolves.toMatchObject({ puedeEditar: true, puedeAdministrar: false });
  });
  it('permite a un especialista escribir después de entregar el turno', async () => {
    const s = escenario();
    s.turno.findOne.mockResolvedValue({
      estadoCode: 3,
      fechaEntrega: new Date(),
      cambiosTurno: [],
      medicoEntregaTurnoId: 99,
    });
    s.medico.find.mockResolvedValue([{ especialidadId: 30 }]);
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Especialista' })
    ).resolves.toBeDefined();
  });
  it('bloquea al responsable tras entregar si no es especialista de esa área', async () => {
    const s = escenario();
    s.turno.findOne.mockResolvedValue({
      estadoCode: 3,
      fechaEntrega: new Date(),
      cambiosTurno: [],
      medicoEntregaTurnoId: 7,
    });
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Nuevo' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('permite a los ayudantes reales administrar hojas durante el turno', async () => {
    const s = escenario();
    s.turno.findOne.mockResolvedValue({
      estadoCode: 2,
      fechaEntrega: null,
      medicoEntregaTurnoId: 99,
      cambiosTurno: [{ tipo: 2, medicoId: 7 }],
    });
    await expect(s.service.listar(10)).resolves.toMatchObject({ puedeAdministrar: true });
  });
  it('un cambio de receptor no concede permisos de ayudante', async () => {
    const s = escenario();
    s.turno.findOne.mockResolvedValue({
      estadoCode: 2,
      fechaEntrega: null,
      medicoEntregaTurnoId: 99,
      cambiosTurno: [{ tipo: 1, medicoId: 7 }],
    });
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Nuevo' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('no concede edición a especialistas de otra área', async () => {
    const s = escenario();
    s.turno.findOne.mockResolvedValue(null);
    s.medico.find.mockResolvedValue([{ especialidadId: 31 }]);
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Nuevo' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('bloquea edición y administración al egresar el paciente', async () => {
    const s = escenario();
    s.ingreso.findOne.mockResolvedValue({ id: 10, fechaEgreso: new Date() });
    s.medico.find.mockResolvedValue([{ especialidadId: 30 }]);
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Nuevo' })
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(s.service.agregar(10, 30)).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('una estancia cerrada impide editar aunque el ingreso no tenga fecha de egreso', async () => {
    const s = escenario();
    const estancia = await s.estancia.findOne();
    s.estancia.findOne.mockResolvedValue({ ...estancia, fechaEgreso: new Date() });
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Nuevo' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('resuelve el equipo desde la asignación temporal de la estancia vigente', async () => {
    const s = escenario();
    s.estancia.findOne.mockResolvedValue({
      id: 20,
      ingresoId: 10,
      fechaEgreso: null,
      cama: { centroId: '1', subGrupoId: 90, grupo: { nombre: 'TEMPORAL' } },
    });
    s.temporal.findOne.mockResolvedValue({ subgrupoDestinoId: 5 });
    await s.service.listar(10);
    expect(s.temporal.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { estanciaId: 20, ingresoId: 10, centroId: 1 } })
    );
    expect(s.turno.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { centroAtencionId: 1, subgrupoId: 5, isActivo: true } })
    );
  });
  it('archiva sin borrar contenido e historial y reactiva la misma hoja', async () => {
    const s = escenario();
    await s.service.archivar(10, 40);
    expect(s.hoja.activa).toBe(false);
    await s.service.agregar(10, 30);
    expect(s.hoja.activa).toBe(true);
    expect(s.hoja.contenido).toBe('Anterior');
    expect(s.hoja.version).toBe(1);
    expect(s.versiones.save).not.toHaveBeenCalled();
  });
  it('no permite editar hojas archivadas', async () => {
    const s = escenario();
    s.hoja.activa = false;
    await expect(
      s.service.guardar(10, 40, { version: 1, contenido: 'Nuevo' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('agregar una hoja existente es idempotente', async () => {
    const s = escenario();
    await s.service.agregar(10, 30);
    expect(s.hojas.save).not.toHaveBeenCalled();
  });
  it('crea hojas vacías sin copiar datos de otra especialidad o ingreso', async () => {
    const s = escenario();
    s.hojas.findOne.mockResolvedValue(null);
    await s.service.agregar(10, 30);
    expect(s.hojas.save).toHaveBeenCalledWith(
      expect.objectContaining({ ingresoId: 10, especialidadId: 30, contenido: '', version: 0 })
    );
  });
  it('traduce duplicados de SQL Server a conflicto', async () => {
    const s = escenario();
    s.conn.transaction.mockRejectedValue({ driverError: { number: 2627 } });
    await expect(s.service.agregar(10, 30)).rejects.toBeInstanceOf(ConflictException);
  });
  it('rechaza hojas ajenas al ingreso antes de guardar o consultar versiones', async () => {
    const s = escenario();
    s.hojas.findOne.mockResolvedValue(null);
    await expect(
      s.service.guardar(11, 40, { version: 1, contenido: 'Nuevo' })
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(s.service.historial(11, 40)).rejects.toBeInstanceOf(NotFoundException);
    expect(s.versiones.find).not.toHaveBeenCalled();
  });
});
