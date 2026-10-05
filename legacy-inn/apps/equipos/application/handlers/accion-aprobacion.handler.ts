export interface AccionAprobacionHandler {
  validate(equipoId: number, payload: Record<string, any>): Promise<void>;
  execute(equipoId: number, payload: Record<string, any>, correlationId?: string): Promise<void>;
}
