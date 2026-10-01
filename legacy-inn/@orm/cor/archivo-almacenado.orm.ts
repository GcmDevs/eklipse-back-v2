import { TABLE_NAMES } from '@common/application/constants';
import { MimeTypes } from '@common/domain/enums';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity } from 'typeorm';

@Entity({ name: TABLE_NAMES.cor.archivos })
export class ArchivoAlmacenadoOrm extends BaseOrm {
  @Column({ name: 'NOMBREORIGINAL' })
  nombreOriginal: string;

  @Column({ name: 'NOMBREDEALMACENADO' })
  nombreDeAlmacenado: string;

  @Column({ name: 'EXTENSION' })
  extension: string;

  @Column({
    type: 'smallint',
    name: 'TIPOMIME',
    transformer: {
      to: (v: MimeTypes) => MimeTypeToCodeMap[v],
      from: (v: number) => CodeToMimeTypeMap[v],
    },
  })
  tipoMime: MimeTypes;

  @Column({ type: 'bigint', name: 'TAMANOBYTES' })
  tamanoBytes: number;

  @Column({ name: 'RUTAARCHIVO' })
  rutaArchivo: string;

  @Column({ name: 'RUTASEGURA', nullable: true })
  rutaSegura?: string;

  @Column({ name: 'PROVEEDORALMACENAMIENTO', default: 'local' })
  proveedorAlmacenamiento: string;

  @Column({ name: 'ESTEMPORAL', type: 'bit', default: true })
  isTemporal: boolean;

  @Column({ name: 'ESTAUSADO', type: 'bit', default: false })
  isUsado: boolean;

  @Column({ name: 'USUARIOCARGAOID', type: 'int', nullable: true })
  usuarioCargaId?: number;

  @Column({ name: 'FECHCARGA', type: 'datetime2' })
  fechaCarga: Date;

  @Column({ name: 'CONTEXTO', type: 'varchar', nullable: true })
  contexto: string;

  @Column({ name: 'REFERENCIAOID', type: 'int', nullable: true })
  referenciaId: number;
}

const MimeTypeToCodeMap: Record<MimeTypes, number> = {
  [MimeTypes.JPEG]: 1,
  [MimeTypes.PNG]: 2,
  [MimeTypes.CSV]: 3,
  [MimeTypes.PDF]: 4,
  [MimeTypes.DOC]: 5,
  [MimeTypes.DOCX]: 6,
  [MimeTypes.XLS]: 7,
  [MimeTypes.XLSX]: 8,
  [MimeTypes.MP4]: 9,
};

export const CodeToMimeTypeMap: Record<number, MimeTypes> = Object.fromEntries(
  Object.entries(MimeTypeToCodeMap).map(([key, value]) => [value, key])
) as Record<number, MimeTypes>;
