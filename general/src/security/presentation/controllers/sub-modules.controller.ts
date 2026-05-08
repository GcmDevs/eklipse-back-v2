import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SubModulesCrudImpl } from '@gen/security/infrastructure/services';
import { SEC_AUTHORITIES } from '@authorities';
import { CreateSubModuleDto } from '../dtos';

@CommonGuards()
@ApiTags('Submodules')
@Controller('v1/sec/sub-modules')
export class SubModulesController {
  constructor(private _crud: SubModulesCrudImpl) {}

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.CREATE_AUTHORITIES])
  @Post()
  async create(@Body() payload: CreateSubModuleDto) {
    return await this._crud.create(payload);
  }
}
