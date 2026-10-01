import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EstanciaService } from '../../infraestructure/repositories';
import {
  ActivityFeedQueryDto,
  CerrarEstanciaDto,
  CrearEstanProDto,
  CrearSeguimientoSemanaDto,
  FindStaysQueryDto,
  UpdateDomainActionDto,
  UpdateEstanProDto,
} from '../dtos';

// @CommonGuards()
@ApiTags('v4 - Prolonged Stays')
@Controller('v4/estancias-prolongadas')
export class EstanciasProlongadasController {
  constructor(private readonly estanciaService: EstanciaService) {}

  private handleError(error: any): never {
    if (error instanceof HttpException) throw error;
    throw new BadRequestException(error.message);
  }

  @Post()
  public async createStay(@Body() body: CrearEstanProDto) {
    try {
      return await this.estanciaService.createStay(body);
    } catch (error: any) {
      this.handleError(error);
    }
  }
  @Get()
  public async getStaysActivo() {
    try {
      return await this.estanciaService.getStaysActivo();
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get('query')
  public async obtenerEstancias(@Query() query: FindStaysQueryDto) {
    try {
      return await this.estanciaService.getStays(query);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get('admin/activity-feed')
  public async obtenerActivityFeed(@Query() query: ActivityFeedQueryDto) {
    try {
      return await this.estanciaService.obtenerActivityFeed(query);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Post(':id/seguimientos')
  public async crearSeguimiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CrearSeguimientoSemanaDto
  ) {
    try {
      return await this.estanciaService.crearSeguimiento(id, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get(':id/seguimientos')
  public async listarSeguimientos(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.estanciaService.listarSeguimientos(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch(':id/cierre')
  public async cerrarEstancia(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CerrarEstanciaDto
  ) {
    try {
      return await this.estanciaService.cerrarEstancia(id, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get(':id')
  public async getStayById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.estanciaService.getStayById(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch(':id')
  public async updateStay(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateEstanProDto) {
    try {
      return await this.estanciaService.updateStay(id, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch(':id/acciones/:accionId')
  public async updateAction(
    @Param('id', ParseIntPipe) id: number,
    @Param('accionId', ParseIntPipe) actionId: number,
    @Body() body: UpdateDomainActionDto
  ) {
    try {
      return await this.estanciaService.updateAction(id, actionId, body);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
