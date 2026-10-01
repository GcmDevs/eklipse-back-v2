import { CommonGuards } from '@common/presentation/decorators';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RotuloMedicamentosImpl } from 'apps/rotulo-medicamentos/infraestructure/repositories/rotulo-medicamentos.impl';
import {
  GuardarRotulosBatchDto,
  RotuloQueryDto,
  RotulosFechaQueryDto,
} from '../dto/rotulo-medicamentos.dto';
import {
  ByIngresoRotuloMedicamentosImpl,
  CensoRotuloMedicamentosImpl,
  MedicamentosRotuloMedicamentosImpl,
  RegistrarRotuloMedicamentosImpl,
  TodosRotuloMedicamentosImpl,
} from 'apps/rotulo-medicamentos/infraestructure/repositories';

@CommonGuards()
@Controller('v4/rotulo-medicamentos')
export class RotuloMedicamentosController {
  constructor(
    private readonly rotuloMedicamentosImpl: RotuloMedicamentosImpl,
    private readonly byIngresoRotuloMedicamentosImpl: ByIngresoRotuloMedicamentosImpl,
    private readonly registrarRotuloMedicamentosImpl: RegistrarRotuloMedicamentosImpl,
    private readonly medicamentosRotuloMedicamentosImpl: MedicamentosRotuloMedicamentosImpl,
    private readonly censoRotuloMedicamentosImpl: CensoRotuloMedicamentosImpl,
    private readonly todosRotuloMedicamentosImpl: TodosRotuloMedicamentosImpl
  ) {}

  @Get('censo')
  public async fetchCenso() {
    try {
      return await this.censoRotuloMedicamentosImpl.fetchCenso();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('medicamentos/:ingreso')
  public async fetchMedicamentos(@Param('ingreso', ParseIntPipe) ingreso: number) {
    try {
      return await this.medicamentosRotuloMedicamentosImpl.fetchMedicamentos(ingreso);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  public async registrar(@Body() body: GuardarRotulosBatchDto) {
    try {
      return await this.registrarRotuloMedicamentosImpl.registrar(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Get()
  public async getRotulos() {
    try {
      return await this.todosRotuloMedicamentosImpl.getRotulos();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('rotulos')
  public async obtenerRotulos(@Query() query: RotulosFechaQueryDto) {
    try {
      return await this.rotuloMedicamentosImpl.obtenerRotulos(query);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('rotulos/paciente')
  async obtenerRotulo(@Query() query: RotuloQueryDto) {
    try {
      return await this.byIngresoRotuloMedicamentosImpl.obtenerRotulosPorIngreso(query.documento);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
