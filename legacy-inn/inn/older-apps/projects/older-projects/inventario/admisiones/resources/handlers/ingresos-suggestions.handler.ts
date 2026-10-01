import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class IngresosSuggestionsHandler extends BaseSource {
  async byId(id: number) {
    try {
      const response = await this.conn.query(
        `
       SELECT TOP(5) U.OID id, U.AINCONSEC consecutivo, P.GPANOMCOM nombreCompletoPaciente
       FROM ADNINGRESO U INNER JOIN GENPACIEN P ON P.OID = U.GENPACIEN
       WHERE U.AINCONSEC LIKE '%${id}%'  AND U.AINFECEGRE IS NOT NULL`
      );
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async byPattern(consecutivo: number, pattern: string, incluyeEgresados: boolean) {
    try {
      const consecutivoFt = +consecutivo;

      const param = !isNaN(consecutivoFt) ? consecutivo.toString() + '%' : '%' + pattern + '%';

      const condition = !isNaN(consecutivoFt)
        ? ` WHERE u.AINCONSEC LIKE '${param}'`
        : ` WHERE p.GPANOMCOM LIKE '${param}'`;

      const sqlIncluyeEgresados = incluyeEgresados === false ? ' AND u.AINFECEGRE IS NOT NULL' : '';

      const qr = `SELECT TOP(5) u.OID id, u.AINCONSEC consecutivo, p.GPANOMCOM nombreCompletoPaciente FROM ADNINGRESO u
      inner join GENPACIEN p on p.OID = u.GENPACIEN${condition}${sqlIncluyeEgresados}`;

      const query = await this.conn.query(qr);

      return query;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
