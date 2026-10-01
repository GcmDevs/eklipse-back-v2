import { BadRequestException, HttpException, InternalServerErrorException } from '@nestjs/common';

const SQL_FK_VIOLATION_MESSAGE =
  'Uno de los datos enviados no es válido o no existe. Verifique la información e intente de nuevo.';

export function handleDatabaseExceptions(error: any): HttpException {
  const sqlError = error?.driverError ?? error;

  if (sqlError.number === 2627 || sqlError.number === 2601) {
    const rawMessage = sqlError.message || '';
    const valueMatch = rawMessage.match(/The duplicate key value is \((.*?)\)/i);
    const value = valueMatch ? valueMatch[1] : 'valor';
    return new BadRequestException(`Ya existe un registro con el valor '${value}'.`);
  }

  if (sqlError.number === 547) {
    return new BadRequestException(SQL_FK_VIOLATION_MESSAGE);
  }

  return new InternalServerErrorException('No fue posible completar la operación.');
}
