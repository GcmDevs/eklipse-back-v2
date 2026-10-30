import { MTD } from "@common/application/constants";
import { MimeTypes } from "@common/domain/enums";
import { applyDecorators, BadRequestException, createParamDecorator, ExecutionContext, SetMetadata, UseInterceptors } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

export interface UploadFileOptions {
    fieldName: string;
    destination?: string;
    allowedMimeType: MimeTypes[];
    multiple: boolean;
    maxSizeMB?: number;
    maxCount?: number;
}


export function UploadFile(options: UploadFileOptions) {
    const { fieldName, allowedMimeType, multiple, maxSizeMB = 10, maxCount = 10 } = options;
    return applyDecorators(
        SetMetadata(MTD.FILE_FIELD_MTD, fieldName),
        SetMetadata(MTD.MULTIPLE_MTD, multiple),
        UseInterceptors(
            FileFieldsInterceptor([{ name: fieldName, maxCount: maxCount }],
                {
                    storage: memoryStorage(),
                    limits: { fileSize: maxSizeMB * 1024 * 1024 },
                    fileFilter(req, file, callback) {
                        if (!allowedMimeType.includes(file.mimetype as MimeTypes)) {
                            return callback(
                                new BadRequestException(`solo se permiten archivos en formato ${allowedMimeType.join(", ")} `),
                                false
                            );
                        }
                        callback(null, true);
                    }
                }
            )
        )
    )
}



export function UploadFileExtractor() {
    return createParamDecorator(
        async (data: unknown, ctx: ExecutionContext) => {
            const request = ctx.switchToHttp().getRequest();
            const reflector = request?.nestjsReflector as Reflector || new Reflector();

            const files = request.files || {};
            const handler = ctx.getHandler();

            const field = reflector.get(MTD.FILE_FIELD_MTD, handler);
            const multiple = reflector.get(MTD.MULTIPLE_MTD, handler);

            const items = files[field];
            if (!items) return multiple ? [] : null;

            if (!multiple) {
                if (Array.isArray(items) && items.length > 1) {
                    throw new BadRequestException(`Solo se permite un archivo en '${field}'.`);
                }
                if (Array.isArray(items) && items.length === 0) {
                    return null;
                }
            }

            return multiple ? items : (Array.isArray(items) ? items[0] : items);
        },
    )();
}

