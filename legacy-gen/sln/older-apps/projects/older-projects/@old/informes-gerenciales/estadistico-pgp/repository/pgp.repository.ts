import { Injectable } from '@nestjs/common';
import { BaseSource } from '@sln/old/common/infrastructure/bases';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class PgpRepository extends BaseSource {
  async agrupadores() {
    if (this.auth.context === GcmContexts.ALTACENTRO) {
      const agrupadores = [];

      try {
        for (let i = 0; i < agrupadores.length; i++) {
          await this.conn.query(
            `INSERT INTO GCMAGRUPGP2
            SELECT
             RTrim(LTrim(GENSERIPS.SIPCODIGO)) As COD_SERIPS,
             RTrim(LTrim(GENSERIPS.SIPCODCUP)) As COD_CUPS,
             RTrim(LTrim(Replace(Replace(GENSERIPS.SIPNOMBRE, Char(10), ''), Char(13),
             ''))) As NOM_SERVIPS,
             GENARESER.GASCODIGO CODAREA,
            'REVISION DE REEMPLAZOS ARTICULARES' AS AGRUPADOR,
            13 ORDEN,
            '8021' CONTRATO,
            '2022-09-01' FECHA_CONTRATO
              FROM GENSERIPS
              Inner Join GENGRUPOS On GENGRUPOS.OID = GENSERIPS.GENGRUPOS1
              Inner Join GENSUBGRU On GENSUBGRU.OID = GENSERIPS.GENSUBGRU1
              Inner Join GENARESER On GENARESER.OID = GENSERIPS.GENARESER1
              WHERE RTrim(LTrim(GENSERIPS.SIPCODIGO)) = @0;`,
            [agrupadores[i]]
          );
        }
      } catch (error) {}
    } else {
    }
  }
}
