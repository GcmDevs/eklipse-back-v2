import { EntidadBasicaRes, NuevaEntidadRes, UsuarioBasicoRes } from '@common/application/responses';

export const dataToNuevaEntidadRes = (data: any) => {
  if (data && data.id) {
    const e = new NuevaEntidadRes();
    e.id = data.id;
    return e;
  } else {
    return null;
  }
};

export const dataToEntidadBasicaRes = (data: any) => {
  if (data && data.id && data.codigo && data.nombre) {
    const e = new EntidadBasicaRes();
    e.id = data.id;
    e.codigo = data.codigo;
    e.nombre = data.nombre;
    return e;
  } else {
    return null;
  }
};

export const dataToUsuarioBasicoRes = (data: any) => {
  if (data && data.cedula && data.nombreCompleto) {
    const e = new UsuarioBasicoRes();
    e.cedula = data.cedula;
    e.nombreCompleto = data.nombreCompleto;
    return e;
  } else {
    return null;
  }
};


export * from "./database-exception.factory";
export * from "./domain-error.factory";