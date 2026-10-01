import { Get, Param, Query } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubgroupBedsService } from './subgroup-beds.service';
import { CommonGuards } from '@common/presentation/decorators';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/subgroup')
export class SubgroupBedsController {
  constructor(private readonly subgroupService: SubgroupBedsService) {}

  @Get()
  async getAllSubgroup(@Query('center') center?: number) {
    const subgroup = await this.subgroupService.getItems(+center);
    return subgroup;
  }

  @Get(':id')
  async getOneSubgroup(@Param('id') id: number) {
    const subgroup = await this.subgroupService.getItem(+id);
    return subgroup;
  }
}
