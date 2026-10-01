import { GcmContexts } from '@common/application/constants';
import { BaseSource } from '@common/infrastructure/services';
interface RegSal {
  GENPACIEN: number;
  AINCONSEC: number;
  TIPOSALIDA: number;
  FECHASALIDA: Date;
}
export class EstanciasSourceRepository extends BaseSource {
  public async estanciasPaciente(consecutivo: number): Promise<any[]> {
    const query = `SELECT HPNESTANC, ADNINGRESO, AINCONSEC, AINFECING,      
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
      WHERE  AINCONSEC =  ${consecutivo} 
      AND (HCAESTADO < 3) 
      AND AINURGCON <> 1`;

    const pacientes: any[] = await this.conn.query(query);

    const gastos: any[] = await this.conn.query(`
      SELECT  P.ADNINGRESO, SUM(SP.SERVALPRO * SP.SERCANTID) AS SUMA FROM GCVHOSCENPAC P
      INNER JOIN SLNSERPRO SP ON P.ADNINGRESO = SP.ADNINGRES1
      INNER JOIN SLNORDSER O ON SP.SLNORDSER1= O.OID
        WHERE  (HESFECSAL IS NULL) 
               AND (HCAESTADO < 3) 
         AND O.SOSESTADO != 2
               AND AINURGCON <> 1 GROUP BY P.ADNINGRESO`);

    let salidas: RegSal[] = [];

    if (this.auth.context.getCode() === GcmContexts.ALTACENTRO) {
      salidas = await this.conn
        .query(`SELECT P.GENPACIEN, P.AINCONSEC, TIPOSALIDA, FECHREGISTRO FECHASALIDA FROM GCMHPNREGSALIDA S
      INNER JOIN GCVHOSCENPAC P ON P.AINCONSEC = S.AINCONSEC
      WHERE S.DESCONFIRMADAPOR IS NULL  AND (P.HESFECSAL IS NULL) AND (P.HCAESTADO < 3) AND P.AINURGCON <> 1${
        pacientes[0].HSUCODIGO ? ` AND HSUCODIGO = '${pacientes[0].HSUCODIGO}'` : ''
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
