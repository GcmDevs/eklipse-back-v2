import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { deleteFile, nonEditFileName } from '@common/presentation/helpers';
import { NEW_FOLDER } from './folders';
import { diskStorage } from 'multer';
import * as fs from 'fs';

@CommonGuards()
@Controller('v1/inn/cloud')
export class CloudController {
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../temp`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post()
  public async addFiles(
    @UploadedFiles() files: { files: Express.Multer.File[] },
    @Body() body: { folder: string }
  ): Promise<string[]> {
    try {
      const urls: string[] = [];

      if (files && files.files.length) {
        files.files.forEach((file: Express.Multer.File) => {
          let newFolder = NEW_FOLDER(body.folder);
          const url = `public/${newFolder}/${file.originalname}`;
          urls.push(url);
          fs.rename(`../temp/${file.originalname}`, `../${url}`, _err => {});
        });
      }

      return urls;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete()
  public async removeFiles(
    @Query('locations') locations: string[],
    @Query('isDelete') isDelete: boolean
  ): Promise<boolean> {
    try {
      if (typeof locations === 'string') locations = [locations];
      if (locations && locations.length) {
        locations.forEach(location => {
          if (isDelete) {
            deleteFile(`${location}`);
          } else {
            const newLocation = `removed/${location.slice(7)}`;
            fs.rename(`../${location}`, `../${newLocation}`, _err => {});
          }
        });
      }
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
