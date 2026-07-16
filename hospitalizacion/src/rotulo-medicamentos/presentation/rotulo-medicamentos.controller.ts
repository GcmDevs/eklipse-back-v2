import { CommonGuards } from '@common/presentation/decorators';
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
import { ApiResponse } from '@nestjs/swagger';
import {
  ActualizarRotuloDto,
  CrearRotuloDto,
  GuardarRotulosBatchDto,
  RotuloQueryDto,
  RotulosFechaQueryDto,
} from './dto/rotulo-medicamentos.dto';
import {
  ActualizarRotuloMedicamentosImpl,
  ByIngresoRotuloMedicamentosImpl,
  CensoRotuloMedicamentosImpl,
  DesactivarRotuloMedicamentoImpl,
  MedicamentosRotuloMedicamentosImpl,
  RegistrarRotuloMedicamentosImpl,
  RotuloMedicamentosImpl,
  TodosRotuloMedicamentosImpl,
} from '../infraestructure/services';
import {
  CensoRotuloMedicamentoRes,
  MedicamentoRotuloRes,
  RegistrarRotuloMedicamentoRes,
  RotuloMedicamentoRes,
} from '../application/responses';

@CommonGuards()
@Controller('v1/rotulo-medicamentos')
export class RotuloMedicamentosController {
  constructor(
    private readonly _rotuloMedicamentosImpl: RotuloMedicamentosImpl,
    private readonly _byIngresoRotuloMedicamentosImpl: ByIngresoRotuloMedicamentosImpl,
    private readonly _registrarRotuloMedicamentosImpl: RegistrarRotuloMedicamentosImpl,
    private readonly _medicamentosRotuloMedicamentosImpl: MedicamentosRotuloMedicamentosImpl,
    private readonly _censoRotuloMedicamentosImpl: CensoRotuloMedicamentosImpl,
    private readonly _todosRotuloMedicamentosImpl: TodosRotuloMedicamentosImpl,
    private readonly _desactivarRotuloMedicamentoImpl: DesactivarRotuloMedicamentoImpl,
    private readonly _actualizarRotuloMedicamentoImpl: ActualizarRotuloMedicamentosImpl
  ) {}

  @ApiResponse({ type: CensoRotuloMedicamentoRes, isArray: true })
  @Get('censo')
  public async fetchCenso(): Promise<CensoRotuloMedicamentoRes[]> {
    try {
      return await this._censoRotuloMedicamentosImpl.fetchCenso();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiResponse({ type: MedicamentoRotuloRes, isArray: true })
  @Get('medicamentos/:ingreso')
  public async fetchMedicamentos(
    @Param('ingreso', ParseIntPipe) ingreso: number
  ): Promise<MedicamentoRotuloRes[]> {
    try {
      return await this._medicamentosRotuloMedicamentosImpl.fetchMedicamentos(ingreso);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiResponse({ type: RegistrarRotuloMedicamentoRes, isArray: true })
  @Post()
  public async registrar(@Body() body: CrearRotuloDto): Promise<RegistrarRotuloMedicamentoRes[]> {
    try {
      return await this._registrarRotuloMedicamentosImpl.registrar(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiResponse({ type: RegistrarRotuloMedicamentoRes, isArray: true })
  @Get()
  public async getRotulos(): Promise<RegistrarRotuloMedicamentoRes[]> {
    try {
      return await this._todosRotuloMedicamentosImpl.getRotulos();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiResponse({ type: RotuloMedicamentoRes, isArray: true })
  @Get('rotulos')
  public async obtenerRotulos(
    @Query() query: RotulosFechaQueryDto
  ): Promise<RotuloMedicamentoRes[]> {
    try {
      return await this._rotuloMedicamentosImpl.obtenerRotulos(query);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @ApiResponse({ type: RotuloMedicamentoRes, isArray: true })
  @Get('rotulos/paciente')
  async obtenerRotulo(@Query() query: RotuloQueryDto): Promise<RotuloMedicamentoRes[]> {
    try {
      return await this._byIngresoRotuloMedicamentosImpl.obtenerRotulosPorIngreso(query.documento);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Post('desactivar/:id')
  public async desactivar(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    try {
      return await this._desactivarRotuloMedicamentoImpl.desactivar(id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Patch('actualizar/:id')
  public async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarRotuloDto
  ): Promise<boolean> {
    try {
      return await this._actualizarRotuloMedicamentoImpl.actualizar(id, body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
