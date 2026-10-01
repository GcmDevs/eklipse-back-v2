import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SuministroPacienteCrudSource } from '@inn/docs/sumpac/infrastructure/repositories';
import { CODIGOS_MEZCLAS } from '../../application/constants';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('V1 - Documentos (Suministro a pacientes)')
@CommonGuards()
@Controller('v1/inn/doc/sumpac')
export class SuministroPacienteCrudController {
  constructor(private _crud: SuministroPacienteCrudSource) {}

  @Get()
  public async fetch(
    @Query('start') start: Date,
    @Query('end') end: Date,
    @Query('pattern') pattern: string
  ) {
    try {
      if (start && end) {
        start = new Date(`${start}:00:00:00`);
        end = new Date(`${end}:23:59:59`);
      } else {
        const now = new Date().toISOString().split('T')[0];
        start = new Date(`${now}:00:00:00`);
        end = new Date(`${now}:23:59:59`);
      }

      const result = await this._crud.fetch({
        start,
        end,
        incluyeAnulados: false,
        codigos: CODIGOS_MEZCLAS.map(el => "'" + el + "'"),
        customCond1: true,
        pattern,
      });
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
