import { BadInputError, ResourceNotFoundError } from "@common/domain/errors";
import { getUser } from "@common/infrastructure/services";
import { Cronograma } from "@equipos/domain/entities";
import { CronogramaRead } from "@equipos/domain/read";
import { CRONOGRAMA_REPOSITORY, CronogramaRepository } from "@equipos/domain/repositories";
import { CreateCronogramaDto, FilterCronogramaDto, UpdateCronogramaDto } from "@equipos/presentation/dto";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class CronogramaService {
    constructor(
        @Inject(CRONOGRAMA_REPOSITORY)
        private readonly cronogramaRepository: CronogramaRepository
    ) { }

    async create(data: CreateCronogramaDto): Promise<CronogramaRead> {
        const exist = await this.cronogramaRepository.findByPeriodo(
            data.anio,
            data.mes,
            data.tipo,
        );
        if (exist)
            throw new BadInputError(`Ya existe un cronograma de ${data.tipo} para ${data.mes}/${data.anio}`);

        const usuarioCreador = getUser();
        const cronograma = Cronograma.create({
            anio: data.anio,
            mes: data.mes,
            tipo: data.tipo,
            creadoPorId: usuarioCreador.id,
            metaCumplimientoPct: data.metaCumplimientoPct,
            notas: data.notas,
        });

        return this.cronogramaRepository.save(cronograma);
    }

    async update(id: number, dto: UpdateCronogramaDto): Promise<CronogramaRead> {
        const cronograma = await this.findById(id);
        if (dto.metaCumplimientoPct !== undefined)
            cronograma.updateMeta(dto.metaCumplimientoPct);
        if (dto.notas !== undefined)
            cronograma.updateNotas(dto.notas);

        return this.cronogramaRepository.update(cronograma);
    }

    public async getById(id: number): Promise<CronogramaRead> {
        const found = await this.cronogramaRepository.findViewById(id);
        if (!found)
            throw new ResourceNotFoundError(`Cronograma con id: ${id} no encontrado`);
        return found;
    }

    async close(id: number): Promise<CronogramaRead> {
        const cronograma = await this.findById(id);
        cronograma.close();
        return this.cronogramaRepository.update(cronograma);
    }

    async annul(id: number): Promise<CronogramaRead> {
        const cronograma = await this.findById(id);
        cronograma.annul();
        return this.cronogramaRepository.update(cronograma);
    }

    async findAll(filters: FilterCronogramaDto): Promise<CronogramaRead[]> {
        return this.cronogramaRepository.findAllView({
            anio: filters.anio,
            mes: filters.mes,
            tipo: filters.tipo,
            estado: filters.estado,
        });
    }

    public async findById(id: number): Promise<Cronograma> {
        const found = await this.cronogramaRepository.findById(id);
        if (!found)
            throw new ResourceNotFoundError(`Cronograma con id: ${id} no encontrado`);
        return found;
    }
}