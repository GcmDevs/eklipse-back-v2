import { Injectable } from '@nestjs/common';
import { GcmContexts } from '@hcn/old/common/application/constants';
import { DataSource } from 'typeorm';

@Injectable()
export class UciSheetsExternoRepository {
  async infoIngreso(adnIngreso: string, fecha: Date, conn: DataSource) {
    return await conn.query(
      `Select TOP 1 ADNINGRESO.AINCONSEC CONS_INGRESO,
    ADNINGRESO.OID OID,
    HPNDEFCAM.HCACODIGO CAMA,
    HPNGRUPOS.HGRNOMBRE GRUPO_CAMA,
    GENPACIEN.PACNUMDOC,
    GENPACIEN.GPANOMCOM,
    HCNREGENF.HCFECREG FECHA_REGISTRO_ENF,
    GENDETCON.GDENOMBRE,
    HCNREGENF.HCRPESO PESO
  From ADNINGRESO
    Left Join HPNDEFCAM On HPNDEFCAM.OID = ADNINGRESO.HPNDEFCAM
    Left Join HPNSUBGRU On HPNSUBGRU.OID = HPNDEFCAM.HPNSUBGRU
    Left Join GENARESER On GENARESER.OID = HPNSUBGRU.GENARESER
    Left Join HPNGRUPOS On HPNGRUPOS.OID = HPNDEFCAM.HPNGRUPOS
    Left Join GENPACIEN On GENPACIEN.OID = ADNINGRESO.GENPACIEN
    Left Join HCNREGENF On ADNINGRESO.OID = HCNREGENF.ADNINGRESO
    Left Join GENDETCON On GENDETCON.OID = ADNINGRESO.GENDETCON
  Where ADNINGRESO.AINCONSEC = @0 And HCNREGENF.HCFECREG = @1
  ORDER BY PESO DESC;`,
      [adnIngreso, fecha.toISOString().split('T')[0]]
    );
  }

  async liquidos(adnIngreso: string, fecha: Date, conn: DataSource) {
    const liq = await conn.query(
      `SELECT HCNTIPLQEL.HCLNOMBRE LIQUIDO,
        DatePart(HOUR, HCNLIQELM.HCRHORREG) hora,
        HCNLIQELM.HCLCANTID CANTIDAD,
        'LIQUIDOS ELIMINADOS' SUBGRUPO FROM HCNREGENF
        Inner Join HCNLIQELM ON HCNREGENF.OID = HCNLIQELM.HCNREGENF
        Inner Join ADNINGRESO ON ADNINGRESO.OID = HCNREGENF.ADNINGRESO
        Inner Join HCNTIPLQEL ON HCNTIPLQEL.OID = HCNLIQELM.HCNTIPLQEL
        WHERE HCNREGENF.HCFECREG=@1 AND ADNINGRESO.AINCONSEC=@0
        UNION
        SELECT HCNLIQADM.HCLLIQNOM LIQUIDO,
        DatePart(HOUR, HCNLIQADM.HCRHORREG) hora,
        HCNLIQADM.HCLCANTID CANTIDAD,
        'LIQUIDOS ADMINISTRADOS' SUBGRUPO FROM HCNREGENF
        Inner Join HCNLIQADM ON HCNREGENF.OID = HCNLIQADM.HCNREGENF
        Inner Join ADNINGRESO ON ADNINGRESO.OID = HCNREGENF.ADNINGRESO
        WHERE HCNREGENF.HCFECREG=@1 AND ADNINGRESO.AINCONSEC=@0 ORDER BY SUBGRUPO ASC;`,
      [adnIngreso, fecha.toISOString().split('T')[0]]
    );
    return liq;
  }

