import { validate } from 'class-validator';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FacturadoresImpl } from './control-facturadores.impl';
import { FacturadoresController } from './control-facturadores.controller';
import { ActualizarFacturadorDto } from './dtos/actualizar-facturador.dto';
import { FacturadoresOrm } from '@sln/orm/sln/control-egresos/facturadores';
import { HistorialFacturadorOrm } from '@sln/orm/sln/control-egresos/historial-facturador';
import { RolFacturadorOrm } from '@sln/orm/sln/control-egresos/rol-facturador';

jest.mock('@common/infrastructure/services', () => ({
  BaseSource: class {
    auth = { id: 99 };
  },
}));
jest.mock('@common/presentation/decorators', () => ({
  CommonGuards: () => () => {},
  Authorities: () => () => {},
}));
jest.mock('@sln/orm/sln/control-egresos/facturadores', () => ({ FacturadoresOrm: class {} }));
jest.mock('@sln/orm/sln/control-egresos/historial-facturador', () => ({
  HistorialFacturadorOrm: class {},
}));
jest.mock('@sln/orm/sln/control-egresos/rol-facturador', () => ({ RolFacturadorOrm: class {} }));
jest.mock('@sln/orm/gen', () => ({ UsuarioOrm: class {} }));

describe('Acciones de control de facturadores', () => {
  let service: FacturadoresImpl;
  let facturador: any;
  let repo: any;
  let history: any;
  let roles: any;
  let schemaQuery: jest.Mock;
  beforeEach(() => {
    service = new (FacturadoresImpl as any)();
    facturador = { id: 1, usuarioId: 10, rolId: 1, estado: true };
    repo = { findOne: jest.fn(async () => facturador), save: jest.fn(async value => value) };
    history = { create: jest.fn(value => value), save: jest.fn(async value => value) };
    roles = { findOne: jest.fn(async () => ({ id: 2 })) };
    schemaQuery = jest.fn(async () => [{ rolAnterior: 4, rolNuevo: 4 }]);
    (service as any).conn = {
      transaction: async action =>
        action({
          query: schemaQuery,
          getRepository: entity =>
            entity === FacturadoresOrm ? repo : entity === HistorialFacturadorOrm ? history : roles,
        }),
      query: jest.fn(async () => []),
    };
  });
  it('cambia el estado y registra usuario, fecha y estado anterior', async () => {
    expect(await service.toggleFacturadorEstado(1, false)).toBe(true);
    expect(facturador.estado).toBe(false);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(history.save).toHaveBeenCalledWith(
      expect.objectContaining({
        facturadorId: 1,
        estadoAnterior: true,
        estadoNuevo: false,
        usuarioCambioId: 99,
        rolAnteriorId: 1,
        rolNuevoId: 1,
        fecha: expect.any(Date),
      })
    );
  });
  it('no duplica historial si llega de nuevo el mismo estado', async () => {
    await service.toggleFacturadorEstado(1, true);
    expect(repo.save).not.toHaveBeenCalled();
    expect(history.save).not.toHaveBeenCalled();
  });
  it('rechaza un facturador inexistente sin guardar cambios', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.toggleFacturadorEstado(999, false)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(history.save).not.toHaveBeenCalled();
  });
  it('registra el rol anterior, el nuevo y el actor aunque no cambie el estado', async () => {
    await service.actualizarFacturador(1, { rolId: 2, estado: true });
    expect(roles.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(facturador.rolId).toBe(2);
    expect(history.save).toHaveBeenCalledTimes(1);
    expect(history.save).toHaveBeenCalledWith(
      expect.objectContaining({
        facturadorId: 1,
        rolAnteriorId: 1,
        rolNuevoId: 2,
        estadoAnterior: true,
        estadoNuevo: true,
        usuarioCambioId: 99,
        fecha: expect.any(Date),
      })
    );
    expect(facturador.fechaCambioEstado).toBeUndefined();
  });
  it('registra un único evento cuando cambian el rol y el estado a la vez', async () => {
    await service.actualizarFacturador(1, { rolId: 2, estado: false });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(history.save).toHaveBeenCalledTimes(1);
    expect(history.save).toHaveBeenCalledWith(
      expect.objectContaining({
        rolAnteriorId: 1,
        rolNuevoId: 2,
        estadoAnterior: true,
        estadoNuevo: false,
        fecha: facturador.fechaCambioEstado,
        usuarioCambioId: 99,
      })
    );
  });
  it('conserva el rol en el historial cuando solo cambia el estado desde la edición', async () => {
    await service.actualizarFacturador(1, { rolId: 1, estado: false });
    expect(history.save).toHaveBeenCalledWith(
      expect.objectContaining({
        rolAnteriorId: 1,
        rolNuevoId: 1,
        estadoAnterior: true,
        estadoNuevo: false,
      })
    );
  });
  it('no guarda ni genera historial si la edición no cambia rol ni estado', async () => {
    await service.actualizarFacturador(1, { rolId: 1, estado: true });
    expect(repo.save).not.toHaveBeenCalled();
    expect(history.save).not.toHaveBeenCalled();
    expect(schemaQuery).not.toHaveBeenCalled();
  });
  it('no duplica el registro si se repite la misma edición', async () => {
    await service.actualizarFacturador(1, { rolId: 2, estado: false });
    await service.actualizarFacturador(1, { rolId: 2, estado: false });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(history.save).toHaveBeenCalledTimes(1);
  });
  it('solicita el script antes de cambiar el rol si falta actualizar la sede', async () => {
    schemaQuery.mockResolvedValue([{ rolAnterior: null, rolNuevo: null }]);
    await expect(
      service.actualizarFacturador(1, { rolId: 2, estado: false })
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(history.save).not.toHaveBeenCalled();
    expect(facturador.rolId).toBe(1);
    expect(facturador.estado).toBe(true);
  });
  it('tampoco cambia el estado si falta una columna del nuevo historial', async () => {
    schemaQuery.mockResolvedValue([{ rolAnterior: 4, rolNuevo: null }]);
    await expect(service.toggleFacturadorEstado(1, false)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    expect(repo.save).not.toHaveBeenCalled();
    expect(history.save).not.toHaveBeenCalled();
    expect(facturador.estado).toBe(true);
  });
  it('bloquea el facturador en la transacción antes de leer el rol anterior', async () => {
    await service.actualizarFacturador(1, { rolId: 2, estado: true });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });
  it('propaga el error del historial para que la transacción revierta la edición', async () => {
    const failure = new Error('No se pudo insertar el historial');
    history.save.mockRejectedValue(failure);
    await expect(service.actualizarFacturador(1, { rolId: 2, estado: true })).rejects.toBe(failure);
  });
  it('no intenta insertar historial si falla el guardado del facturador', async () => {
    repo.save.mockRejectedValue(new Error('Error al guardar'));
    await expect(service.actualizarFacturador(1, { rolId: 2, estado: true })).rejects.toThrow(
      'Error al guardar'
    );
    expect(history.save).not.toHaveBeenCalled();
  });
  it('rechaza un rol inexistente antes de modificar al facturador', async () => {
    roles.findOne.mockResolvedValue(null);
    await expect(
      service.actualizarFacturador(1, { rolId: 500, estado: false })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(facturador.estado).toBe(true);
  });
  it('limita ambas consultas por usuario y rango, incluyendo el día final completo', async () => {
    const inicio = new Date('2026-10-28T00:00:00Z');
    const fin = new Date('2026-10-29T00:00:00Z');
    await service.facturasAsignadas(10, inicio, fin);
    await service.facturasFinalizadas(20, inicio, fin);
    expect((service as any).conn.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('EKSLNEGRFACASIG.USUARIOASIGNADO = @0'),
      [10, inicio, fin]
    );
    expect((service as any).conn.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('EKSLNEGRFACASIG.USUARIOASIGNADO = @0'),
      [20, inicio, fin]
    );
    for (const [sql] of (service as any).conn.query.mock.calls) {
      expect(sql).toContain('EKSLNEGRFACASIG.FECHA >= @1');
      expect(sql).toContain('EKSLNEGRFACASIG.FECHA < DATEADD(DAY, 1, CAST(@2 AS DATE))');
      expect(sql).not.toContain('ADNEGRESO.ADEFECSAL >= @1');
      expect(sql).toContain('FROM EKSLNEGRFACASIG');
      expect(sql).toContain('AS FECHA_ASIGNACION');
      expect(sql).toContain('AS DIAS_ESTANCIA');
    }
  });
  it('valida tipos del formulario y acepta el estado inactivo', async () => {
    expect(
      await validate(Object.assign(new ActualizarFacturadorDto(), { rolId: 2, estado: false }))
    ).toHaveLength(0);
    expect(
      (
        await validate(
          Object.assign(new ActualizarFacturadorDto(), { rolId: null, estado: 'false' })
        )
      ).length
    ).toBeGreaterThan(0);
  });
  it('consulta la carga del robot por fecha, conservando activos sin asignaciones', async () => {
    await service.comportamientoRobot(new Date('2026-09-29T00:00:00Z'));
    const [[sql, params]] = (service as any).conn.query.mock.calls;
    expect(params).toEqual(['2026-09-29']);
    expect(sql).toContain('LEFT JOIN EKSLNEGRFACASIG fa');
    expect(sql).toContain('fa.ESTADO = 2');
    expect(sql).toContain("fa.OBSERVACION = 'Asignación automática avanzada'");
    expect(sql).toContain('fa.FECHA >= @0');
    expect(sql).toContain('fa.FECHA < DATEADD(DAY, 1, CAST(@0 AS DATE))');
    expect(sql).toContain('WHERE f.ACTIVO = 1');
    expect(sql).toContain('PARTITION BY r.OID ORDER BY f.USUARIOID');
    expect(sql).toContain('SELECT TOP (1) e.ADEFECSAL');
  });
  it('limita el detalle del robot al mismo usuario, día y estado del resumen', async () => {
    await service.detalleComportamientoRobot(27, new Date('2026-09-29T00:00:00Z'));
    const [[sql, params]] = (service as any).conn.query.mock.calls;
    expect(params).toEqual([27, '2026-09-29']);
    expect(sql).toContain('fa.USUARIOASIGNADO = @0');
    expect(sql).toContain('fa.FECHA >= @1');
    expect(sql).toContain('fa.FECHA < DATEADD(DAY, 1, CAST(@1 AS DATE))');
    expect(sql).toContain('fa.ESTADO = 2');
    expect(sql).toContain("fa.OBSERVACION = 'Asignación automática avanzada'");
    expect(sql).toContain('f.ACTIVO = 1');
    expect(sql).toContain("THEN 'HEMODINAMIA'");
    expect(sql).toContain("THEN 'PQX'");
    expect(sql).toContain('VALIDACION_ASIGNACION');
  });
});

describe('Consulta del detalle de asignaciones del robot', () => {
  const service = { detalleComportamientoRobot: jest.fn(async () => []) };
  const controller = new FacturadoresController(service as any);
  beforeEach(() => jest.clearAllMocks());
  it('envía el usuario seleccionado y la fecha consultada', async () => {
    await controller.detalleComportamientoRobot(27, '2026-09-29');
    expect(service.detalleComportamientoRobot).toHaveBeenCalledWith(
      27,
      new Date('2026-09-29T00:00:00Z')
    );
  });
  it.each([0, -1])('rechaza el usuario %s sin consultar', async usuario => {
    await expect(
      controller.detalleComportamientoRobot(usuario, '2026-09-29')
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.detalleComportamientoRobot).not.toHaveBeenCalled();
  });
  it.each(['', undefined, '2026-02-30'])(
    'rechaza la fecha inválida %s sin consultar',
    async fecha => {
      await expect(
        controller.detalleComportamientoRobot(27, fecha as string)
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.detalleComportamientoRobot).not.toHaveBeenCalled();
    }
  );
});

describe('Fecha del comportamiento del robot', () => {
  const service = { comportamientoRobot: jest.fn(async () => []) };
  const controller = new FacturadoresController(service as any);
  beforeEach(() => jest.clearAllMocks());
  it('consulta el día seleccionado sin cambio de zona horaria', async () => {
    await controller.comportamientoRobot('2026-09-29');
    expect(service.comportamientoRobot).toHaveBeenCalledWith(new Date('2026-09-29T00:00:00Z'));
  });
  it.each(['', undefined, '2026-02-30', '2026-09-29 OR 1=1'])(
    'rechaza la fecha inválida %s antes de consultar',
    async fecha => {
      await expect(controller.comportamientoRobot(fecha as string)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(service.comportamientoRobot).not.toHaveBeenCalled();
    }
  );
});

describe.each(['facturasAsignadas', 'facturasFinalizadas'] as const)(
  'Período obligatorio de %s',
  action => {
    const service = {
      facturasAsignadas: jest.fn(async () => []),
      facturasFinalizadas: jest.fn(async () => []),
    };
    const controller = new FacturadoresController(service as any);
    beforeEach(() => jest.clearAllMocks());
    it('envía usuario y ambas fechas para consultar un solo día', async () => {
      await controller[action](10, '2026-10-29', '2026-10-29');
      expect(service[action]).toHaveBeenCalledWith(
        10,
        new Date('2026-10-29T00:00:00Z'),
        new Date('2026-10-29T00:00:00Z')
      );
    });
    it.each([
      [undefined, undefined],
      ['2026-10-29', undefined],
      ['2026-02-30', '2026-03-01'],
      ['2026-10-30', '2026-10-29'],
    ])('rechaza fechas incompletas o inválidas antes de consultar: %s - %s', async (start, end) => {
      await expect(controller[action](10, start as string, end as string)).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(service[action]).not.toHaveBeenCalled();
    });
  }
);

describe('Fechas del reporte de asignaciones', () => {
  const service = { generarExcelEgresosFacturacion: jest.fn(async () => []) };
  const controller = new FacturadoresController(service as any);
  beforeEach(() => jest.clearAllMocks());
  it('permite consultar un único día sin adelantarlo por la zona horaria', async () => {
    await controller.generarExcelEgresosFacturacion('2026-10-28', '2026-10-28');
    expect(service.generarExcelEgresosFacturacion).toHaveBeenCalledWith(
      new Date('2026-10-28T00:00:00Z'),
      new Date('2026-10-28T00:00:00Z')
    );
  });
  it.each([
    ['2026-10-29', '2026-10-28'],
    ['2026-02-30', '2026-03-01'],
    ['', '2026-10-29'],
  ])('rechaza el rango inválido %s a %s', async (start, end) => {
    await expect(controller.generarExcelEgresosFacturacion(start, end)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(service.generarExcelEgresosFacturacion).not.toHaveBeenCalled();
  });
});
