import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';

const UNIQUE_INDEX_CONFLICTS: Array<{ index: string; message: string }> = [
  { index: 'UX_AMBTURNO_VEH_ACTIVO', message: 'Este vehículo ya tiene un turno activo' },
  { index: 'UX_AMBTURNO_RESP_ACTIVO', message: 'Conflicto: el usuario ya tiene un turno vigente' },
  { index: 'UQ_AMBENTREGADECL_ENTREGA_ROL', message: 'Ya existe una declaración de ese rol para esta entrega' },
];

const SQL_FK_VIOLATION_MESSAGE =
  'Uno de los datos enviados no es válido o no existe. Verifique la información e intente de nuevo.';

export function handleDatabaseExceptions(error: any): HttpException {
  const sqlError = error?.driverError ?? error;

  if (sqlError.number === 2627 || sqlError.number === 2601) {
    const rawMessage = sqlError.message || '';
    const conflicto = UNIQUE_INDEX_CONFLICTS.find(c => rawMessage.includes(c.index));
    if (conflicto) return new ConflictException(conflicto.message);
    const valueMatch = rawMessage.match(/The duplicate key value is \((.*?)\)/i);
    const value = valueMatch ? valueMatch[1] : 'valor';
    return new BadRequestException(`Ya existe un registro con el valor '${value}'.`);
  }

  if (sqlError.number === 547) {
    return new BadRequestException(SQL_FK_VIOLATION_MESSAGE);
  }
  console.log('escribe', sqlError)
  return new InternalServerErrorException('No fue posible completar la operación.');
}
