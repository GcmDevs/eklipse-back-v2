import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ManageEntregaDietasImpl } from '@lgc/die/infrastructure/services';
import { DIE_AUTHORITIES } from '@lgc/die/application/constants';
import {
  ESTADOS_DIETA,
  ESTADOS_JORNADA,
  MotivoDevolucionDietaCode,
} from '@lgc/die/domain/types/local';

@CommonGuards()
@ApiTags('v1 - Dietas')
@Controller('dim/dietas/v1')
export class ManageEntregaDietasController {
  constructor(private _manageEntrega: ManageEntregaDietasImpl) {}

  @Authorities([DIE_AUTHORITIES.ENVIAR])
  @Get('enviar-jornada/:id')
  async enviarJornada(@Param('id') id: number) {
    const patients = await this._manageEntrega.updateEstadoJornada(+id, ESTADOS_JORNADA.ENVIADA);
    return patients;
  }

  @Authorities([DIE_AUTHORITIES.RECIBIR])
  @Get('recibir-jornada/:id')
  async recibirJornada(@Param('id') id: number) {
    const patients = await this._manageEntrega.updateEstadoJornada(+id, ESTADOS_JORNADA.RECIBIDA);
    return patients;
  }

  @Authorities([DIE_AUTHORITIES.GESTIONAR_ENTREGA])
  @Get('entregar-dieta/:id')
  async confirmarDieta(@Param('id') id: number) {
    try {
      const patients = await this._manageEntrega.updateEstadoDieta(+id, ESTADOS_DIETA.ENTREGADO);
      return patients;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([DIE_AUTHORITIES.GESTIONAR_ENTREGA])
  @Get('devolver-dieta/:id')
  async devolverDieta(
    @Param('id') id: number,
    @Query('motivoCode') motivoCode: MotivoDevolucionDietaCode,
    @Query('observacion') observacion: string | null
  ) {
    try {
      observacion = observacion === 'null' ? null : observacion;
      const patients = await this._manageEntrega.updateEstadoDieta(
        +id,
        ESTADOS_DIETA.DEVUELTO,
        motivoCode,
        observacion
      );
      return patients;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
