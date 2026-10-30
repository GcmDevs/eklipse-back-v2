import { FuenteLecturaOdometro } from '../enums';

export interface LecturaOdometroRead {
  id: number;
  activoId: number;
  lectura: number;
  fechaLectura: Date;
  fuente: FuenteLecturaOdometro;
  referenciaId: number | null;
  confiable: boolean;
  usuarioId: number;
  usuarioNombre?: string;
  observacion: string | null;
  createdAt: Date;
}
