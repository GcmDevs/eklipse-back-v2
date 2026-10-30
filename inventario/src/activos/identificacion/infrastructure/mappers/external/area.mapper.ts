import { ResponseAreaDto } from "@inn/activos/identificacion/presentation/dto/external";
import { AreaServicioOrm } from "@inn/orm/gen";

export class AreaMapper {
    public static toResponse(area: AreaServicioOrm): ResponseAreaDto {
        return {
            id: area.id,
            codigo: area.codigo,
            nombre: area.nombre,
        } as ResponseAreaDto;
    }
}
