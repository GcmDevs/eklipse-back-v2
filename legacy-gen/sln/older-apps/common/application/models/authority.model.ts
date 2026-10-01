export interface IUserAuthorities {
  authorities: IAuthority[];
  onlyCodesAuthorities: string[];
}

export interface IAuthority {
  isByRol: boolean;
  id: number;
  code: string;
  name: string;
  module?: string;
  subModule?: string;
}
