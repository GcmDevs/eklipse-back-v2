import { Injectable } from "@nestjs/common";
import { EquiposService } from "../services/equipo.service";
import { EquiposPolicies } from "../services/policies/equipos.policies";
import { AccionAprobacionHandler } from "./accion-aprobacion.handler";

@Injectable()
export class ChangeEstadoHandler implements AccionAprobacionHandler {
  constructor(private readonly equipoPolicy: EquiposPolicies,
    private readonly equipoService: EquiposService
  ) { }

  async validate(equipoId: number, payload: Record<string, any>): Promise<void> {
    await this.equipoPolicy.validateChangeEstado(equipoId, payload as any)
  }

  async execute(equipoId: number, payload: Record<string, any>, correlationId?: string): Promise<void> {
    await this.equipoService.changeEstado(equipoId, { ...payload as any, correlationId})
  }
}