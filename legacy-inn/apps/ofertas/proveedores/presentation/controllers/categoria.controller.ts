import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CategoriasImpl } from '../../infrastructure/services';
import { GuardarOfertasDto } from '../dtos/guardar-ofertas.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { OFERTAS_DOCS_ROOT } from '../../domain/config/file-paths.config';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('v4/ofertas')
export class CategoriaController {
  constructor(private readonly categoriasService: CategoriasImpl) {}

  @Get('listar')
  async listarOfertas() {
    try {
      return await this.categoriasService.categorias();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('guardar')
  guardarOfertas(@Body() dto: GuardarOfertasDto) {
    return this.categoriasService.guardarOfertas(dto);
  }

  @Post('guardar-con-docs')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const tmp = join(OFERTAS_DOCS_ROOT, '_tmp');
          if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true });
          cb(null, tmp);
        },
        filename: (req, file, cb) => {
          const ext = file.originalname.split('.').pop();
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${file.fieldname}-${unique}.${ext}`);
        },
      }),
    })
  )
  async guardarOfertasConDocs(@Body() body: any, @UploadedFiles() files: Express.Multer.File[]) {
    return this.categoriasService.guardarOfertasConDocs({
      categoriaId: Number(body.categoriaId),
      proveedorId: Number(body.proveedorId),
      ofertas: JSON.parse(body.ofertas ?? '[]'),
      files,
    });
  }
}
