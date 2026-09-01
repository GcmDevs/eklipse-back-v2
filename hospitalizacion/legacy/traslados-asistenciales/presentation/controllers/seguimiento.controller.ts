import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  AsignarTrasladoDto,
  EntregaMovilDto,
  IniciarRetornoDto,
  ReasignarTrasladoDto,
  RegistrarComplicacionDto,
} from '../dtos';
import { SeguimientoTrasladoImpl } from '@hpn/lgc/tas/infrastructure';
import { HPN_AUTHORITIES } from '@authorities';
import { TrasladosRealtimeGateway } from '../gateways/traslados-realtime.gateway';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v4/gestion-clinica/traslados-asistenciales')
export class SeguimientoTrasladoController {
  constructor(
    private _source: SeguimientoTrasladoImpl,
    private readonly _events: TrasladosRealtimeGateway
  ) {}

  @ApiOperation({ summary: 'Registrar la entrega del paciente' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO])
  @Post('entregar-paciente')
  public async entregarPaciente(@Body() body: EntregaMovilDto) {
    try {
      const result = await this._source.entregarPaciente(body);
      if (result)
        this._events.publish({
          tipo: 'ENTREGA',
          trasladoId: body.trasladoId,
          contextoCode: body.contextoCode,
        });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Registrar la recepción del paciente' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @Post('recibir-paciente')
  public async recibirPaciente(@Body() body: EntregaMovilDto) {
    try {
      const result = await this._source.recibirPaciente(body);
      if (result)
        this._events.publish({
          tipo: 'RECEPCION',
          trasladoId: body.trasladoId,
          contextoCode: body.contextoCode,
        });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Asignar recursos a un traslado' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TRASLADO])
  @Post('asignar')
  public async asignar(@Body() body: AsignarTrasladoDto) {
    try {
      const result = await this._source.asignar(body);
      if (result)
        this._events.publish(
          { tipo: 'ASIGNACION', trasladoId: body.trasladoId, contextoCode: body.contextoCode },
          [body.conductor?.documento, body.auxiliar?.documento, body.medico?.documento]
        );
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Reasignar recursos a un traslado' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TRASLADO])
  @Post('reasignar')
  public async reassign(@Body() body: ReasignarTrasladoDto) {
    try {
      const result = await this._source.reasignar(body);
      if (result)
        this._events.publish(
          { tipo: 'REASIGNACION', trasladoId: body.trasladoId, contextoCode: body.contextoCode },
          [body.conductor?.documento, body.auxiliar?.documento, body.medico?.documento]
        );
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Iniciar el retorno del traslado' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @Post('iniciar-retorno')
  public async iniciarRetorno(@Body() body: IniciarRetornoDto) {
    try {
      const result = await this._source.iniciarRetorno(body);
      if (result)
        this._events.publish({
          tipo: 'RETORNO',
          trasladoId: body.trasladoId,
          contextoCode: body.contextoCode,
        });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Registrar una complicación durante el traslado' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @Post('complicacion')
  public async registrarComplicacion(@Body() body: RegistrarComplicacionDto) {
    try {
      const result = await this._source.registrarComplicacion(body);
      if (result)
        this._events.publish({
          tipo: 'INCIDENTE',
          trasladoId: body.trasladoId,
          contextoCode: body.contextoCode,
        });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
