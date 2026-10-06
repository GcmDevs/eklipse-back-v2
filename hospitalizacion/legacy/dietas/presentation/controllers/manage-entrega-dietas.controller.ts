import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ManageEntregaDietasImpl } from '@lgc/die/infrastructure/services';
import { ESTADOS_DIETA, ESTADOS_JORNADA, MotivoDevolucionDietaCode } from '@lgc/die/domain/types';
import { HPN_AUTHORITIES } from '@authorities';

@CommonGuards()
@ApiTags('v1 - Dietas')
@Controller('dim/dietas/v1')
export class ManageEntregaDietasController {
  constructor(private _manageEntrega: ManageEntregaDietasImpl) {}

  @Authorities([HPN_AUTHORITIES.DIETAS.FUNCIONES_PROVEEDOR])
  @Get('enviar-jornada/:id')
  async enviarJornada(@Param('id') id: number) {
    const patients = await this._manageEntrega.updateEstadoJornada(+id, ESTADOS_JORNADA.ENVIADA);
    return patients;
  }

  @Authorities([HPN_AUTHORITIES.DIETAS.RECIBIR_EN_DESTINO])
  @Get('recibir-jornada/:id')
  async recibirJornada(@Param('id') id: number) {
    const patients = await this._manageEntrega.updateEstadoJornada(+id, ESTADOS_JORNADA.RECIBIDA);
    return patients;
  }

  @Authorities([HPN_AUTHORITIES.DIETAS.VER_JORNADA])
  @Get('entregar-dieta/:id')
  async confirmarDieta(@Param('id') id: number) {
    try {
      const patients = await this._manageEntrega.updateEstadoDieta(+id, ESTADOS_DIETA.ENTREGADO);
      return patients;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.DIETAS.VER_JORNADA])
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
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
