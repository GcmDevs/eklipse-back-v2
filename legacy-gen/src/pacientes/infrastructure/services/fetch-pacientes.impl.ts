import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  PacHospiBasicoI,
  PacHospiI,
  PacHospiRes,
  PacienteHospiRes,
} from '@gen/pacientes/infrastructure/responses';

@Injectable()
export class FetchPacientesImpl extends BaseSource {
  async hospitalizados(codigoSubgrupo?: string, keyword?: string) {
    const ext1 = codigoSubgrupo ? ` AND HSUCODIGO = '${codigoSubgrupo}'` : '';
    const ext2 = keyword ? ` AND GPADOCPAC like '%${keyword}%'` : '';
    const ext = ext1 + ext2;

    const query = `SELECT TOP (5) HSUNOMBRE,
    ADNINGRESO, AINCONSEC, GPANOMPAC, GENPACIEN,
    GPADOCPAC, HCACODIGO, HCANOMBRE, HSUCODIGO
    FROM GCVHOSCENPAC WHERE  (HESFECSAL IS NULL) 
    AND (HCAESTADO < 3) AND AINURGCON <> 1${ext}`;

    const pacientes: PacHospiI[] = await this.conn.query(query);

    const res: PacHospiRes[] = pacientes.map(p => {
      const e: PacHospiRes = {
        ingreso: { id: p.ADNINGRESO, consecutivo: p.AINCONSEC },
        cama: {
          codigo: p.HCACODIGO,
          nombre: p.HCANOMBRE,
          subgrupo: { codigo: p.HSUCODIGO, nombre: p.HSUNOMBRE },
        },
        paciente: { id: p.GENPACIEN, documento: p.GPADOCPAC, nombreCompleto: p.GPANOMPAC },
      };
      return e;
    });

    return res;
  }

  async execute(keyword: string) {
    const query = `SELECT TOP (5) OID, PACNUMDOC, GPANOMCOM
    FROM GENPACIEN WHERE GPANOMCOM LIKE '%${keyword}%' OR PACNUMDOC LIKE '%${keyword}%'`;

    const pacientes: PacHospiBasicoI[] = await this.conn.query(query);

    const res: PacienteHospiRes[] = pacientes.map(p => {
      const e: PacienteHospiRes = {
        id: p.OID,
        documento: p.PACNUMDOC,
        nombreCompleto: p.GPANOMCOM,
      };
      return e;
    });

    return res;
  }
}
