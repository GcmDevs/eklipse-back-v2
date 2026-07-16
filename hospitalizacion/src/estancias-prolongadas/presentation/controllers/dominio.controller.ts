import {
  ActualizarDominiosItemImpl,
  CrearDominioImpl,
  ObtenerDominiosImpl,
  ToggleDominioItemActivoImpl,
} from '@hpn/estancias-prolongadas/infraestructure/services/dominio';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActualizarDominioItemDto, CrearDominioItemDto } from '../dtos';

// @CommonGuards()
@ApiTags('v1 - Estancias Prolongadas - Dominios')
@Controller('v1/estancias-prolongadas/dominios')
export class DominiosController {
  constructor(
    private readonly _dominioImpl: ObtenerDominiosImpl,
    private readonly _crearDominioImpl: CrearDominioImpl,
    private readonly _actualizarDominioItemImpl: ActualizarDominiosItemImpl,
    private readonly _toggleDominioItemActivoImpl: ToggleDominioItemActivoImpl
  ) {}

  @Get()
  public async getDominios(@Query('mostrarActivos') mostrarActivos: boolean) {
    try {
      return await this._dominioImpl.getDominios(mostrarActivos);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/items')
  public async crearDominioItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CrearDominioItemDto
  ) {
    try {
      return await this._crearDominioImpl.createDominioItem(id, body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('items/:id')
  public async actualizarDominioItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarDominioItemDto
  ) {
    try {
      return await this._actualizarDominioItemImpl.actualizarDominioItem(id, body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('items/:id/toggle-activo')
  public async toggleDominioItemActivo(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this._toggleDominioItemActivoImpl.toggleDominioItemActivo(id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
