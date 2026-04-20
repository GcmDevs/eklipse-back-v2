import { SumPacDto, SumPacRecibidoPayload } from '../../presentation/dtos';

export const findSuministrosByIdQuery = (ids: number[]) => {
  return `SELECT OID id, IDDCANTID cantidad, ISMCANREC cantidadRecibida, INNCSUMPA ordenId,
  GENUSURECI recibidoPor FROM INNMSUMPA WHERE OID IN (${ids});`;
};

export const recibirSuministroQuery = (id: number, cantidad: number, recibidoPor: number) => {
  return `UPDATE INNMSUMPA SET ISMCANREC = ${cantidad}, GENUSURECI = ${recibidoPor} WHERE OID = ${id};`;
};

export const errorMessage = (suministro: SumPacDto, suministroRecibido: SumPacRecibidoPayload) => {
  if (suministroRecibido.cantidad > suministro.cantidad) {
    return 'Está recibiendo mas de lo que pidió en uno o mas productos';
  } else if (suministroRecibido.cantidad < 0) {
    return 'Está usando un numero negativo para indicar la cantidad recibida en uno o mas productos';
  } else {
    return 'Error desconocido';
  }
};
