import { TipoSugerenciaTypeCode } from '@inn/old/inn/recepcion-tecnica/domain/types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNRTCSUGERENCIA')
export class SugerenciaOSRD {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'TIPO' })
  tipo: TipoSugerenciaTypeCode;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;
}
