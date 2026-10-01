import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  RCTSugerenciaCode,
  RCTSugerenciaType,
  RCTSugerenciaTypeFactory,
} from '../../../domain/types/rec-tec';

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
  tipoCode: RCTSugerenciaCode;

  tipo: RCTSugerenciaType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = RCTSugerenciaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
