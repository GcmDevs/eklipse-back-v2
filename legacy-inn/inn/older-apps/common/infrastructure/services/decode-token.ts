import { jwtDecode } from 'jwt-decode';
import { GcmContexts } from '@inn/old/common/application/constants';
import { RSAServices } from '@common/application/services';
import { GCM_CONTEXTS, GcmContextCode } from '@common/domain/types';

export interface IAuthToken {
  jti: string;
  sub: GcmContextCode;
  dcm: string;
  fnm: string;
  iat: number;
  exp: number;
}

export interface ITokenDecoded {
  id: number;
  context: GcmContextCode;
  document: string;
  fullName: string;
  user: {
    id: number;
    cedula: string;
    nombreCompleto: string;
  };
  createdAt: Date;
  expiredAt: Date;
}

export const decodeToken = (token: string): ITokenDecoded => {
  try {
    const tkDecoded: IAuthToken = jwtDecode(token);

    const tkFt: ITokenDecoded = {
      id: 0,
      context: GCM_CONTEXTS.ALTACENTRO.getCode(),
      document: '',
      fullName: '',
      user: {
        id: 0,
        cedula: '',
        nombreCompleto: '',
      },
      createdAt: _tokenDateToDate(tkDecoded.iat),
      expiredAt: _tokenDateToDate(tkDecoded.exp),
    };

    tkFt.id = RSAServices.decryptId(tkDecoded.jti);
    tkFt.context = tkDecoded.sub;
    tkFt.document = tkDecoded.dcm;
    tkFt.fullName = tkDecoded.fnm;
    tkFt.user.id = RSAServices.decryptId(tkDecoded.jti);
    tkFt.user.cedula = tkDecoded.dcm;
    tkFt.user.nombreCompleto = tkDecoded.fnm;

    return tkFt;
  } catch (error) {
    throw new Error(error);
  }
};

const _tokenDateToDate = (date: number): Date => {
  const initOfTimes = new Date(0);
  return new Date(initOfTimes.setUTCSeconds(date));
};
