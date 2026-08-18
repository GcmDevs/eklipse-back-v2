import { CommonGuards } from '@common/presentation/decorators';
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
} from '@nestjs/common';
import { GuardarRegistroMuestraDto } from './dto';
import { FormatoMuestrasAnatomopatologicasImpl } from '../infraestructure/services';

@CommonGuards()
@Controller('v1/hpn/anatomopatologicos')
export class FormatoMuestrasAnatomopatologicasController {
  constructor(private _buscarPacienteImpl: FormatoMuestrasAnatomopatologicasImpl) {}
  @Get()
  public async listar() {
    try {
      return await this._buscarPacienteImpl.listar();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('pacientes/:documento')
  public async buscarPaciente(@Param('documento') documento: string) {
    try {
      return await this._buscarPacienteImpl.buscarPaciente(documento);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('cups/:codigo')
  public async buscarCups(@Param('codigo') codigo: string) {
    try {
      return await this._buscarPacienteImpl.buscarCups(codigo);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  public async crear(@Body() body: GuardarRegistroMuestraDto) {
    try {
      return await this._buscarPacienteImpl.crear(body);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id')
  public async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: GuardarRegistroMuestraDto,
  ) {
    try {
      return await this._buscarPacienteImpl.actualizar(id, body);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
