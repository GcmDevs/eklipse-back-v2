import {
  RCTSugerenciaCode,
  RCTSugerenciaType,
  RCTSugerenciaTypeFactory,
} from '@inn/farmacia/domain/types/rec-tec';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNRTCSUGERENCIA')
export class RTCSugerenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'TIPO' })
  tipoCode: RCTSugerenciaCode;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  tipo: RCTSugerenciaType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = RCTSugerenciaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
