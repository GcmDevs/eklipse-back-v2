import { UserScopeContext } from "@auth/domain/interfaces/data-scope.interfaces";
import { AsignacionRecursoUsuario, Recurso } from "@equipos/domain/entities";
import { RecursoAsignacionTecnicoRead, RecursoRead } from "@equipos/domain/read";

export interface RecursoRepository {
  save(recurso: Recurso): Promise<RecursoRead>;
  findById(id: number): Promise<Recurso | null>;
  findViewById(id: number): Promise<RecursoRead | null>;
  findAllView(usuarioCtx: UserScopeContext): Promise<RecursoRead[]>;
  update(recurso: Recurso): Promise<RecursoRead>;
  findAsignacionActivaByUsuarioId(usuarioId: number): Promise<AsignacionRecursoUsuario | null>;
  findHistorialAsignaciones(recursoId: number): Promise<RecursoAsignacionTecnicoRead[]>
}