  async glucometria(adnIngreso: string, fecha: Date, conn: DataSource) {
    return await conn.query(
      `Select HORAS_DIA.hora,
          CONSOLIDADO.RESULTADO,
          CONSOLIDADO.OBSERVACION,
        CASE CONSOLIDADO.INSULINA
        WHEN -1 THEN 'NINGUNA'
        WHEN 0 THEN 'CRISTALINA'
        WHEN 1 THEN 'NPH'
        WHEN 2 THEN '70 30'
        WHEN 3 THEN 'GLARGINA'
        WHEN 4 THEN 'OTROS'
        WHEN 5 THEN 'LISPRO'
        WHEN 6 THEN 'GLULISINA'
        WHEN 7 THEN 'ASPART'
        WHEN 8 THEN 'DETEMIRT'
        END
        AS INSULINA,
        CONSOLIDADO.CANTIDAD,
          'GLUCOMETRIAS' As GLUCOMETRIA
          From HORAS_DIA
          Left Join (
        Select DatePart(HOUR, HCNGLUCOM.HCRHORREG) HORAREG,
            HCNGLUCOM.HCGRESGLU RESULTADO,
            HCNGLUCOM.HCGOBSERV OBSERVACION,
        HCNGLUCOM.HCGINSUTIP INSULINA,
        HCNGLUCOM.HCGINSUNI CANTIDAD
          From HCNREGENF
            Inner Join HCNGLUCOM On HCNREGENF.OID = HCNGLUCOM.HCNREGENF
            Inner Join ADNINGRESO On ADNINGRESO.OID = HCNREGENF.ADNINGRESO
            Left Join HPNDEFCAM On HPNDEFCAM.OID = ADNINGRESO.HPNDEFCAM
            Left Join HPNSUBGRU On HPNSUBGRU.OID = HPNDEFCAM.HPNSUBGRU
            Left Join GENARESER On GENARESER.OID = HPNSUBGRU.GENARESER
            Left Join HPNGRUPOS On HPNGRUPOS.OID = HPNDEFCAM.HPNGRUPOS
          Where CONVERT(DATE, HCNREGENF.HCFECREG, 103) = @1 And (1 = 1) And ADNINGRESO.AINCONSEC = @0
        )As CONSOLIDADO On CONSOLIDADO.HORAREG = HORAS_DIA.hora`,
      [adnIngreso, fecha.toISOString().split('T')[0]]
    );
  }

  async signosVitales(adnIngreso: string, fecha: Date, conn: DataSource) {
    const result = await conn.query(
      `Select HORAS_DIA.hora,
      HORAS_DIA.oid,
      CONSOLIDADO.HORAREG,
      CONSOLIDADO.SIGNO,
      CONSOLIDADO.VALOR,
      IsNull(CONSOLIDADO.CATEGORIA, 'SIN REGISTRO') As CATEGORIA,
      IsNull(CONSOLIDADO.SUBGRUPO, 'VACIO') As SUBGRUPO,
      CONSOLIDADO.FECHA_REGISTRO_ENF
      From HORAS_DIA
      Left Join (Select DatePart(HOUR, HCNSIGVIT.HCRHORREG) HORAREG,
        HCNTIPSVIT.HCSDESCRI SIGNO,
        HCNSIGVIT.HCSVALOR VALOR,
        0 As PESO,
        'LIQUIDOS' CATEGORIA,
        'LIQUIDOS ADMINISTRADOS' SUBGRUPO,
        HCNREGENF.HCFECREG FECHA_REGISTRO_ENF
      From HCNREGENF
        Inner Join HCNSIGVIT On HCNREGENF.OID = HCNSIGVIT.HCNREGENF
        Inner Join HCNTIPSVIT On HCNTIPSVIT.OID = HCNSIGVIT.HCNTIPSVIT
        Inner Join ADNINGRESO On ADNINGRESO.OID = HCNREGENF.ADNINGRESO
      Where HCNREGENF.HCFECREG = @1 And ADNINGRESO.AINCONSEC =
        @0) As CONSOLIDADO On CONSOLIDADO.HORAREG = HORAS_DIA.hora 
        Where CONSOLIDADO.HORAREG Is Not Null order by oid`,
      [adnIngreso, fecha.toISOString().split('T')[0]]
    );

    return result;
  }

  async getHpnestancia(adnIngreso: string, conn: DataSource) {
    return await conn.query(
      `
    SELECT H.OID,
    H.HESFECING,
    H.HESFECSAL,
    HESTIPOES,
    I.AINCONSEC,
    I.GENPACIEN,
    H.HPNDEFCAM,
    C.HCACODIGO,
    C.HCANOMBRE
    FROM HPNESTANC H 
    INNER JOIN ADNINGRESO I ON H.ADNINGRES = I.OID
    INNER JOIN HPNDEFCAM C ON H.HPNDEFCAM = C.OID
    WHERE I.AINCONSEC=@0;`,
      [adnIngreso]
    );
  }

