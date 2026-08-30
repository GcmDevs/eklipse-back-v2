import {
  SugerenciaCode,
  SugerenciaType,
  sugerenciaTypeFactory,
} from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNRTCSUGERENCIA')
export class SRDRCTSugerenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @Column({ name: 'TIPO' })
  tipoCode: SugerenciaCode;

  tipo: SugerenciaType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = sugerenciaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
