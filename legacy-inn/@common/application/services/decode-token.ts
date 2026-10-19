import {
  GCM_CONTEXTS,
  GcmContextCode,
  GcmContextType,
  gcmContextFactory,
} from '@common/domain/types';
import { jwtDecode } from 'jwt-decode';
import { RSAServices } from './rsa';

export type TablePathAuthType = 'GENUSUARIO' | 'EKINNOFERPROVEEDOR';

export interface IAuthToken {
  jti: string;
  sub: GcmContextCode;
  dcm: string;
  fnm: string;
  tbl: TablePathAuthType;
  iat?: number;
  exp?: number;
}

export interface ITokenDecoded {
  user: {
    id: number;
    document: string;
    fullName: string;
  };
  context: GcmContextType;
  tablePath: TablePathAuthType;
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
        id: 0,
        document: '',
        fullName: '',
      },
      tablePath: tkDecoded.tbl as any,
      context: GCM_CONTEXTS.ALTACENTRO,
      createdAt: _tokenDateToDate(tkDecoded.iat),
      expiredAt: _tokenDateToDate(tkDecoded.exp),
    };

    tkFt.context = gcmContextFactory(tkDecoded.sub);
    tkFt.user.id = RSAServices.decryptId(tkDecoded.jti);
    tkFt.user.document = tkDecoded.dcm;
    tkFt.user.fullName = tkDecoded.fnm;

    return tkFt;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const JWTServices = {
  decodeToken,
};
