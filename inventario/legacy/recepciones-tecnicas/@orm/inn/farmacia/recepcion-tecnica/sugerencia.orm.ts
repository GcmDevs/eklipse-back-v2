import { TABLE_NAMES } from '@common/application/constants';
import {
  SugerenciaCode,
  SugerenciaType,
  sugerenciaTypeFactory,
} from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity(TABLE_NAMES.inn.fmc.rct.sugerencias)
export class RTCSugerenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'TIPO' })
  tipoCode: SugerenciaCode;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  tipo: SugerenciaType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = sugerenciaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
