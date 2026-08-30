import { Get, Controller, Query, BadRequestException, Param } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  AFNTIPO_SER_REC_TEC__ASIGNAR__,
  AFNTIPO_SER_REC_TEC__ATCSNA,
  AFNTIPO_SER_REC_TEC__SEEALL,
  AFNTIPO_SER_REC_TEC__TODOS__,
  AFN_TIPO_SER_TEC_VALUES,
  AfnTipoSerTecCode,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { AfnUsuarioTipoServicioImpl } from '@inn/lgc/afn/infrastructure/services';
import { INN_AUTHORITIES } from '@inn/authorities';

@CommonGuards()
@Controller('v1/afn/ser-tec')
export class AfnTipoServicioTecnicoController {
  constructor(private _usuarioTipoServicio: AfnUsuarioTipoServicioImpl) {}

  @Get('tipos')
  async fetchTipos(@Query('includeAll') includeAll: boolean) {
    return includeAll
      ? [
          AFNTIPO_SER_REC_TEC__SEEALL,
          AFNTIPO_SER_REC_TEC__ASIGNAR__,
          AFNTIPO_SER_REC_TEC__ATCSNA,
          AFNTIPO_SER_REC_TEC__TODOS__,
          ...AFN_TIPO_SER_TEC_VALUES,
        ]
      : AFN_TIPO_SER_TEC_VALUES;
  }

  @Get('tipos/propios')
  async misTiposServicio() {
    try {
      return await this._usuarioTipoServicio.misTiposServicio();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('tipos/:id')
  async tiposByUser(@Param('id') id: string) {
    try {
      return await this._usuarioTipoServicio.tiposByUsuario(id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.MANAGE_TIPOS_TO_USUARIOS])
  @Get('tipos/add-tipo-to-usuario/:usuarioId/:tipoServicioCode')
  async addTipoServicioToUsuario(
    @Param('usuarioId') usuarioId: string,
    @Param('tipoServicioCode') tipoServicioCode: AfnTipoSerTecCode
  ) {
    try {
      return await this._usuarioTipoServicio.addTipoServicio(usuarioId, tipoServicioCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.MANAGE_TIPOS_TO_USUARIOS])
  @Get('tipos/remove-tipo-to-usuario/:usuarioId/:tipoServicioCode')
  async removeTipoServicioToUsuario(
    @Param('usuarioId') usuarioId: string,
    @Param('tipoServicioCode') tipoServicioCode: AfnTipoSerTecCode
  ) {
    try {
      return await this._usuarioTipoServicio.removeTipoServicio(usuarioId, tipoServicioCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
