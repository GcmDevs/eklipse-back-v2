import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { DevolucionSumPacImpl } from '../../infrastructure/services';
import { DevolucionSumPacDto } from '../dtos';
import { motivoDevolucionSumPacTypeFactory } from '../../domain/types';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('V1 - Documentos (Suministro a pacientes)')
@CommonGuards()
@Controller('v1/inn/doc/sumpac')
export class DevolucionSumPacController {
  constructor(private _devSumPac: DevolucionSumPacImpl) {}

  @Post('complementar-devolucion')
  public async create(@Body() payload: DevolucionSumPacDto) {
    try {
      if (!motivoDevolucionSumPacTypeFactory(payload.motivoCode)) {
        throw new Error('El motivo no es valido');
      }
      const result = await this._devSumPac.create(payload);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
