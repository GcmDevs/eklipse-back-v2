import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FindByPatternImpl as FetchByPatternImpl } from '../../infrastructure/services';

@ApiTags('V1 - Resources (Activos)')
@CommonGuards()
@Controller('v1/inn/resources')
export class FetchByPatternController {
  constructor(private _findDocImpl: FetchByPatternImpl) {}

  @Get('by-pattern/doc')
  public findByPatternDocu(@Query('pattern') pattern: string) {
    try {
      return this._findDocImpl.fetchByPatternDocActivo(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-pattern/accesorio')
  public find(@Query('pattern') pattern: string) {
    try {
      return this._findDocImpl.fetchByPatternAccesorio(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
