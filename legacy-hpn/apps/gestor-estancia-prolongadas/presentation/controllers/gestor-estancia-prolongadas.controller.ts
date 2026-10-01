import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { GestorEstanciaProlongadasImpl } from '@gestor-estancia-prolongadas/infraestructure/repositories';
import { CreateGestorEstanciaProlongadaUsuarioDto } from '../dtos';

@ApiTags('v4 - Estancia Prolongada')
@CommonGuards()
@Controller('v4/gestor-estancia-prolongadas')
export class GestorEstanciaProlongadasController {
  constructor(private readonly _gestorEstanciaProlongadas: GestorEstanciaProlongadasImpl) {}

  @Get('censo')
  public async fetchCenso() {
    try {
      return await this._gestorEstanciaProlongadas.fetchCenso();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('usuarios')
  public async fetchUsuarios() {
    try {
      return await this._gestorEstanciaProlongadas.fetchUsuarios();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('usuarios-buscar/:pattern')
  public async buscarUsuariosByPattern(@Param('pattern') pattern: string) {
    try {
      return await this._gestorEstanciaProlongadas.buscarUsuariosByPattern(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('usuarios')
  public async createUsuario(@Body() body: CreateGestorEstanciaProlongadaUsuarioDto) {
    try {
      return await this._gestorEstanciaProlongadas.createUsuario(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('usuarios/:id')
  public async updateUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateGestorEstanciaProlongadaUsuarioDto
  ) {
    try {
      return await this._gestorEstanciaProlongadas.updateUsuario(id, body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Patch('usuarios/:id/toggle-estado')
  public async toggleUsuarioEstado(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this._gestorEstanciaProlongadas.toggleUsuarioEstado(id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
