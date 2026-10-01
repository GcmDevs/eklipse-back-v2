import { ArchivoAlmacenadoRead } from "@core/media/domain/read/media.read";
import { TipoFirmante } from "@orm/cor";
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class CreateFirmaDto {
    @IsEnum(TipoFirmante)
    tipoFirmante: TipoFirmante;

    @IsInt()
    @IsOptional()
    usuarioId?: number;

    @IsInt()
    @IsOptional()
    terceroId?: number;

    @IsInt()
    @IsNotEmpty()
    archivoFirmaId: number;
}

export class UpdateFirmaDto {
    @IsInt()
    archivoFirmaId: number;
}

export class ResponseFirmaDto {
    id: number;
    tipoFirmante: TipoFirmante;
    archivoId: number;
    archivo: ArchivoAlmacenadoRead;
    usuarioId?: number;
    terceroId?: number;
    nombreFirmante: string;
    createdAt: Date
}