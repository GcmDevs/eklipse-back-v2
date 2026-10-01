import { NotFoundException } from '@nestjs/common';
import { DominioAccionNotificacionOrm } from '@orm/hpn/estancia-prolongadas';
import { NotificacionesService } from './notificaciones.service';

const createRepository = () => ({
  count: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(async payload => payload),
  update: jest.fn(),
});

const createService = () => {
  const notificacionRepository = createRepository();
  const service = Object.create(NotificacionesService.prototype) as NotificacionesService;

  Object.defineProperty(service, 'conn', {
    value: {
      getRepository: jest.fn(entity =>
        entity === DominioAccionNotificacionOrm ? notificacionRepository : undefined
      ),
    },
  });

  return { service, notificacionRepository };
};

describe('NotificacionesService', () => {
  it('retorna resumen total y no vistas por documento del paciente', async () => {
    const { service, notificacionRepository } = createService();
    notificacionRepository.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

    const result = await service.obtenerResumen('100200300');

    expect(notificacionRepository.count).toHaveBeenNthCalledWith(1, {
      where: { estanciaProlongada: { documento: '100200300' } },
    });
    expect(notificacionRepository.count).toHaveBeenNthCalledWith(2, {
      where: { estanciaProlongada: { documento: '100200300' }, visto: false },
    });
    expect(result).toEqual({ total: 5, noVistas: 2 });
  });

  it('lista notificaciones recientes por documento del paciente con datos para navegar a la estancia', async () => {
    const { service, notificacionRepository } = createService();
    notificacionRepository.find.mockResolvedValue([
      {
        id: 10,
        usuarioId: 3001,
        estanciaProlongadaId: 100,
        accionId: 501,
        descripcion: 'Nueva accion asignada: Gestionar autorizacion',
        visto: false,
      },
    ]);

    const result = await service.listarPorDocumento('100200300');

    expect(notificacionRepository.find).toHaveBeenCalledWith({
      where: { estanciaProlongada: { documento: '100200300' } },
      order: { createdAt: 'DESC' },
      relations: ['estanciaProlongada'],
    });
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 10,
        estanciaProlongadaId: 100,
        accionId: 501,
        descripcion: 'Nueva accion asignada: Gestionar autorizacion',
        visto: false,
      })
    );
  });

  it('marca una notificacion del paciente como vista por documento', async () => {
    const { service, notificacionRepository } = createService();
    notificacionRepository.findOne.mockResolvedValue({
      id: 10,
      usuarioId: 3001,
      visto: false,
    });

    const result = await service.marcarVista('100200300', 10);

    expect(notificacionRepository.findOne).toHaveBeenCalledWith({
      where: { id: 10, estanciaProlongada: { documento: '100200300' } },
      relations: ['estanciaProlongada'],
    });
    expect(notificacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 10,
        visto: true,
        fechaVisto: expect.any(Date),
      })
    );
    expect(result.visto).toBe(true);
  });

  it('retorna 404 si la notificacion no pertenece al documento del paciente', async () => {
    const { service, notificacionRepository } = createService();
    notificacionRepository.findOne.mockResolvedValue(null);

    await expect(service.marcarVista('100200300', 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marca todas las notificaciones no vistas del paciente por documento', async () => {
    const { service, notificacionRepository } = createService();
    notificacionRepository.find.mockResolvedValue([
      { id: 10, visto: false },
      { id: 11, visto: false },
    ]);

    await service.marcarTodasVistas('100200300');

    expect(notificacionRepository.find).toHaveBeenCalledWith({
      where: { estanciaProlongada: { documento: '100200300' }, visto: false },
      relations: ['estanciaProlongada'],
    });
    expect(notificacionRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ id: 10, visto: true, fechaVisto: expect.any(Date) }),
      expect.objectContaining({ id: 11, visto: true, fechaVisto: expect.any(Date) }),
    ]);
  });
});
