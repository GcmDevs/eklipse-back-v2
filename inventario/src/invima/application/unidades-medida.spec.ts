import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InvimaService } from './invima.service';
import { ListarUnidadesMedidaDto } from '../presentation/invima.dto';

jest.mock('@common/infrastructure/services', () => ({
  BaseSource: class {
    protected conn: any;
    constructor(request: any) {
      this.conn = request.connection;
    }
  },
}));

const crear = (rows: any[] = []) => {
  const connection = { query: jest.fn().mockResolvedValue(rows) };
  return { service: new InvimaService({ connection } as any, {} as any), connection };
};

describe('Catálogo de unidades de medida por contexto', () => {
  it('lee el catálogo existente con límite y orden estables y conserva los símbolos', async () => {
    const { service, connection } = crear([
      { id: 2, nombre: ' KILOGRAMO ', simbolo: 'kg ', esBase: 1 },
      { id: 10, nombre: 'GRADO CELSIUS', simbolo: 'C', esBase: 0 },
      { id: 11, nombre: 'MICROGRAMO', simbolo: 'µg', esBase: false },
    ]);
    await expect(service.unidadesMedida()).resolves.toEqual([
      { id: 2, nombre: 'KILOGRAMO', simbolo: 'kg', esBase: true },
      { id: 10, nombre: 'GRADO CELSIUS', simbolo: 'C', esBase: false },
      { id: 11, nombre: 'MICROGRAMO', simbolo: 'µg', esBase: false },
    ]);
    const [sql, params] = connection.query.mock.calls[0];
    expect(sql).toContain('FROM EKINNEQPHVUNIDADESMEDIDA');
    expect(sql).toContain('SELECT TOP (@0)');
    expect(sql).toContain('ORDER BY NOMBRE ASC, SIMBOLO ASC, OID ASC');
    expect(params).toEqual([30, '', '%%']);
  });

  it.each([' KILOGRAMO ', 'kg', 'GRADO CÉLSIUS'])('busca por nombre o símbolo: %s', async q => {
    const { service, connection } = crear();
    await expect(service.unidadesMedida(q, 15)).resolves.toEqual([]);
    const [sql, params] = connection.query.mock.calls[0];
    expect(sql).toContain('NOMBRE COLLATE Latin1_General_CI_AI LIKE @2');
    expect(sql).toContain('SIMBOLO COLLATE Latin1_General_CI_AI LIKE @2');
    expect(params).toEqual([15, q.trim(), `%${q.trim()}%`]);
  });

  it('parametriza comillas y trata los comodines de búsqueda como texto literal', async () => {
    const { service, connection } = crear();
    const intento = "kg' OR 1=1 --";
    await service.unidadesMedida(intento);
    let [sql, params] = connection.query.mock.calls[0];
    expect(sql).not.toContain(intento);
    expect(params).toEqual([30, intento, `%${intento}%`]);
    await service.unidadesMedida('100%_[\\');
    [sql, params] = connection.query.mock.calls[1];
    expect(sql).toContain("ESCAPE N'\\'");
    expect(params[2]).toBe('%100\\%\\_\\[\\\\%');
  });

  it('no comparte resultados ni conexiones entre contextos', async () => {
    const altacentro = crear([{ id: 1, nombre: 'METRO', simbolo: 'm', esBase: 1 }]);
    const otro = crear([{ id: 2, nombre: 'KILOGRAMO', simbolo: 'kg', esBase: 1 }]);
    expect((await altacentro.service.unidadesMedida())[0].simbolo).toBe('m');
    expect((await otro.service.unidadesMedida())[0].simbolo).toBe('kg');
    expect(altacentro.connection.query).toHaveBeenCalledTimes(1);
    expect(otro.connection.query).toHaveBeenCalledTimes(1);
  });

  it.each([0, 101, -1, 1.5, NaN])('rechaza un límite no acotado: %s', async limit => {
    const { service, connection } = crear();
    await expect(service.unidadesMedida('', limit)).rejects.toBeInstanceOf(BadRequestException);
    expect(connection.query).not.toHaveBeenCalled();
  });

  it('valida el término antes de consultar', async () => {
    const { service, connection } = crear();
    for (const q of [null, {}, ['kg'], 'x'.repeat(121)])
      await expect(service.unidadesMedida(q as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(connection.query).not.toHaveBeenCalled();
  });

  it('aplica defaults y valida los parámetros HTTP', async () => {
    const defaults = plainToInstance(ListarUnidadesMedidaDto, {});
    expect(defaults).toMatchObject({ q: '', limit: 30 });
    expect(await validate(defaults)).toHaveLength(0);
    const valido = plainToInstance(ListarUnidadesMedidaDto, { q: ' kg ', limit: '100' });
    expect(await validate(valido)).toHaveLength(0);
    expect(valido).toMatchObject({ q: 'kg', limit: 100 });
    for (const input of [
      { q: {} },
      { q: ['kg'] },
      { q: 'x'.repeat(121) },
      { limit: 'abc' },
      { limit: 0 },
      { limit: 101 },
      { limit: 1.5 },
    ])
      expect(
        (await validate(plainToInstance(ListarUnidadesMedidaDto, input))).length
      ).toBeGreaterThan(0);
  });
});