  async pacientesSinPeso(conn: DataSource) {
    return await conn.query(`
    SELECT T.* FROM ADNINGRESO A
    RIGHT JOIN(
    SELECT TOP 1 WITH TIES AINCONSEC, GPADOCPAC,GPANOMPAC, 
	  HSUCODIGO, HSUNOMBRE,
	  HCACODIGO, HCANOMBRE,
	  ACANOMBRE, H.HCRPESO,
	  H.HCFECREG, H.OID
      FROM GCVHOSCENPAC	G
	  INNER JOIN HCNREGENF H ON H.ADNINGRESO = G.ADNINGRESO
      WHERE  (HESFECSAL IS NULL) AND (HCAESTADO < 3)
      AND (HCACODIGO LIKE '%UCI%' OR HCACODIGO LIKE '%ACUQUE%' OR HCACODIGO LIKE '%ACUPOL%')
	  AND H.HCFECREG = CONVERT(DATE, GETDATE(), 103)
	  GROUP BY AINCONSEC, HSUCODIGO,
	  HSUNOMBRE, GPANOMPAC,
	  HCACODIGO, HCANOMBRE,
	  GPADOCPAC, ACANOMBRE,
	  H.HCFECREG, H.HCRPESO,
	  H.HCFECREG, H.OID
	  ORDER BY ROW_NUMBER() OVER(PARTITION BY G.AINCONSEC ORDER BY H.OID)
	  ) T ON T.AINCONSEC = A.AINCONSEC
	  WHERE T.HCRPESO = 0
	 `);
  }

  /*
  !Calculo de Balance de Liquidos
  */

  //!Liquidos Administrados
  async liquidosAdministrados(fecha: Date, ingreso: string, conn: DataSource) {
    const fech = fecha.toISOString().split('T')[0];
    return await conn.query(
      `
    Select 
    ISNULL(SUM(HCNLIQADM.HCLCANTID), 0) TOTAL
    From HCNREGENF
    Inner Join HCNLIQADM On HCNREGENF.OID = HCNLIQADM.HCNREGENF
    Inner Join ADNINGRESO On ADNINGRESO.OID = HCNREGENF.ADNINGRESO
    Where CONVERT(DATE, HCNREGENF.HCFECREG, 103) = @0 And ADNINGRESO.AINCONSEC = @1
    `,
      [fech, ingreso]
    );
  }

  //!Diuresis
  async diuresis(fecha: Date, ingreso: string, conn: DataSource) {
    const fech = fecha.toISOString().split('T')[0];
    return await conn.query(
      `
    Select
    ISNULL(SUM(HCNLIQELM.HCLCANTID), 0) TOTAL
    From HCNREGENF
    Inner Join HCNLIQELM On HCNREGENF.OID = HCNLIQELM.HCNREGENF
    Inner Join ADNINGRESO On ADNINGRESO.OID = HCNREGENF.ADNINGRESO
    Inner Join HCNTIPLQEL On HCNTIPLQEL.OID = HCNLIQELM.HCNTIPLQEL
    Where CONVERT(DATE, HCNREGENF.HCFECREG, 103) = @0 And ADNINGRESO.AINCONSEC = @1 AND HCNTIPLQEL.HCLNOMBRE = 'ORINA' 
    `,
      [fech, ingreso]
    );
  }

  async liquidosEliminados(fecha: Date, ingreso: string, conn: DataSource) {
    const fech = fecha.toISOString().split('T')[0];
    return await conn.query(
      `
    Select
    ISNULL(SUM(HCNLIQELM.HCLCANTID), 0) TOTAL
    From HCNREGENF
    Inner Join HCNLIQELM On HCNREGENF.OID = HCNLIQELM.HCNREGENF
    Inner Join ADNINGRESO On ADNINGRESO.OID = HCNREGENF.ADNINGRESO
    Inner Join HCNTIPLQEL On HCNTIPLQEL.OID = HCNLIQELM.HCNTIPLQEL
    Where CONVERT(DATE, HCNREGENF.HCFECREG, 103) = @0 And ADNINGRESO.AINCONSEC = @1 AND HCNTIPLQEL.HCLNOMBRE != 'ORINA' 
    `,
      [fech, ingreso]
    );
  }

