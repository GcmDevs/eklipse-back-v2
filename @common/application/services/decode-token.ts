import {
  GCM_CONTEXTS,
  GcmContextCode,
  GcmContextType,
  gcmContextFactory,
} from '../../domain/types';
import { jwtDecode } from 'jwt-decode';
import { RSAServices } from './rsa';

export interface IAuthToken {
  jti: string;
  sub: GcmContextCode;
  dcm: string;
  fnm: string;
  dim: boolean;
  rst: boolean;
  iat?: number;
  exp?: number;
}

export interface ITokenDecoded {
  user: {
    id: number;
    document: string;
    fullName: string;
  };
  isDim: boolean;
  passWasReset: boolean;
  context: GcmContextType;
  createdAt: Date;
  expiredAt: Date;
}

const _tokenDateToDate = (date: number): Date => {
  const initOfTimes = new Date(0);
  return new Date(initOfTimes.setUTCSeconds(date));
};

const decodeToken = (token: string): ITokenDecoded => {
  try {
    const tkDecoded: IAuthToken = jwtDecode(token);

    const tkFt: ITokenDecoded = {
      user: {
        id: RSAServices.decryptId(tkDecoded.jti),
        document: tkDecoded.dcm,
        fullName: tkDecoded.fnm,
      },
      isDim: tkDecoded.dim,
      passWasReset: tkDecoded.rst,
      context: gcmContextFactory(tkDecoded.sub),
      createdAt: _tokenDateToDate(tkDecoded.iat),
      expiredAt: _tokenDateToDate(tkDecoded.exp),
    };

    return tkFt;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const JWTServices = {
  decodeToken,
};
