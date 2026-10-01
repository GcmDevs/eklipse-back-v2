import { BadInputError, ResourceNotFoundError } from "@common/domain/errors";
import { ModalidadEjecucionActividad } from "@equipos/domain/enums";
import { REGISTRO_ACTIVIDAD_REPOSITORY, RegistroActividadRepository } from "@equipos/domain/repositories";
import { Inject, Injectable } from "@nestjs/common";
import { EstadoRegistroDilg, REGISTRO_DILIGENCIADO_REPOSITORY, RegistroDiligenciadoRepository } from "apps/motor-formatos/domain";

@Injectable()
export class RegistroCrossValidatorService {
    constructor(
        @Inject(REGISTRO_ACTIVIDAD_REPOSITORY)
        private readonly regActividadRepository: RegistroActividadRepository,
        @Inject(REGISTRO_DILIGENCIADO_REPOSITORY)
        private readonly regDilgRepository: RegistroDiligenciadoRepository,
    ) { }


    async ensureDiligenciamientoPermitido(regActividadId: number): Promise<void> {
        const regActividad = await this.regActividadRepository.findById(regActividadId);

        if (!regActividad)
            throw new ResourceNotFoundError(
                `Registro de actividad ${regActividadId} no encontrado`,
            );

        if (regActividad.getModalidadPlanificada === ModalidadEjecucionActividad.EXTERNA)
            throw new BadInputError(
                'Esta actividad está configurada como ejecución externa en el plan. ' +
                'No aplica diligenciamiento de formato.',
            );

        const existente = await this.regDilgRepository.findByRegActividad(regActividadId);
        if (existente && !existente.isAnulado()) {
            if (existente.isCompletado() || existente.isAprobado())
                throw new BadInputError(
                    `Ya existe un registro diligenciado en estado "${existente.getEstado}" ` +
                    'para esta actividad. No se puede crear uno nuevo.',
                );

            throw new BadInputError(
                `Ya existe un registro diligenciado en borrador (id: ${existente.getId.getValor}) ` +
                'para esta actividad. Use la función de actualización de borrador.',
            );
        }
    }


    async findRegistroDiligByActividad(registroActividadId: number) {
        return this.regDilgRepository.findViewByRegActividad(registroActividadId);
    }

    async ensureFormatoCompletadoParaCierre(registroActividadId: number): Promise<void> {
        const regDilg = await this.regDilgRepository.findByRegActividad(registroActividadId);

        if (!regDilg)
            throw new BadInputError(
                'Esta actividad requiere formato diligenciado. ' +
                'Diligencie el formato y márquelo como completado antes de cerrar la actividad.',
            );

        if (regDilg.getEstado !== EstadoRegistroDilg.COMPLETADO)
            throw new BadInputError(
                `El formato está en estado "${regDilg.getEstado}". ` +
                'Debe completar el formato antes de cerrar la actividad.',
            );
    }
}