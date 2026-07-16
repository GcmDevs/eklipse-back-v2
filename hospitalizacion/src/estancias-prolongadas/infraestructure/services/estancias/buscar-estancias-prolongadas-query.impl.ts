import { BaseSource } from '@common/infrastructure/services';
import { BuscarEstanciasQueryDto } from '@hpn/estancias-prolongadas/presentation/dtos';
import { Injectable } from '@nestjs/common';
import { EstanciasProlongadasOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class EstanciasProlongadasQueryImpl extends BaseSource {
  public async getEstanciasProlongadasQuery(query: BuscarEstanciasQueryDto) {
    const stayRp = this.conn.getRepository(EstanciasProlongadasOrm);
    const qb = stayRp.createQueryBuilder('estanciaProlongada');
    // .where('estanciaProlongada.deletedAt IS NULL');

    if (query.documento) {
      qb.andWhere('estanciaProlongada.document LIKE :document', {
        document: `%${query.documento.trim()}%`,
      });
    }

    if (query.auditor) {
      qb.andWhere('estanciaProlongada.auditor LIKE :auditor', {
        auditor: `%${query.auditor.trim()}%`,
      });
    }

    if (query.nivelRiesgo) {
      qb.andWhere('estanciaProlongada.riskLevel = :riskLevel', { riskLevel: query.nivelRiesgo });
    }

    if (query.cama) {
      qb.andWhere('estanciaProlongada.bed LIKE :bed', { bed: `%${query.cama.trim()}%` });
    }

    if (query.admissionDateFrom) {
      qb.andWhere('estanciaProlongada.admissionDate >= :admissionDateFrom', {
        admissionDateFrom: new Date(query.admissionDateFrom),
      });
    }

    if (query.admissionDateTo) {
      qb.andWhere('estanciaProlongada.admissionDate <= :admissionDateTo', {
        admissionDateTo: new Date(query.admissionDateTo),
      });
    }

    const data = await qb.orderBy('estanciaProlongada.createdAt', 'DESC').getMany();

    return data;
  }
}