  //!Perdidas Insensibles
  async perdidasInsensibles(fecha: Date, ingreso: string, conn: DataSource, context: GcmContexts) {
    const fech = fecha.toISOString().split('T')[0];
    if (context === GcmContexts.SANJUAN || context === GcmContexts.AGUACHICA) {
      const res = [{ PERDIDA: 0 }];
      return res;
    } else {
      const res = await conn.query(
        `SELECT TOP 1
        IIF(
                  (DATEPART(YY, GETDATE()) = DATEPART(YY, TEMP.HCRHORREG)
                  AND DATEPART(MM, GETDATE()) = DATEPART(MM, TEMP.HCRHORREG)
                  AND DATEPART(DD, GETDATE()) = DATEPART(DD, TEMP.HCRHORREG)),
                  --ES EL MISMO DIA    ((DATEPART(HOUR, GETDATE())) - 7)
                  IIF(HC.HCCM09N61 = 'SI', --¿ UCI ?
                      IIF(HC.HCCM09N62 = 'SI', -- ¿ ESTA VENTILADO ?
                          IIF(HC.HCCM09N63 = 'SI', -- ¿ ESTA QUEMADO ?
                              IIF(TEMP.HCSVALOR > 38.4,
                              ((0.20*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)*2+(0.25*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)+(0.5*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)), --VALOR VENTILADO Y QUEMADO Y FIEBRE
                              ((0.20*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)+(0.25*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)+(0.5*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO))), -- VALOR VENTILADO Y QUEMADO
                          ((0.25*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO))+(0.5*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)), --SOLO VENTILADO
                      IIF(HC.HCCM09N63 = 'SI',
                          ((0.20*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)+(0.5*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO)), --SOLO QUEMADO
                          (0.5*((DATEPART(HOUR, GETDATE())) - 7)*TEMP.HCRPESO))), -- NORMAL
                    0
                  ), 
                  --NO ES EL MISMO DIA
                  IIF(HC.HCCM09N61 = 'SI', --¿ UCI ?
                      IIF(HC.HCCM09N62 = 'SI', -- ¿ ESTA VENTILADO ?
                          IIF(HC.HCCM09N63 = 'SI', -- ¿ ESTA QUEMADO ?
                              ((0.20*24*TEMP.HCRPESO)+(0.25*24*TEMP.HCRPESO)+(0.5*24*TEMP.HCRPESO)), -- VALOR VENTILADO Y QUEMADO
                          (0.25*24*TEMP.HCRPESO)+(0.5*24*TEMP.HCRPESO)), --SOLO VENTILADO
                      IIF(HC.HCCM09N63 = 'SI',
                          (0.20*24*TEMP.HCRPESO)+(0.5*24*TEMP.HCRPESO), --SOLO QUEMADO
                          (0.5*24*TEMP.HCRPESO))), -- NORMAL
                    0.5*24*TEMP.HCRPESO
                  )
                  ) 
              AS TOTAL,
                  HC.HCCM09N61 UCI,
                  HC.HCCM09N62 VENTILADO,
                  HCCM09N63 QUEMADO,
                  TEMP.HCRPESO,
                  TEMP.HCSVALOR TEMPERATURA,
                  I.AINCONSEC,
                  TEMP.HCRHORREG
                  FROM HCMEVOHOS HC
                  INNER JOIN HCNFOLIO HF ON HF.OID = HC.HCNFOLIO
                  INNER JOIN ADNINGRESO I ON I.OID = HF.ADNINGRESO
                  INNER JOIN (
                    SELECT TOP 1 HD.hora, H.OID, H.ADNINGRESO, A.AINCONSEC,
                    H.HCFECREG, H.HCRPESO, HC.HCRHORREG, HC.HCSVALOR,
                    HCN.HCSNOMBRE
                    FROM HCNREGENF H
                    Inner Join HCNSIGVIT HC On H.OID = HC.HCNREGENF
                    Inner Join HCNTIPSVIT HCN On HCN.OID = HC.HCNTIPSVIT
                    Inner Join ADNINGRESO A On A.OID = H.ADNINGRESO
                    INNER JOIN HORAS_DIA HD ON HD.hora = DATEPART(HOUR, HC.HCRHORREG)
                    WHERE A.AINCONSEC = @0
                    AND CONVERT(DATE, H.HCFECREG, 103) = @1
                    AND HCN.HCSNOMBRE = 'TEMPERATURA') AS TEMP ON TEMP.AINCONSEC = I.AINCONSEC
              WHERE I.AINCONSEC = @0
              AND convert(date, HF.HCFECFOL, 103) =@1
              AND HC.HCCM09N61 = 'SI'
              ORDER BY HC.OID DESC;`,
        [ingreso, fech]
      );
      if (res.length > 0 || !res) {
        return res;
      } else {
        return [{ TOTAL: 0 }];
      }
    }
  }

  //!Total Perdidas Eliminadas
  async totalLiquidosEliminados(
    fecha: Date,
    ingreso: string,
    conn: DataSource,
    context: GcmContexts
  ) {
    const liquidosEliminados = await this.liquidosEliminados(fecha, ingreso, conn);
    const perdidaInsensible = await this.perdidasInsensibles(fecha, ingreso, conn, context);

    const totalPerdidasEliminadas = liquidosEliminados[0].TOTAL + perdidaInsensible[0].TOTAL;
    return totalPerdidasEliminadas;
  }

