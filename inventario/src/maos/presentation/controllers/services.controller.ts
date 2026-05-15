import { Get } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { FetchDataImpl } from '../../infrastructure/services';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LineaRes } from '@inn/maos/application/responses';

@ApiTags('Materiales de osteosintesis')
@Controller('v1/inn/maos')
export class MAOSServicesController {
  constructor(private _fetchData: FetchDataImpl) {}

  @ApiResponse({ type: LineaRes, isArray: true })
  @Get('fetch-data')
  fetchData() {
    try {
      return this._fetchData.execute();
    } catch (error) {
      return error.message;
    }
  }
}
