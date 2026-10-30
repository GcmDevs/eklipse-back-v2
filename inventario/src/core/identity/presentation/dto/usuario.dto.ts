export interface UsuarioRead {
  id: number;
  nombre: string;
  numeroDocumento: string;
  /** Presente cuando la búsqueda usa `transversal=true` (nombre de la sede consultada). */
  sede?: string;
}
