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
import { DominiosService } from '../../infraestructure/repositories';
import { CreateDominioItemDto, UpdateDomainItemDto } from '../dtos';

// @CommonGuards()
@ApiTags('v4 - Prolonged Stays')
@Controller('v4/estancias-prolongadas/dominios')
export class DominiosController {
  constructor(private readonly domainsService: DominiosService) {}

  @Get()
  public async getDominios(@Query('showActiveItemsOnly') showActiveItemsOnly: boolean) {
    try {
      return await this.domainsService.getDomains(showActiveItemsOnly);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/items')
  public async createDominioItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateDominioItemDto
  ) {
    try {
      return await this.domainsService.createDominioItem(id, body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('items/:id')
  public async updateDominioItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDomainItemDto
  ) {
    try {
      return await this.domainsService.updateDomainItem(id, body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('items/:id/toggle-activo')
  public async toggleDominioItemActivo(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.domainsService.toggleDominioItemActivo(id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
