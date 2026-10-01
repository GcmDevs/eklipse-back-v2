import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  ValorCriticoDto,
  AuditadoDto,
  ValoresCriticosReactivosDto,
  RecepcionTecnicaReactivosDto,
} from '../dtos';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { ValorCriticoCrudSource } from '@hpn/old/valores-criticos/infrastructure/repositories';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v1/hpn/valores-criticos')
export class ValoresCriticosController {
  constructor(private _valCriCrud: ValorCriticoCrudSource) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Get()
  public fetch(@Query('inicio') inicio: Date, @Query('final') final: Date) {
    try {
      if (inicio && final) {
        inicio = new Date(`${inicio}:00:00:00`);
        final = new Date(`${final}:23:59:59`);
      }
      return this._valCriCrud.fetch(inicio, final);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Get('medicos')
  public fetchMedico(@Query('pattern') pattern: string) {
    try {
      return this._valCriCrud.fetchMedicos(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Get('pacientes')
  public fetchPacientes(@Query('pattern') pattern: string) {
    try {
      return this._valCriCrud.fetchPacientes(undefined, pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Post()
  public create(@Body() body: ValorCriticoDto) {
    try {
      return this._valCriCrud.create(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Put('add-conducta/:id')
  public addConducta(@Body() body: { conducta: string }, @Param('id') id: number) {
    try {
      return this._valCriCrud.addConducta(body, id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Put('add-auditoria')
  public addAuditoria(@Body() body: AuditadoDto) {
    try {
      return this._valCriCrud.addAuditoria(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Get('revision-alertas')
  public fetchReactivos(@Query('inicio') inicio: Date, @Query('final') final: Date) {
    try {
      if (inicio && final) {
        inicio = new Date(`${inicio}:00:00:00`);
        final = new Date(`${final}:23:59:59`);
      }
      return this._valCriCrud.fetchReactivos(inicio, final);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Post('create-revision-alertas')
  public createReactivos(@Body() body: ValoresCriticosReactivosDto) {
    try {
      return this._valCriCrud.createReactivos(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Get('recepcion-tecnica-reactivos')
  public fetchRecepcionTecnicaReactivos(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date
  ) {
    try {
      if (inicio && final) {
        inicio = new Date(`${inicio}:00:00:00`);
        final = new Date(`${final}:23:59:59`);
      }
      return this._valCriCrud.fetchRecepcionTecnicaReactivos(inicio, final);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.REPORTE_VALORES_CRITICOS])
  @Post('create-recepcion-tecnica-reactivos')
  public createRecepcionTecnicaReactivos(@Body() body: RecepcionTecnicaReactivosDto) {
    try {
      return this._valCriCrud.crearRecepcionTecnicaReactivos(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
