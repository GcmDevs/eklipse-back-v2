import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services/connections';
import { ConsultaColaReportesImpl } from './consulta-cola.impl';
import { EjecucionesReportesImpl } from './ejecuciones.impl';
import { INGRESOS_REPORTES_SQL, PACIENTE_REPORTES_SQL } from '../queries/consulta';

jest.mock('@common/infrastructure/services/connections', () => ({ switchConn: jest.fn() }));

describe('Consulta clínica del despachador sin sesión HTTP', () => {
  const propietario = { usuario: 7, contexto: 'ALTACENTRO', esDinamica: true };
  const paciente = { OID: 42, PACNUMDOC: '001234', PACPRINOM: 'ANA', PACPRIAPE: 'PÉREZ' };
  let servicio: ConsultaColaReportesImpl;
  let query: jest.Mock;

  beforeEach(() => {
    query = jest.fn();
    (switchConn as jest.Mock).mockReset().mockReturnValue({ query });
    servicio = new ConsultaColaReportesImpl();
  });

  it('mantiene una instancia independiente de peticiones HTTP', async () => {
    const modulo = await Test.createTestingModule({
      providers: [ConsultaColaReportesImpl, EjecucionesReportesImpl],
    }).compile();
    expect(modulo.get(ConsultaColaReportesImpl)).toBe(
      await modulo.resolve(ConsultaColaReportesImpl)
    );
    expect(modulo.get(EjecucionesReportesImpl)).toBe(await modulo.resolve(EjecucionesReportesImpl));
    await modulo.close();
  });

  it('elige la sede guardada y conserva identidad y estado para revalidar el turno', async () => {
    query
      .mockResolvedValueOnce([paciente])
      .mockResolvedValueOnce([
        { AINCONSEC: 20, AINFECING: null, ESTADO_INGRESO: 'Facturado', INGRESO_ACTIVO: 1 },
      ]);
    const resultado = await servicio.consultar(' 001234 ', propietario);
    expect(switchConn).toHaveBeenCalledWith(GCM_CONTEXTS.ALTACENTRO);
    expect(query).toHaveBeenNthCalledWith(1, PACIENTE_REPORTES_SQL, ['001234']);
    expect(query).toHaveBeenNthCalledWith(2, INGRESOS_REPORTES_SQL, [42]);
    expect(resultado).toMatchObject({
      paciente: { documento: '001234' },
      ingresos: [{ consecutivo: 20, estado: 'Facturado', activo: false }],
    });
    query.mockResolvedValueOnce([]);
    await servicio.consultar('123', { ...propietario, contexto: 'SANJUAN' });
    expect(switchConn).toHaveBeenLastCalledWith(GCM_CONTEXTS.SANJUAN);
  });

  it('rechaza datos inválidos antes de acceder a las conexiones', async () => {
    await expect(servicio.consultar('1 OR 1=1', propietario)).rejects.toBeInstanceOf(
      BadRequestException
    );
    await expect(
      servicio.consultar('123', { ...propietario, contexto: 'NO_EXISTE' })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(switchConn).not.toHaveBeenCalled();
  });

  it('no mezcla pacientes duplicados ni expone errores internos de conexión', async () => {
    query.mockResolvedValueOnce([paciente, { ...paciente, OID: 43 }]);
    await expect(servicio.consultar('001234', propietario)).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(query).toHaveBeenCalledTimes(1);
    query.mockRejectedValueOnce(new Error('detalle privado del servidor'));
    await expect(servicio.consultar('001234', propietario)).rejects.toThrow(
      ServiceUnavailableException
    );
    query.mockResolvedValueOnce([]);
    expect(await servicio.consultar('001234', propietario)).toEqual({
      paciente: null,
      ingresos: [],
    });
  });
});
