import { FILE_LOCATIONS } from "@common/application/constants";
import { TRANSACTION_MANAGER, TransactionManager } from "@common/application/services";
import { BadInputError, ResourceNotFoundError } from "@common/domain/errors";
import { FindThrowOptions } from "@common/domain/types";
import { CreateFirmaDto, UpdateFirmaDto } from "@core/firmas/presentation/dto";
import { StagingFileService } from "@core/media/application/services/staging.archivo.service";
import { RESTRICCIONES_MIME_STAGING, TipoContextoArchivo } from "@core/media/domain/types";
import { TerceroService } from "@core/terceros/application/services";
import { Inject, Injectable } from "@nestjs/common";
import { ArchivoAlmacenadoOrm, FirmaOrm, TerceroOrm, TipoFirmante } from "@orm/cor";
import { UsuarioOrm } from "@orm/gen";
import { FIRMA_REPOSITORY, FirmaRepository } from "../repositories";
import { UsuarioEqpService } from "./usuario-eqp.service";

@Injectable()
export class FirmaService {
    constructor(
        @Inject(FIRMA_REPOSITORY)
        private readonly firmaRepository: FirmaRepository,
        private readonly stagingService: StagingFileService,
        private readonly usuarioService: UsuarioEqpService,
        private readonly terceroService: TerceroService,
        @Inject(TRANSACTION_MANAGER)
        private readonly txManager: TransactionManager,
    ) { }

    public async create({
        tipoFirmante,
        usuarioId,
        terceroId,
        archivoFirmaId,
    }: CreateFirmaDto): Promise<FirmaOrm> {
        if (usuarioId && terceroId) {
            throw new BadInputError(
                'No puede especificar usuario y tercero al mismo tiempo'
            );
        }
        if (!usuarioId && !terceroId) {
            throw new BadInputError(
                'Debe especificar un firmante: usuarioId o terceroId'
            );
        }

        let usuario: UsuarioOrm = null;
        let tercero: TerceroOrm = null;
        let nombreFirmante: string;

        if (usuarioId) {
            usuario = await this.usuarioService.findById(usuarioId);
            nombreFirmante = usuario.nombreCompleto;
        }

        if (terceroId) {
            tercero = await this.terceroService.findById(terceroId);
            nombreFirmante = tercero.nombre;
        }

        if (archivoFirmaId) {
            await this.stagingService.findById(archivoFirmaId);
        }

        return this.txManager.transactional(async () => {
            const firma = await this.firmaRepository.save({
                tipoFirmante,
                nombreFirmante,
                archivoFirma: { id: archivoFirmaId } as ArchivoAlmacenadoOrm,
                usuario,
                tercero,
            });

            await this.stagingService.commit(
                {
                    archivoId: archivoFirmaId,
                    module: FILE_LOCATIONS.cor.firmas,
                    contexto: this.getContextoArchivo(tipoFirmante),
                    referenciaId: firma.id,
                },
                RESTRICCIONES_MIME_STAGING.IMAGENES,
            );

            return firma
        });
    }

    public async update(
        id: number,
        { archivoFirmaId }: UpdateFirmaDto,
    ): Promise<FirmaOrm> {
        const firma = await this.findById(id);
        await this.stagingService.findById(archivoFirmaId);

        return this.txManager.transactional(async () => {
            const updated = await this.firmaRepository.update(firma.id, {
                archivoFirma: { id: archivoFirmaId } as ArchivoAlmacenadoOrm
            });

            await this.stagingService.commit(
                {
                    archivoId: archivoFirmaId,
                    module: FILE_LOCATIONS.cor.firmas,
                    contexto: this.getContextoArchivo(firma.tipoFirmante),
                    referenciaId: firma.id,
                },
                RESTRICCIONES_MIME_STAGING.IMAGENES,
            );

            if (firma.archivoFirma?.id) {
                await this.stagingService.deprecate(firma.archivoFirma.id);
            }

            return updated;
        });
    }

    public async findByFirmante(
        firmanteId: number,
        tipoFirmante: TipoFirmante
    ): Promise<FirmaOrm> {
        const firma = await this.firmaRepository.findByFirmante(firmanteId, tipoFirmante);
        if (!firma) throw new
            ResourceNotFoundError(`no se encontro ninguna firma asociada a el ${tipoFirmante.toString().toLowerCase()}`);
        return firma;
    }

    public async findById(
        id: number,
        options: FindThrowOptions = new FindThrowOptions(),
    ): Promise<FirmaOrm | null> {
        const firma = await this.firmaRepository.findById(id);
        if (!firma) {
            if (options.throwIfNotFound) {
                throw new ResourceNotFoundError(
                    `Firma con id ${id} no encontrada`
                );
            }
            return null;
        }
        return firma;
    }

    private getContextoArchivo(
        tipoFirmante: TipoFirmante,
    ): string {
        switch (tipoFirmante) {
            case TipoFirmante.USUARIO:
                return TipoContextoArchivo.FIRMA.USR;

            case TipoFirmante.TERCERO:
                return TipoContextoArchivo.FIRMA.TERCERO;

            default:
                throw new BadInputError(
                    `Tipo de firmante no soportado`
                );
        }
    }
}