import { TipoAccionAprobacion } from "@equipos/domain/enums";
import { Injectable } from "@nestjs/common";
import { AccionAprobacionHandler } from "./accion-aprobacion.handler";
import { ChangeEstadoHandler } from "./change-estado.handler";
import { DarBajaHandler } from "./de-baja.handler";
import { UpdateEquipoHandler } from "./update-datos.handler";

@Injectable()
export class AccionHandlerRegistry {
    private readonly handlers: Map<TipoAccionAprobacion, AccionAprobacionHandler>;

    constructor(
        private readonly cambioEstadoHandler: ChangeEstadoHandler,
        private readonly darDeBajaHandler: DarBajaHandler,
        private readonly updateEquipoHandler: UpdateEquipoHandler,
    ) {
        this.handlers = new Map<
            TipoAccionAprobacion,
            AccionAprobacionHandler
        >([
            [TipoAccionAprobacion.CAMBIO_ESTADO, this.cambioEstadoHandler],
            [TipoAccionAprobacion.DAR_DE_BAJA, this.darDeBajaHandler],
            [TipoAccionAprobacion.ACTUALIZAR, this.updateEquipoHandler],
        ]);
    }

    get(tipo: TipoAccionAprobacion): AccionAprobacionHandler {
        const handler = this.handlers.get(tipo);
        if (!handler)
            throw new Error(`No hay handler registrado para la accion: ${tipo}`);
        return handler;
    }
}