import { StrictJwtAuthGuard } from '@common/infrastructure/guards/strict-jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { processEnv } from '@env';
import * as jwt from 'jsonwebtoken';

const secret = processEnv.JWT_SECRET_KEY;

const sign = (payload: object = {}, options: jwt.SignOptions = {}, key = secret) =>
  jwt.sign({ jti: '1', sub: 'ALTACENTRO', tbl: 'GENUSUARIO', ...payload }, key, {
    algorithm: 'HS512',
    expiresIn: '10m',
    ...options,
  });

const ctx = (request: object) =>
  ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;

describe('StrictJwtAuthGuard', () => {
  const guard = new StrictJwtAuthGuard();

  it('acepta un Bearer válido y expone el exp verificado', () => {
    const token = sign();
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    expect(guard.canActivate(ctx(req))).toBe(true);
    expect(req.tokenExp).toBe((jwt.decode(token) as jwt.JwtPayload).exp);
  });

  it('verifica la firma aunque PRODUCTION sea false (no degrada a decode)', () => {
    expect(processEnv.PRODUCTION).toBe(false);
    const forged = sign({}, {}, 'otra-clave');
    expect(() => guard.canActivate(ctx({ headers: { authorization: `Bearer ${forged}` } }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza sin encabezado Authorization', () => {
    expect(() => guard.canActivate(ctx({ headers: {} }))).toThrow(UnauthorizedException);
  });

  it('rechaza esquemas distintos de Bearer', () => {
    expect(() =>
      guard.canActivate(ctx({ headers: { authorization: `Basic ${sign()}` } })),
    ).toThrow(UnauthorizedException);
  });

  it('rechaza un token adulterado (payload modificado)', () => {
    const [h, , s] = sign().split('.');
    const evil = Buffer.from(JSON.stringify({ jti: '99', sub: 'ALTACENTRO', exp: 9999999999 })).toString(
      'base64url',
    );
    expect(() =>
      guard.canActivate(ctx({ headers: { authorization: `Bearer ${h}.${evil}.${s}` } })),
    ).toThrow(UnauthorizedException);
  });

  it('rechaza un token expirado', () => {
    const expired = sign({}, { expiresIn: -10 });
    expect(() => guard.canActivate(ctx({ headers: { authorization: `Bearer ${expired}` } }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un token firmado con otro algoritmo (HS256) o sin firma (alg none)', () => {
    const hs256 = sign({}, { algorithm: 'HS256' });
    expect(() => guard.canActivate(ctx({ headers: { authorization: `Bearer ${hs256}` } }))).toThrow(
      UnauthorizedException,
    );
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
      '{"jti":"1","sub":"ALTACENTRO","exp":9999999999}',
    ).toString('base64url')}.`;
    expect(() => guard.canActivate(ctx({ headers: { authorization: `Bearer ${none}` } }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un token sin exp (no se podría acotar la conexión)', () => {
    const noExp = jwt.sign({ jti: '1', sub: 'ALTACENTRO' }, secret, { algorithm: 'HS512' });
    expect(() => guard.canActivate(ctx({ headers: { authorization: `Bearer ${noExp}` } }))).toThrow(
      UnauthorizedException,
    );
  });

  it('NO acepta el token por query string, ni siquiera válido', () => {
    const req = { headers: {}, query: { token: sign() } };
    expect(() => guard.canActivate(ctx(req))).toThrow(UnauthorizedException);
  });

  it('un header Bearer inválido no se rescata con un token válido en la query', () => {
    const req = { headers: { authorization: 'Bearer basura' }, query: { token: sign() } };
    expect(() => guard.canActivate(ctx(req))).toThrow(UnauthorizedException);
  });
});
