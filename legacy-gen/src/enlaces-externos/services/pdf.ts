import { switchConn } from '@common/infrastructure/services';
import { query, Query1Res, Query2Res } from '../queries';
import { Injectable } from '@nestjs/common';
import { generatePdf1 } from './_1.pdf-generator';
import { groupByKey } from '@common/application/services';
import { generatePdf2 } from './_2.pdf-generator';
import { GCM_CONTEXTS, GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { orderBy } from 'lodash';

@Injectable()
export class PdfImpl {
  public async executeQ1(
    isResumen: boolean,
    contexto: GcmContextCode,
    centroId: number
  ): Promise<any> {
    try {
      const ctx = contexto ? gcmContextFactory(contexto) : GCM_CONTEXTS.ALTACENTRO;
      const conn = switchConn(ctx);
      const result: Query1Res[] = await conn.query(query(centroId));

      const groupedByTernomcom = groupByKey(result, 'TERNOMCOM');

      groupedByTernomcom.map(g => {
        g.name = g.rows.length;
      });

      const ordered = orderBy(groupedByTernomcom, 'name', 'desc');

      const url = await generatePdf1({
        contexto: ctx,
        centroId: centroId || 0,
        items: ordered,
        cantidadPacientes: result.length,
        isResumen,
      });

      return { url };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async executeQ2(
    isResumen: boolean,
    contexto: GcmContextCode,
    centroId: number
  ): Promise<any> {
    try {
      const ctx = contexto ? gcmContextFactory(contexto) : GCM_CONTEXTS.ALTACENTRO;
      const conn = switchConn(ctx);

      const result: Query2Res[] = await conn.query(query(centroId));

      const result2 = await conn.query(`SELECT
        C.OID,
        C.HCACODIGO,
        G.HGRNOMBRE,
        SG.HSUNOMBRE
        FROM HPNDEFCAM C
        INNER JOIN HPNGRUPOS G ON G.OID = C.HPNGRUPOS
        INNER JOIN HPNSUBGRU SG ON SG.OID = C.HPNSUBGRU
        WHERE C.HCAESTADO <> 6 AND HPNTIPOCA IN (1,2,3,4)
        AND LTRIM(RTRIM(UPPER(G.HGRNOMBRE))) <> 'HOSPICASA'`);

      const camasInexistentes: any[] = [];

      result2.forEach(r => {
        const exist = result.filter(rs => rs.CAMAOID === r.OID);
        if (!exist.length) camasInexistentes.push(r);
      });

      result.push(...camasInexistentes);

      const groupedByHgrnombre = groupByKey(result, 'HGRNOMBRE');

      const complemented = groupedByHgrnombre.map((r: any) => {
        r.cantidad = 0;
        r.cantidadOcupadas = 0;
        const groupedByHsunombre = groupByKey(r.rows, 'HSUNOMBRE');
        r.groups = groupedByHsunombre;

        groupedByHsunombre.forEach((gbsg: any) => {
          gbsg.cantidadOcupadas = 0;
          gbsg.rows.map((gbsgrow: Query2Res) => {
            if (gbsgrow.INGRESO) {
              r.cantidadOcupadas += 1;
              gbsg.cantidadOcupadas += 1;
            }
          });
          if (gbsg.cantidadOcupadas) r.cantidad += gbsg.rows.length;
        });

        r.groups = orderBy(r.groups, 'cantidadOcupadas', 'desc');

        return r;
      });

      const ordered2 = orderBy(complemented, 'cantidadOcupadas', 'desc');

      const url = await generatePdf2({
        contexto: ctx,
        centroId: centroId || 0,
        items: ordered2,
        cantidadPacientes: result.length,
        isResumen,
      });

      return { url };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
