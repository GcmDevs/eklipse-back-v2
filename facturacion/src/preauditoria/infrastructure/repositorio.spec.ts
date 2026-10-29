jest.mock('@common/infrastructure/services/connections', () => ({}));
import { ServiceUnavailableException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { RepositorioPre, TABLAS_PRE } from './repositorio';
import { actorPrueba, auditoriaPrueba } from '../testing/fixtures';
import { PERMISOS_PRE } from '../domain/modelo';

function fuente(database = 'DGEMPRES99') {
  const runner = {
    query: jest.fn().mockResolvedValue([]),
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    isTransactionActive: true,
  };
  const conexion = {
    options: { database },
    isInitialized: true,
    initialize: jest.fn(),
    query: jest.fn().mockResolvedValue([]),
    createQueryRunner: jest.fn().mockReturnValue(runner),
  };
  return { conexion, runner, repo: new RepositorioPre(conexion as unknown as DataSource) };
}
const tablasInstaladas = () => Object.fromEntries(TABLAS_PRE.map((_, i) => [`t${i}`, i + 1]));

describe('Persistencia por contexto sin inicialización automática', () => {
  it('detecta instalación pendiente usando únicamente SELECT en la conexión inyectada', async () => {
    const { conexion, repo } = fuente();
    conexion.query.mockResolvedValue([{}]);
    await expect(repo.asegurar()).rejects.toThrow('pendiente');
    expect(conexion.query.mock.calls.every(([sql]) => sql.startsWith('SELECT'))).toBe(true);
    expect(conexion.initialize).not.toHaveBeenCalled();
    expect(conexion.createQueryRunner).not.toHaveBeenCalled();
  });
  it('comprueba las 14 tablas y la versión instalada en la base de la sede activa', async () => {
    const { conexion, repo } = fuente();
    conexion.query
      .mockResolvedValueOnce([tablasInstaladas()])
      .mockResolvedValueOnce([{ Version: 1 }]);
    expect(TABLAS_PRE).toHaveLength(14);
    await expect(repo.instalado()).resolves.toBe(true);
    expect(repo.baseDatos).toBe('DGEMPRES99');
    expect(conexion.query).toHaveBeenCalledTimes(2);
    for (const tabla of TABLAS_PRE)
      expect(conexion.query.mock.calls[0][0]).toContain(`dbo.${tabla}`);
    expect(conexion.query.mock.calls[1][0]).toContain('EKSLNPREAUDINSTALACION');
    expect(conexion.initialize).not.toHaveBeenCalled();
  });
  it('no acepta una instalación incompleta ni una versión distinta', async () => {
    const incompleta = fuente(),
      versionDistinta = fuente();
    incompleta.conexion.query.mockResolvedValue([{ ...tablasInstaladas(), t13: null }]);
    await expect(incompleta.repo.instalado()).resolves.toBe(false);
    expect(incompleta.conexion.query).toHaveBeenCalledTimes(1);
    versionDistinta.conexion.query
      .mockResolvedValueOnce([tablasInstaladas()])
      .mockResolvedValueOnce([{ Version: 2 }]);
    await expect(versionDistinta.repo.instalado()).resolves.toBe(false);
  });
  it('informa una conexión no disponible sin intentar inicializarla', async () => {
    const { conexion, repo } = fuente();
    conexion.isInitialized = false;
    await expect(repo.instalado()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(conexion.query).not.toHaveBeenCalled();
    expect(conexion.initialize).not.toHaveBeenCalled();
  });
  it('mantiene separadas las consultas de dos sedes con el mismo número de ingreso', async () => {
    const a = fuente('DGEMPRES99'),
      b = fuente('DGOTRASEDE');
    a.conexion.query.mockResolvedValue([{ Id: 'solo-a' }]);
    b.conexion.query.mockResolvedValue([]);
    await expect(a.repo.existe('ALTACENTRO', '1234')).resolves.toBe(true);
    await expect(b.repo.existe('SANJUAN', '1234')).resolves.toBe(false);
    expect(a.conexion.query).toHaveBeenCalledTimes(1);
    expect(b.conexion.query).toHaveBeenCalledTimes(1);
    expect(a.conexion.query.mock.calls[0][1]).toEqual(['ALTACENTRO', '1234']);
    expect(b.conexion.query.mock.calls[0][1]).toEqual(['SANJUAN', '1234']);
    expect(a.repo.baseDatos).toBe('DGEMPRES99');
    expect(b.repo.baseDatos).toBe('DGOTRASEDE');
  });
  it('cada transacción usa únicamente el QueryRunner de su propia sede', async () => {
    const a = fuente('DGEMPRES99'),
      b = fuente('DGOTRASEDE');
    a.runner.query.mockResolvedValue([{ sede: 'a' }]);
    b.runner.query.mockResolvedValue([{ sede: 'b' }]);
    const resultados = await Promise.all([
      a.repo.transaccion(sql => sql.query('SELECT @0 sede', ['a'])),
      b.repo.transaccion(sql => sql.query('SELECT @0 sede', ['b'])),
    ]);
    expect(resultados).toEqual([[{ sede: 'a' }], [{ sede: 'b' }]]);
    expect(a.runner.query).toHaveBeenCalledWith('SELECT @0 sede', ['a']);
    expect(b.runner.query).toHaveBeenCalledWith('SELECT @0 sede', ['b']);
    for (const sede of [a, b]) {
      expect(sede.conexion.query).not.toHaveBeenCalled();
      expect(sede.conexion.initialize).not.toHaveBeenCalled();
      expect(sede.conexion.createQueryRunner).toHaveBeenCalledTimes(1);
      expect(sede.runner.startTransaction).toHaveBeenCalledWith('SERIALIZABLE');
      expect(sede.runner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(sede.runner.release).toHaveBeenCalledTimes(1);
    }
  });
  it('usa parámetros para búsquedas y siempre limita contexto y propietario', () => {
    const { repo } = fuente(),
      f = repo.filtros(
        { ...actorPrueba, permisos: [PERMISOS_PRE.auditar] },
        { buscar: "x%' OR 1=1--", responsable: '99' }
      );
    expect(f.where).toContain('Contexto=@0');
    expect(f.where).toContain('ResponsableId=@1');
    expect(f.p[1]).toBe(7);
    expect(f.where).not.toContain('OR 1=1');
    expect(f.p[2]).toContain("x~%' OR 1=1--");
  });
  it('no reemplaza hallazgos si falla la versión de la auditoría', async () => {
    const sql = { query: jest.fn().mockResolvedValue([]) },
      { repo } = fuente();
    await expect(repo.guardar(sql, auditoriaPrueba(), 1)).rejects.toThrow('cambió');
    expect(sql.query).toHaveBeenCalledTimes(1);
    expect(sql.query.mock.calls[0][0]).toContain('AND Version=@16');
  });
  it('revierte y libera la conexión de la sede cuando falla un bloque transaccional', async () => {
    const { repo, runner } = fuente();
    await expect(
      repo.transaccion(async () => {
        throw Error('fallo');
      })
    ).rejects.toThrow('fallo');
    expect(runner.startTransaction).toHaveBeenCalledWith('SERIALIZABLE');
    expect(runner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(runner.release).toHaveBeenCalledTimes(1);
    expect(runner.commitTransaction).not.toHaveBeenCalled();
  });
});
