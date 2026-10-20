import { jwtDecode } from 'jwt-decode';
import { RSAServices } from './rsa';
import {
  GCM_CONTEXTS,
  GcmContextCode,
  gcmContextFactory,
  GcmContextType,
  USU_EXTS,
  UsuExtCode,
  UsuExtType,
  usuExtTypeFactory,
} from '../../domain/types';

export type TablePathAuthType = 'GENUSUARIO' | 'EKINNOFERPROVEEDOR';

export interface IAuthToken {
  jti: string;
  rst: boolean;
  dim: boolean;
  tue: UsuExtCode;
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
  isDim: boolean;
  tipoUsuExt: UsuExtType;
  passWasReset: boolean;
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
    const tkDcd: IAuthToken = jwtDecode(token);

    const tkFt: ITokenDecoded = {
      user: {
        id: 0,
        document: '',
        fullName: '',
      },
      isDim: tkDcd.dim === undefined ? true : tkDcd.dim,
      tipoUsuExt: tkDcd.tue === undefined ? USU_EXTS.GENUSUARIO : usuExtTypeFactory(tkDcd.tue),
      passWasReset: tkDcd.rst,
      context: GCM_CONTEXTS.ALTACENTRO,
      tablePath: tkDcd.tbl as any,
      createdAt: _tokenDateToDate(tkDcd.iat),
      expiredAt: _tokenDateToDate(tkDcd.exp),
    };

    tkFt.context = gcmContextFactory(tkDcd.sub);
    tkFt.user.id = RSAServices.decryptId(tkDcd.jti);
    tkFt.user.document = tkDcd.dcm;
    tkFt.user.fullName = tkDcd.fnm;

    return tkFt;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const JWTServices = { decodeToken };
