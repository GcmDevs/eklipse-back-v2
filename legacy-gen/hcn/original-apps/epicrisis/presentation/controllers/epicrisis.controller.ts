import { Controller, Get, Param } from '@nestjs/common';
import { CambiarEstadoEpicrisisHandler } from '../handlers';
import { ApiTags } from '@nestjs/swagger';
import { EpicrisisDto } from '@hcn/ori/epi/application/data-transfers';
import { HCN_AUTHORITIES } from '@authorities/historia-clinica';
import { Authorities, CommonGuards } from '@common/presentation/decorators';

@ApiTags('V1 - Epicrisis')
@CommonGuards()
@Controller('v1/epicrisis')
export class EpicrisisController {
  constructor(private _desconfirmarEpicrisis: CambiarEstadoEpicrisisHandler) {}

  @Authorities([HCN_AUTHORITIES.EPICRISIS.DESCONFIRMAR])
  @Get('find-by-consecutivo/:consecutivo')
  findConfirmadaByConsecutivo(@Param('consecutivo') consecutivo: number): Promise<EpicrisisDto> {
    return this._desconfirmarEpicrisis.findByConsecutivo(+consecutivo);
  }

  @Authorities([HCN_AUTHORITIES.EPICRISIS.DESCONFIRMAR])
  @Get('/desconfirmar/:consecutivo')
  async desconfirmar(@Param('consecutivo') consecutivo: number): Promise<boolean> {
    return await this._desconfirmarEpicrisis.desconfirmar(+consecutivo);
  }
}
