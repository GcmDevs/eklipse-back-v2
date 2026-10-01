import { Injectable } from '@nestjs/common';
import { IMedicamentos } from '../interface';
import { BaseSource } from '@sln/old/common/infrastructure/bases';

@Injectable()
export class ConceptoRepository extends BaseSource {
  async getmedicamentosTipos(ingreso: string, tipo: string) {
    return await this.conn.query(
      `SELECT         
      SLNPROHOJ.OID, 
      INNPRODUC.IPRDESCOR, 
      GENCONFAC.GCFCODIGO, 
      GENCONFAC.GCFNOMBRE,
      SLNSERPRO.SERCANTID
       FROM            SLNPROHOJ AS SLNPROHOJ INNER JOIN
                               SLNSERPRO AS SLNSERPRO ON SLNSERPRO.OID = SLNPROHOJ.OID INNER JOIN
                               ADNINGRESO AS ADNINGRESO ON ADNINGRESO.OID = SLNSERPRO.ADNINGRES1 INNER JOIN
                               INNPRODUC ON SLNPROHOJ.INNPRODUC1 = INNPRODUC.OID INNER JOIN
                               GENCONFAC ON SLNPROHOJ.GENCONFAC = GENCONFAC.OID
      WHERE        (ADNINGRESO.AINCONSEC = @0)
      AND (GENCONFAC.GCFCODIGO = @1)`,
      [ingreso, tipo]
    );
  }

  async getmedicamentos(ingreso: string) {
    return await this.conn.query(
      `SELECT         
      SLNPROHOJ.OID, 
      INNPRODUC.IPRDESCOR, 
      GENCONFAC.GCFCODIGO, 
      GENCONFAC.GCFNOMBRE,
      SLNSERPRO.SERCANTID
       FROM            SLNPROHOJ AS SLNPROHOJ INNER JOIN
                               SLNSERPRO AS SLNSERPRO ON SLNSERPRO.OID = SLNPROHOJ.OID INNER JOIN
                               ADNINGRESO AS ADNINGRESO ON ADNINGRESO.OID = SLNSERPRO.ADNINGRES1 INNER JOIN
                               INNPRODUC ON SLNPROHOJ.INNPRODUC1 = INNPRODUC.OID INNER JOIN
                               GENCONFAC ON SLNPROHOJ.GENCONFAC = GENCONFAC.OID
      WHERE        (ADNINGRESO.AINCONSEC = @0)`,
      [ingreso]
    );
  }

  async updateMedicamentos(medicamentos: IMedicamentos[]) {
    try {
      await this.qr.startTransaction();
      medicamentos.forEach(async el => {
        await this.updatemedicamento(el.oid, el.tipo);
      });
      await this.qr.commitTransaction();
      return {
        success: true,
        message: 'Medicamentos actualizados correctamente',
      };
    } catch (error) {
      await this.qr.rollbackTransaction();
      return {
        success: false,
        message: 'Error al actualizar medicamentos',
      };
    }
  }

  async updatemedicamento(oid: string, tipo: number) {
    return await this.conn.query(`UPDATE SLNPROHOJ SET GENCONFAC = @1 WHERE OID = @0`, [oid, tipo]);
  }
}
