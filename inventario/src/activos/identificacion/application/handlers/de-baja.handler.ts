import { Injectable } from "@nestjs/common";
import { EquiposService } from "../services/equipo.service";
import { AccionAprobacionHandler } from "./accion-aprobacion.handler";
import { EquiposPolicies } from "../services/policies/equipos.policies";

@Injectable()
export class DarBajaHandler implements AccionAprobacionHandler {
  constructor(private readonly equipoPolicy: EquiposPolicies,
    private readonly equipoService: EquiposService
  ) { }

  async validate(equipoId: number, payload: Record<string, any>): Promise<void> {
    await this.equipoPolicy.validateDarDeBaja(equipoId, payload as any)
  }

  async execute(equipoId: number, payload: Record<string, any>, correlationId?: string): Promise<void> {
    await this.equipoService.darBaja(equipoId, payload as any, correlationId)
  }
}