  //!Balance 24H
  async balance24Horas(fecha: Date, ingreso: string, conn: DataSource, context: GcmContexts) {
    const totalPerdidasEliminadas = await this.totalLiquidosEliminados(
      fecha,
      ingreso,
      conn,
      context
    );
    const liquidosAdministrador = await this.liquidosAdministrados(fecha, ingreso, conn);
    const balance24Horas = liquidosAdministrador[0].TOTAL - totalPerdidasEliminadas;
    return balance24Horas;
  }

  //!Gasto urinario
  async gastoUrinarios(fecha: Date, ingreso: string, conn: DataSource) {
    const fech = fecha.toISOString().split('T')[0];
    const res = await conn.query(
      `Select 
      ISNULL(
      IIF(CONVERT(DATE, CONSOLIDADO.FECHA_REGISTRO, 103)=CONVERT(DATE, GETDATE(), 103),
	  SUM(ISNULL(CONSOLIDADO.CANTIDAD, 0) / DATEPART(HOUR, GETDATE())-HORAS_DIA.hora / NULLIF(CONSOLIDADO.PESO, 0)),
	  SUM(ISNULL(CONSOLIDADO.CANTIDAD, 24) / 24.0 / NULLIF(CONSOLIDADO.PESO, 0))), 0)
      AS TOTAL 
     From HORAS_DIA -- TABLA CON LAS HORAS DEL DÍA
       Left Join (
	   Select
	   ADNINGRESO.OID,
	   DatePart(HOUR, HCNLIQELM.HCRHORREG) HORAREG,
         HCNTIPLQEL.HCLNOMBRE LIQUIDO,
         HCNLIQELM.HCLCANTID CANTIDAD,
         HCNLIQELM.HCLPESO,
         HCNREGENF.HCRPESO PESO,
	       HCNREGENF.HCFECREG FECHA_REGISTRO
       From HCNREGENF
         Inner Join HCNLIQELM On HCNREGENF.OID = HCNLIQELM.HCNREGENF
         left Join ADNINGRESO On ADNINGRESO.OID = HCNREGENF.ADNINGRESO
         Inner Join HCNTIPLQEL On HCNTIPLQEL.OID = HCNLIQELM.HCNTIPLQEL
       WHERE 
       CONVERT(DATE, HCNREGENF.HCFECREG, 103) = @1
	   AND ADNINGRESO.AINCONSEC = @0
       AND HCNTIPLQEL.HCLNOMBRE = 'ORINA' 
	   ) As CONSOLIDADO On CONSOLIDADO.HORAREG = HORAS_DIA.hora 
       WHERE HORAREG IS NOT NULL
	   GROUP BY CONSOLIDADO.FECHA_REGISTRO;`,
      [ingreso, fech]
    );
    if (res.length > 0) return res;
    return [{ TOTAL: 0 }];
  }

  //!Balance Acumulado
  async balanceAcumulados(fecha: Date, ingreso: string, conn: DataSource, context: GcmContexts) {
    const mili = 24 * 60 * 60 * 1000;
    const actual = new Date(fecha.getTime());
    const anterior = new Date(fecha.getTime() - mili);
    const balanceActual = await this.balance24Horas(actual, ingreso, conn, context);
    const balanceAnterior = await this.balance24Horas(anterior, ingreso, conn, context);
    const balanceAcumulado = balanceActual - balanceAnterior;
    return balanceAcumulado;
  }

  //*Balance de Liquidos
  async balancesLiquidos(fecha: Date, ingreso: string, conn: DataSource, context: GcmContexts) {
    const balanceAcumulado = await this.balanceAcumulados(fecha, ingreso, conn, context);
    const gastoUrinario = await this.gastoUrinarios(fecha, ingreso, conn);
    const liquidosAdministrados = await this.liquidosAdministrados(fecha, ingreso, conn);
    const liquidosEliminados = await this.liquidosEliminados(fecha, ingreso, conn);
    const totalLiquidosEliminados = await this.totalLiquidosEliminados(
      fecha,
      ingreso,
      conn,
      context
    );
    const perdidaInsensible = await this.perdidasInsensibles(fecha, ingreso, conn, context);
    const balance24Horas = await this.balance24Horas(fecha, ingreso, conn, context);
    const diuresis = await this.diuresis(fecha, ingreso, conn);

    const data = {
      liquidosAdministrados: liquidosAdministrados[0].TOTAL,
      liquidosEliminados: liquidosEliminados[0].TOTAL,
      totalLiquidosEliminados: totalLiquidosEliminados + diuresis[0].TOTAL,
      gastoUrinario: gastoUrinario[0].TOTAL,
      balanceAcumulado,
      perdidaInsensible: perdidaInsensible[0].TOTAL,
      balance24Horas,
      diuresis: diuresis[0].TOTAL,
    };
    return data;
  }
}
