import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CensusBedsService } from './census-beds.service';
import { CommonGuards } from '@common/presentation/decorators';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/censo-camas')
export class CensusBedsController {
  constructor(private readonly censusBedsService: CensusBedsService) {}

  @Get()
  async getCensusBeds() {
    return await this.censusBedsService.getCensoCamas();
  }

  @Get('grupo/:grupo')
  async getGroupCensusBeds(@Param('grupo') grupo: string) {
    return await this.censusBedsService.getGroupCensoCamas(grupo);
  }

  @Get('list')
  async getBeds() {
    return await this.censusBedsService.getCamas();
  }

  @Get('all-camas')
  async getAllCamas() {
    return await this.censusBedsService.getAllCamas();
  }
}
