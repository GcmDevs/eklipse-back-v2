export const REGISTRO_DILG_VALIDATOR_SERVICE = Symbol('REGISTRO_DILG_VALIDATOR_SERVICE');
export interface RegistroDilgService {
    findEstadoByRegActividadId(
        registroActividadId: number,
    ): Promise<{ estado: string; id: number } | null>;
}