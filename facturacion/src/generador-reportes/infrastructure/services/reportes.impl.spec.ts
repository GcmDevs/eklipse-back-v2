import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GeneradorReportesImpl } from './reportes.impl';
import { INGRESOS_REPORTES_SQL, PACIENTE_REPORTES_SQL } from '../queries/consulta';

jest.mock('@common/infrastructure/services/base.source', () => ({ BaseSource: class {} }));

describe('GeneradorReportesImpl', () => {
  const paciente = {
    OID: 42,
    PACNUMDOC: '001234',
    PACPRINOM: ' ANA ',
    PACSEGNOM: null,
    PACPRIAPE: ' PÉREZ ',
    PACSEGAPE: '',
    GPAFECNAC: '1995-10-10',
    SEXO: 'Femenino',
  };
  let servicio: GeneradorReportesImpl;
  let query: jest.Mock;

  beforeEach(() => {
    query = jest.fn();
    servicio = Object.assign(Object.create(GeneradorReportesImpl.prototype), { conn: { query } });
  });

  it('consulta por parámetros, conserva ceros y devuelve todos los ingresos en el orden SQL', async () => {
    const estados = ['Registrado', 'Facturado', 'Anulado', 'Bloqueado', 'Cerrado', 'Desconocido'];
    query.mockResolvedValueOnce([paciente]).mockResolvedValueOnce(
      estados.map((estado, index) => ({
        AINCONSEC: 200 - index,
        AINFECING: new Date(`2026-10-0${9 - index}T10:30:00.000Z`),
        ESTADO_INGRESO: estado,
      }))
    );
    const resultado = await servicio.consultar(' 001234 ');
    expect(query).toHaveBeenNthCalledWith(1, PACIENTE_REPORTES_SQL, ['001234']);
    expect(query).toHaveBeenNthCalledWith(2, INGRESOS_REPORTES_SQL, [42]);
    expect(INGRESOS_REPORTES_SQL).toMatch(/ORDER BY AINFECING DESC/);
    expect(PACIENTE_REPORTES_SQL).not.toContain('001234');
    expect(resultado.paciente).toEqual({
      documento: '001234',
      nombreCompleto: 'ANA PÉREZ',
      fechaNacimiento: '1995-10-10',
      sexo: 'Femenino',
    });
    expect(PACIENTE_REPORTES_SQL).toContain('GPAFECNAC');
    expect(PACIENTE_REPORTES_SQL).toContain('CASE GPASEXPAC');
    expect(resultado.ingresos.map(ingreso => ingreso.estado)).toEqual(estados);
    expect(resultado.ingresos.map(ingreso => ingreso.consecutivo)).toEqual([
      200, 199, 198, 197, 196, 195,
    ]);
    expect(resultado.ingresos[0].fechaIngreso).toBe('2026-10-09T10:30:00.000Z');
  });

  it('conserva el paciente cuando no tiene ingresos', async () => {
    query.mockResolvedValueOnce([paciente]).mockResolvedValueOnce([]);
    expect(await servicio.consultar('001234')).toEqual({
      paciente: {
        documento: '001234',
        nombreCompleto: 'ANA PÉREZ',
        fechaNacimiento: '1995-10-10',
        sexo: 'Femenino',
      },
      ingresos: [],
    });
  });

  it('no consulta ingresos si el paciente no existe', async () => {
    query.mockResolvedValueOnce([]);
    expect(await servicio.consultar('123')).toEqual({ paciente: null, ingresos: [] });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('rechaza pacientes duplicados sin mezclar ingresos', async () => {
    query.mockResolvedValueOnce([paciente, { ...paciente, OID: 43 }]);
    await expect(servicio.consultar('001234')).rejects.toBeInstanceOf(ConflictException);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([
    '',
    ' ',
    '123abc',
    '1 OR 1=1',
    "1'; DROP TABLE GENPACIEN;--",
    '1'.repeat(21),
    null,
    123,
    ['123'],
  ])('rechaza la cédula inválida %p antes de acceder a SQL', async documento => {
    await expect(servicio.consultar(documento)).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('acepta una cédula de 20 dígitos sin convertirla a número', async () => {
    query.mockResolvedValueOnce([]);
    await servicio.consultar('00000000000000000001');
    expect(query).toHaveBeenCalledWith(PACIENTE_REPORTES_SQL, ['00000000000000000001']);
  });

  it.each(['paciente', 'ingresos'])(
    'oculta detalles internos cuando falla la consulta de %s',
    async paso => {
      if (paso === 'ingresos') query.mockResolvedValueOnce([paciente]);
      query.mockRejectedValueOnce(new Error('SQL password=secreto'));
      await expect(servicio.consultar('001234')).rejects.toThrow(ServiceUnavailableException);
    }
  );

  it('admite una fecha no registrada', async () => {
    query
      .mockResolvedValueOnce([paciente])
      .mockResolvedValueOnce([{ AINCONSEC: 123, AINFECING: null, ESTADO_INGRESO: 'Cerrado' }]);
    expect((await servicio.consultar('001234')).ingresos[0].fechaIngreso).toBeNull();
  });

  it('conserva la ausencia de fecha de nacimiento y sexo sin inventar datos', async () => {
    query
      .mockResolvedValueOnce([{ ...paciente, GPAFECNAC: null, SEXO: null }])
      .mockResolvedValueOnce([]);
    const resultado = await servicio.consultar('001234');
    expect(resultado.paciente.fechaNacimiento).toBeNull();
    expect(resultado.paciente.sexo).toBe('No registrado');
  });
});
