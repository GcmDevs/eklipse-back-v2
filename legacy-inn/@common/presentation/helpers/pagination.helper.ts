import { BaseApiResponse } from "@common/domain/types";
import { BadRequestException } from "@nestjs/common";

export class PaginationHelper {
    static response<T>(
        data: T[],
        count: number,
        page: number,
        limit: number,
    ): BaseApiResponse<T[]> {

        const totalPages = Math.ceil(count / limit);

        if (totalPages > 0 && page > totalPages) {
            throw new BadRequestException(
                `La página ${page} excede el total de páginas ${totalPages}`
            );
        }

        return {
            data,
            metadata: {
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
            },
        };
    }
}