import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';

export const editFileName = (req: any, file: any, callback: any): void => {
  const name = req && req.query && req.query.fileName ? req.query.fileName : new Date().getTime();
  const fileName = `${name}${extname(file.originalname)}`;
  callback(null, fileName);
};

export const deleteFile = (path: string): void => {
  path = `../${path}`;
  fs.unlink(path, err => {
    if (err) console.log(err);
  });
};

export const pdfFileFilter = (_req: any, file: any, callback: any): any => {
  if (!file.originalname.match(/\.(pdf|PDF)$/)) {
    return callback(new BadRequestException('Solo se permiten archivos en formato PDF!'), false);
  }
  callback(null, true);
};

export const nonEditFileName = (_req: any, file: any, callback: any): void => {
  callback(null, file.originalname);
};
