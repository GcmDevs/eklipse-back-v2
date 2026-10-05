import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { MedicoImpl } from '@gestion-clinica/entrega-turnos/infrastructure/repositories';

@CommonGuards()
@Controller('v4/entrega-turnos/medico')
export class MedicoController {
  constructor(private _medicoSource: MedicoImpl) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Get('/:turnoId')
  public fetch(@Param('turnoId') turnoId: number) {
    try {
      const result = this._medicoSource.fetch(turnoId);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('add')
  public create(@Body() body: { medicoId: number; turnoId: number }) {
    try {
      const result = this._medicoSource.create(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
