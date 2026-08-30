import { Entity, PrimaryColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { AfnTipoSerTecCode } from '@inn/lgc/afn/types/inn/activos-fijos';

@Entity(TABLE_NAMES.inn.afn.svt.usuarioTipoServicioTecnico)
export class UsuarioTipoServicioTecnicoOrm {
  @PrimaryColumn({ name: TABLE_NAMES.gen.usu.usuarios, type: 'int' })
  usuarioId: number;

  @PrimaryColumn({ name: 'EKINNAFNSOLISERTECTIPO', type: 'tinyint' })
  tipoServicioTecnicoCode: AfnTipoSerTecCode;
}
