import {  RegistroImagenJsonOrm } from "apps/motor-formatos/infrastructure";
import { EstadoRegistroDilg } from "../enums";

export class RegistroDiligenciadoFmtRead {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    versionFormatoId: number;
    estado: EstadoRegistroDilg;
    formatoId: number;
    equipoId: number;
    registroActividadId?: number;
    datoSnapshot: Record<string, unknown>;
    imagenes: RegistroImagenJsonOrm[];
    diligenciadoPorId: number;
    fechaEnvio: Date | null;
}