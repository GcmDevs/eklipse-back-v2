import { UserScopeContext } from "@auth/domain/interfaces/data-scope.interfaces";
import { AsignacionRecursoUsuario, Recurso } from "@inn/activos/identificacion/domain/entities";
import { RecursoAsignacionTecnicoRead, RecursoRead } from "@inn/activos/identificacion/domain/read";

export interface RecursoRepository {
  save(recurso: Recurso): Promise<RecursoRead>;
  findById(id: number): Promise<Recurso | null>;
  findViewById(id: number): Promise<RecursoRead | null>;
  findAllView(usuarioCtx: UserScopeContext): Promise<RecursoRead[]>;
  update(recurso: Recurso): Promise<RecursoRead>;
  findAsignacionActivaByUsuarioId(usuarioId: number): Promise<AsignacionRecursoUsuario | null>;
  findHistorialAsignaciones(recursoId: number): Promise<RecursoAsignacionTecnicoRead[]>
}
