import { MimeTypes } from '@common/domain/enums';
import { Response } from 'express';

export class FileResponseHelper {
    static send(
        res: Response,
        buffer: Buffer,
        mimeType: MimeTypes,
        disposition: string,
    ): void {
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': disposition,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}