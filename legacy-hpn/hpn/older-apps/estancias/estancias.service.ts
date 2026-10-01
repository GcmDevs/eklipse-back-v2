import { Injectable } from '@nestjs/common';
import { SalidaOrm } from './entities/salidas.entity';
import { IsNull } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import { GcmContexts } from '@common/application/constants';

interface RegSal {
  GENPACIEN: number;
  AINCONSEC: number;
  TIPOSALIDA: number;
  FECHASALIDA: Date;
}
@Injectable()
export class EstanciasService extends BaseSource {
  async dialWayOut(patient: number, consecutive: number, checkOutType: number) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const obs = await this.qr.query(
        `select * from GCMHPNREGSALIDA where GENPACIEN = @0 AND AINCONSEC = @1 AND DESCONFIRMADAPOR IS NULL`,
        [patient, consecutive]
      );

      if (!obs[0]) {
        const newObs = new SalidaOrm();
        newObs.patient = patient;
        newObs.consecutive = consecutive;
        newObs.checkOutType = checkOutType;
        newObs.createdAt = new Date();
        newObs.userId = this.auth.user.id;

        const result = await this.qr.manager.save(SalidaOrm, newObs);
        await this.qr.commitTransaction();
        return { stored: true, result };
      } else {
        return { stored: false, result: obs };
      }
    } catch (error) {
      await this.qr.rollbackTransaction();
      return false;
    } finally {
      await this.qr.release();
    }
  }

  async disconfirmWayOut(patient: number, consecutive: number) {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const repo = this.qr.manager.getRepository(SalidaOrm);

      const salida = await repo.findOneOrFail({
        where: { patient, consecutive, disconfirmedBy: IsNull() },
      });
      salida.disconfirmedBy = this.auth.user.id;

      const item: any = salida.createdAt;

      if (Math.floor((((new Date() as any) - item) as any) / (1000 * 60 * 60)) <= 24) {
        await repo.save(salida);
      } else {
        return false;
      }
      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      return false;
    } finally {
      await this.qr.release();
    }
  }

  async gastosTotalesPorIngreso(ingreso: number) {
    const gastosPorIngreso: any[] = await this.conn.query(
      `
      SELECT ISNULL(SUM(SP.SERVALPRO * SP.SERCANTID),0) AS SUMA
      FROM SLNSERPRO SP INNER JOIN SLNORDSER O ON SP.SLNORDSER1 = O.OID
      WHERE SP.ADNINGRES1 = @0 AND O.SOSESTADO != 2
      `,
      [ingreso]
    );
    return gastosPorIngreso[0].SUMA;
  }

  async traer_paciente_acostados(codigoSubgrupo?: string, keyword?: string) {
    const ext1 = codigoSubgrupo ? ` AND HSUCODIGO = '${codigoSubgrupo}'` : '';
    const ext2 = keyword ? ` AND GPADOCPAC like '%${keyword}%'` : '';
    const ext = ext1 + ext2;

    const query = `SELECT ${keyword ? 'TOP (5)' : ''} HPNESTANC, ADNINGRESO, AINCONSEC, AINFECING, 
    CASE AINURGCON
    WHEN -1 THEN 'NINGUNO'
    WHEN 0 THEN 'URGENCIAS'
    WHEN 1 THEN 'CONSULTA EXTERNA'
    WHEN 2 THEN 'NACIDO EN LA IPS'
    WHEN 3 THEN 'REMITIDO'
    WHEN 4 THEN 'HOSPITALIZACION DE URGENCIAS'
    WHEN 5 THEN 'HOSPITALIZACION'
    WHEN 6 THEN 'IMAGENES'
    WHEN 7 THEN 'LABORATORIO'
    WHEN 8 THEN 'URGENCIA GINECOLOGIA'
    WHEN 9 THEN 'QUIROFANO'
    WHEN 10 THEN 'CIRUGIA AMBULATORIA'
    WHEN 11 THEN 'CIRUGIA PROGRAMADA'
    WHEN 12 THEN 'UCI NEONATAL'
    WHEN 13 THEN 'UCI ADULTO'
    END AS AINURGCON, 
    CASE AINCAUING
    WHEN 0 THEN 'NINGUNA'
    WHEN 1 THEN 'ENFERMEDAD PROFESIONAL'
    WHEN 2 THEN 'HERIDOS EN COMBATE'
    WHEN 3 THEN 'ENFERMEDAD GENERAL DE ADULTO'
    WHEN 4 THEN 'ENFERMEDAD GENERAL DE PEDIATRIA'
    WHEN 5 THEN 'ODONTOLOGIA'
    WHEN 6 THEN 'ACCIDENTE DE TRANSITO'
    WHEN 7 THEN 'CATASTROFE DE FISALUD'
    WHEN 8 THEN 'QUEMADOS'
    WHEN 9 THEN 'MATERNIDAD'
    WHEN 10 THEN 'ACCIDENTE LABORAL'
    WHEN 11 THEN 'CIRUGIA PROGRAMADA'
    END AS AINCAUING,
    GENPRESAL, PRECODIGO, PRENOMBRE, HESFECSAL, AINDIAEST, HPNDEFCAM, HCACODIGO,
    HCANOMBRE, HCAESTADO, HGRCODIGO, HGRNOMBRE, HSUCODIGO, HSUNOMBRE,
    GENARESER, GASCODIGO, GASNOMBRE, GENPACIEN, GPADOCPAC, GPANOMPAC, GPAEDAPAC, 
    CASE GPASEXPAC
    WHEN 1 THEN 'MASCULINO' WHEN 2 THEN 'FEMENINO'
    END AS GPASEXPAC, 
    GPAESTPAC, 
    CASE GPATIPAFI
    WHEN 0 THEN 'NINGUNO' WHEN 1 THEN 'COTIZANTE'
    WHEN 2 THEN 'BENEFICIARIO' WHEN 3 THEN 'ADICIONAL'
    WHEN 4 THEN 'JUBILADO RETIRADO' WHEN 5 THEN 'PENSIONADO'
    END AS GPATIPAFI, GPADIRECC, GPATELEFO,
    GPAMUNPAC, AINACONOM, AINACOTEL, AINACUNOM, AINACUTEL, AINACUPAR, GENDIAGNO, 
    DIACODIGO, DIANOMBRE, GENDETCON, GDECODIGO, GDENOMBRE, ADNCENATE, ACACODIGO, 
    ACANOMBRE
    FROM     GCVHOSCENPAC
    WHERE  (HESFECSAL IS NULL) 
    AND (HCAESTADO < 3) 
    AND AINURGCON <> 1${ext}`;

    const pacientes: any[] = await this.conn.query(query);

    const gastos: any[] = await this.conn.query(`
    SELECT  P.ADNINGRESO, SUM(SP.SERVALPRO * SP.SERCANTID) AS SUMA FROM GCVHOSCENPAC P
	  INNER JOIN SLNSERPRO SP ON P.ADNINGRESO = SP.ADNINGRES1
	  INNER JOIN SLNORDSER O ON SP.SLNORDSER1= O.OID
      WHERE  (HESFECSAL IS NULL) 
             AND (HCAESTADO < 3) 
			 AND O.SOSESTADO != 2
             AND AINURGCON <> 1${ext} GROUP BY P.ADNINGRESO`);

    let salidas: RegSal[] = [];

    if (this.auth.context.getCode() === GcmContexts.ALTACENTRO) {
      salidas = await this.conn
        .query(`SELECT P.GENPACIEN, P.AINCONSEC, TIPOSALIDA, FECHREGISTRO FECHASALIDA FROM GCMHPNREGSALIDA S
    INNER JOIN GCVHOSCENPAC P ON P.AINCONSEC = S.AINCONSEC
    WHERE S.DESCONFIRMADAPOR IS NULL  AND (P.HESFECSAL IS NULL) AND (P.HCAESTADO < 3) AND P.AINURGCON <> 1${
      codigoSubgrupo ? ` AND HSUCODIGO = '${codigoSubgrupo}'` : ''
    }`);
    }

    pacientes.map((p: any) => {
      const gasto = gastos.filter((r: any) => r.ADNINGRESO === p.ADNINGRESO);
      const salida = salidas.filter(
        (r: RegSal) => r.GENPACIEN === p.GENPACIEN && r.AINCONSEC === p.AINCONSEC
      );

      if (gasto.length > 0) p.totalConsumo = gasto[0].SUMA;
      else p.totalConsumo = 0;

      if (salida.length > 0) {
        p.TIPOSALIDA = salida[0].TIPOSALIDA;
        p.FECHASALIDA = salida[0].FECHASALIDA;
      } else {
        p.TIPOSALIDA = 0;
        p.FECHASALIDA = null;
      }
    });

    const PEstancias = await Promise.all(
      pacientes.map(async p => {
        const estancia = await this.estancias_paciente(p.GPADOCPAC);

        let i = 0;
        let suma = 0;
        let camas = [];

        while (i < estancia.length) {
          const actual = estancia[i];
          const anterior = estancia[i + 1] ? estancia[i + 1] : null;
          if (anterior) {
            const diferencia = (actual.AINFECING - anterior.AINFECEGRE) / (1000 * 60 * 60 * 24);
            if (diferencia <= 2.99) {
              suma = actual.DIAS + anterior.DIAS;
              const cama = await this.get_camas(actual.AINCONSEC);
              camas = await this.get_camas(anterior.AINCONSEC);
              camas = camas.concat(cama);
              break;
            } else {
              if (i + 1 == estancia.length - 1) {
                camas = await this.get_camas(estancia[0].AINCONSEC);
                suma += estancia[0].DIAS;
              } else {
                camas = await this.get_camas(actual.AINCONSEC);
                suma += actual.DIAS;
              }
              break;
            }
          } else if (i == 0 && !anterior) {
            camas = await this.get_camas(estancia[0].AINCONSEC);
            suma += estancia[0].DIAS;
          }
          i++;
        }
        return {
          AINCONSEC: p.AINCONSEC,
          ADNINGRESO: p.ADNINGRESO,
          GPADOCPAC: p.GPADOCPAC,
          ESTANCIA: suma,
          CAMAS: camas,
          GDECODIGO: p.GDECODIGO,
          GDENOMBRE: p.GDENOMBRE,
          ...p,
        };
      })
    );

    return PEstancias;
  }

  async estancias_paciente(paciente: string) {
    const estancias = await this.conn.query(
      `SELECT
      AINCONSEC,
      P.PACNUMDOC,
      I.AINFECING,
      ISNULL(I.AINFECEGRE, GETDATE()) AINFECEGRE,
      (DateDiff(DAY, I.AINFECING, ISNULL(I.AINFECEGRE, GETDATE()))) DIAS
      from ADNINGRESO I
      INNER JOIN GENPACIEN P ON I.GENPACIEN = P.OID
      INNER JOIN GENDETCON C ON C.OID = I.GENDETCON
      WHERE 
      P.PACNUMDOC = @0
      AND AINESTADO != 2 
      AND I.AINESTADO IN(0,1) 
      AND GDENOMBRE NOT LIKE '%NO POS%' 
      AND I.AINURGCON <> 1
      AND (DateDiff(HOUR, I.AINFECING, I.AINFECEGRE) > 6 OR I.AINFECFAC IS NULL)
      ORDER BY I.AINFECING DESC
      `,
      [paciente]
    );
    return estancias;
  }

  async get_camas(consecutivo: string) {
    return await this.conn.query(
      `SELECT
      H.OID id,
      A.AINCONSEC Ingreso,
      H.ADNINGRES,
      H.HESFECING FechaIngreso,
      H.HESFECSAL FechaSalida,
      HCANOMBRE Grupo,
      HD.HCACODIGO Cama,
    DATEDIFF(DAY, H.HESFECING, ISNULL(H.HESFECSAL, GETDATE())) DIAS
      FROM HPNESTANC H
      INNER JOIN ADNINGRESO A ON A.OID = H.ADNINGRES
      INNER JOIN HPNDEFCAM HD ON HD.OID = H.HPNDEFCAM
      WHERE A.AINCONSEC = @0
      AND A.AINESTADO IN(0,1)
      AND (DateDiff(HOUR, A.AINFECING, A.AINFECEGRE) > 6 OR A.AINFECFAC IS NULL);
      `,
      [consecutivo]
    );
  }
}
