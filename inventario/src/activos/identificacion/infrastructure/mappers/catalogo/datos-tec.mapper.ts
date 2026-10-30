import { DatosTecnicos } from '@inn/activos/identificacion/domain/value-objects';
import { MedidasTecnicas } from '@inn/activos/identificacion/domain/value-objects/medidas-tecnicas.vo';
import { MedidasTecnicasEmbedded } from '@inn/orm/inn/activos/equipos/supports';

export class DatosTecnicosMapper {
    static toOrm(domain: DatosTecnicos): MedidasTecnicasEmbedded {
        const orm = new MedidasTecnicasEmbedded();
        orm.medidas = domain.getMedidas;

        return orm;
    }

    static toDomain(orm: MedidasTecnicasEmbedded): DatosTecnicos {
        return DatosTecnicos.create(
            orm.medidas ?? MedidasTecnicas.create()
        );
    }
}
