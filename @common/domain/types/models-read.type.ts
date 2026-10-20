export interface ArchivoRead {
  id: number;
  nombreOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  extension: string;
}

export interface EntityMinimalRead {
  id: number;
  nombre: string;
}
