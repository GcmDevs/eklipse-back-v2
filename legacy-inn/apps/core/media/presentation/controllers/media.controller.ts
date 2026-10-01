import { MimeTypes } from '@common/domain/enums';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { FileResponse } from '@common/presentation/decorators';
import { Controller, Get, Param, ParseIntPipe, Post, Query, StreamableFile } from '@nestjs/common';
import { UploadFile, UploadFileExtractor } from '../decorators/upload-archivo.decorator';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';

@Controller('/v4/media')
export class MediaController extends BaseShelteredController {
  constructor(private readonly mediaService: StagingFileService) {
    super()
  }

  @Post('/upload/imagenes')
  @UploadFile({
    fieldName: 'imagenes',
    allowedMimeType: [MimeTypes.PNG, MimeTypes.JPEG],
    multiple: true,
    maxSizeMB: 5,
    maxCount: 30
  })
  public async uploadImages(@UploadFileExtractor() images: Express.Multer.File[]): Promise<BaseApiResponse<any>> {
    const result = await this.mediaService.uploadMany(images);
    return { data: result, message: 'Archivos creados con exito' };
  }


  @Post('/upload/docs')
  @UploadFile({
    fieldName: 'docs',
    allowedMimeType: [MimeTypes.PDF, MimeTypes.DOCX, MimeTypes.XLSX],
    multiple: true,
    maxSizeMB: 15,
    maxCount: 10
  })
  public async uploadDocs(@UploadFileExtractor() docs: Express.Multer.File[]): Promise<BaseApiResponse<any>> {
    const result = await this.mediaService.uploadMany(docs);
    return { data: result, message: 'Archivos guardados con exito' };
  }


  @FileResponse()
  @Get('/preview/:id')
  async getFile(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string,
  ): Promise<StreamableFile> {
    const { stream, archivo } =
      await this.mediaService.getArchivoStream(id);

    const disposition = download === 'true' ? 'attachment' : 'inline';
    return new StreamableFile(stream, {
      type: archivo.getTipoMime,
      disposition: `${disposition}; filename="${archivo.getNombreOriginal}"`
    });
  }
}
