import { MedidasTecnicas } from '@equipos/domain/value-objects/medidas-tecnicas.vo';
import { Column } from 'typeorm';

export class MedidasTecnicasEmbedded {
  @Column({
    name: 'DTMEDIDASTECNICAS',
    type: 'simple-json',
    nullable: true,
    transformer: {
      to: (value?: MedidasTecnicas | null) => {
        if (!value || value.isEmpty()) return null;
        return value.toPrimitives();
      },
      from: (value?: any[] | null) => {
        if (!value) return MedidasTecnicas.create();
        return MedidasTecnicas.fromPrimitives(value);
      },
    },
  })
  medidas: MedidasTecnicas;
}
