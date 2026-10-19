/** @deprecated */
export interface DefaultResponse {
  success: boolean;
  message: string;
  data?: any;
}

/** @deprecated */
export interface AuthorityModel {
  id: number;
  codigo: string;
  descripcion: string;
  addedByRol: boolean;
}

/** @deprecated */
export interface AuthUserModel {
  id: number;
  authorities: AuthorityModel[] | undefined;
  onlyCodesAuthorities: string[] | undefined;
}
