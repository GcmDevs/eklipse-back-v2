import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiTags } from '@nestjs/swagger';
import { CONTEXTS_DESCRIPTION } from '@sln/old/common/application/constants';
import { CommonGuards } from '@sln/old/common/presentation/decorators';
import { GcmContexts } from '@common/application/constants';
import { ENVIRONMENTS } from 'src/app.environments';

@ApiTags('v1 - Configuración inicial')
@Controller('v1/config')
export class ConfigController {
  constructor(private readonly _config: ConfigService) {}

  @CommonGuards()
  @Get('centros')
  public async fetchCentros() {
    try {
      return await this._config.fetchCentros();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @CommonGuards()
  @Get('all-centros')
  public async fetchAllCentros() {
    try {
      return await this._config.fetchAllCentros();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @CommonGuards()
  @Get('my-authorities')
  public async fetchMyAuthorities() {
    try {
      return await this._config.fetchMyAuthorities();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('contexts')
  public async fetchContexts() {
    return ENVIRONMENTS.production
      ? CONTEXTS_DESCRIPTION.filter(el => el.value !== GcmContexts.DEVELOPMENT)
      : CONTEXTS_DESCRIPTION;
  }
}
