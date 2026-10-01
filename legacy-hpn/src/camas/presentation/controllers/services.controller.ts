import { Get, Controller, BadRequestException } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { FetchCamasForHome } from '@hpn/camas/infrastructure/services';
import { CamaForHomeRes } from '@hpn/camas/infrastructure/responses';

@CommonGuards()
@ApiTags('Servicios')
@Controller('v1/hpn/camas')
export class CamaServicesController {
  constructor(private _fetchCamasForHome: FetchCamasForHome) {}

  @ApiResponse({ type: CamaForHomeRes, isArray: true })
  @Get('fetch-for-home')
  async fetch(): Promise<CamaForHomeRes[]> {
    try {
      return await this._fetchCamasForHome.execute();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
