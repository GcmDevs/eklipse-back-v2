jest.mock('@common/application/services', () => ({ JWTServices: { decodeToken: jest.fn() } }));
jest.mock('@common/infrastructure/services/connections', () => ({ switchConn: jest.fn() }));
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JWTServices } from '@common/application/services';
import { GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services/connections';
import { conexionPre } from './conexion';

const request = (authorization?: string) =>
  ({
    headers: authorization ? { authorization } : {},
    body: { contexto: 'SANJUAN', baseDatos: 'OTRA_BASE' },
    query: { contexto: 'EKLIPSE', baseDatos: 'CENTRAL' },
  }) as unknown as Request;

describe('Selección de conexión de Preauditoría desde la sesión autenticada', () => {
  const conexionA = { options: { database: 'DGEMPRES99' }, initialize: jest.fn() },
    conexionB = { options: { database: 'OTRASEDE' }, initialize: jest.fn() };
  beforeEach(() => {
    jest.clearAllMocks();
    (JWTServices.decodeToken as jest.Mock).mockReset().mockReturnValue({
      isDim: true,
      passWasReset: false,
      context: GCM_CONTEXTS.ALTACENTRO,
    });
    (switchConn as jest.Mock).mockReset().mockImplementation(contexto => {
      if (contexto === GCM_CONTEXTS.ALTACENTRO) return conexionA;
      if (contexto === GCM_CONTEXTS.SANJUAN) return conexionB;
      throw Error('No debe seleccionarse una conexión distinta al contexto autenticado');
    });
  });
  it('usa exclusivamente el contexto del token e ignora los selectores de base enviados por el cliente', () => {
    expect(conexionPre(request('Bearer token-firmado'))).toBe(conexionA);
    expect(JWTServices.decodeToken).toHaveBeenCalledWith('token-firmado');
    expect(switchConn).toHaveBeenCalledTimes(1);
    expect(switchConn).toHaveBeenCalledWith(GCM_CONTEXTS.ALTACENTRO);
    expect(conexionA.initialize).not.toHaveBeenCalled();
  });
  it('dos sesiones de sedes distintas reciben conexiones distintas', () => {
    const a = conexionPre(request('Bearer token-a'));
    (JWTServices.decodeToken as jest.Mock).mockReturnValue({
      isDim: true,
      passWasReset: false,
      context: GCM_CONTEXTS.SANJUAN,
    });
    const b = conexionPre(request('Bearer token-b'));
    expect(a).toBe(conexionA);
    expect(b).toBe(conexionB);
    expect(a).not.toBe(b);
    expect(switchConn).toHaveBeenNthCalledWith(1, GCM_CONTEXTS.ALTACENTRO);
    expect(switchConn).toHaveBeenNthCalledWith(2, GCM_CONTEXTS.SANJUAN);
    expect(conexionB.initialize).not.toHaveBeenCalled();
  });
  it.each([undefined, '', 'Basic token', 'Bearer'])(
    'rechaza autorización ausente o inválida: %s',
    authorization => {
      expect(() => conexionPre(request(authorization))).toThrow(UnauthorizedException);
      expect(switchConn).not.toHaveBeenCalled();
    }
  );
  it('rechaza un token inválido antes de seleccionar la conexión', () => {
    (JWTServices.decodeToken as jest.Mock).mockImplementation(() => {
      throw Error('firma inválida');
    });
    expect(() => conexionPre(request('Bearer token-invalido'))).toThrow(UnauthorizedException);
    expect(switchConn).not.toHaveBeenCalled();
  });
  it.each([
    {
      nombre: 'usuario externo',
      isDim: false,
      passWasReset: false,
      context: GCM_CONTEXTS.ALTACENTRO,
    },
    {
      nombre: 'contraseña pendiente de cambio',
      isDim: true,
      passWasReset: true,
      context: GCM_CONTEXTS.ALTACENTRO,
    },
    {
      nombre: 'contexto central EKLIPSE',
      isDim: true,
      passWasReset: false,
      context: GCM_CONTEXTS.EKLIPSE,
    },
  ])('rechaza $nombre sin seleccionar una base', datos => {
    (JWTServices.decodeToken as jest.Mock).mockReturnValue(datos);
    expect(() => conexionPre(request('Bearer token-firmado'))).toThrow(ForbiddenException);
    expect(switchConn).not.toHaveBeenCalled();
  });
});
