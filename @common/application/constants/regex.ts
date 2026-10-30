export const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const UUID_WITH_EXTENSION =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.[a-zA-Z0-9]+$/;

/* FUNCIONES PARA VALIDACIONES DE REGEX, LUEGO SE CAMBIARAN DE UBICACION CUANDO 
SEA MAS USADO POR MAS MIEMBROS Y CREZCA*/
export function isUuidFileName(name: string): boolean {
  return UUID.test(name) || UUID_WITH_EXTENSION.test(name);
}

