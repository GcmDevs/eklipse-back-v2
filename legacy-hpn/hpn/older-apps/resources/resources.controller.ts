import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { FetchDiagnosticoByFolioHandler, FetchSubgruposCamasHandler } from './handlers';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v30/hospitalizacion/resources')
export class ResourcesController {
  constructor(
    private _fetchDiagnosticoIdFolio: FetchDiagnosticoByFolioHandler,
    private _fetchSubgruposCamas: FetchSubgruposCamasHandler
  ) {}

  @Get('find-diagnostico-by-folio/:id')
  public async findDiagnosticoByFolio(@Param('id') id: number): Promise<any> {
    return this._fetchDiagnosticoIdFolio.execute(+id);
  }

  @Get('subgrupos-camas')
  public async fetchSubgruposCamas(): Promise<any> {
    return this._fetchSubgruposCamas.execute();
  }
}
