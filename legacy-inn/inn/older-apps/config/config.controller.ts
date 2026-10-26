import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiTags } from '@nestjs/swagger';
import { CONTEXTS_DESCRIPTION } from '@inn/old/common/application/constants';
import { CommonGuards } from '@common/presentation/decorators';

@ApiTags('V1/V2/V3')
@Controller('v1/config')
export class ConfigController {
  constructor(private readonly _config: ConfigService) {}

  @CommonGuards()
  @Get('centros')
  public async fetchCentros() {
    try {
      return await this._config.fetchCentros();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @CommonGuards()
  @Get('all-centros')
  public async fetchAllCentros() {
    try {
      return await this._config.fetchAllCentros();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @CommonGuards()
  @Get('my-authorities')
  public async fetchMyAuthorities() {
    try {
      return await this._config.fetchMyAuthorities();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('contexts')
  public async fetchContexts() {
    return CONTEXTS_DESCRIPTION;
  }
}
