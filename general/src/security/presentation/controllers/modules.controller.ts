import { ApiTags } from '@nestjs/swagger';
import { Get, Controller, Post, Body } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ModulesCrudImpl } from '@gen/security/infrastructure/services';
import { SEC_AUTHORITIES } from '@authorities';
import { CreateModuleDto } from '../dtos';

@CommonGuards()
@ApiTags('Modules')
@Controller('v1/sec/modules')
export class ModulesController {
  constructor(private _crud: ModulesCrudImpl) {}

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.CREATE_AUTHORITIES])
  @Get()
  async fetch() {
    return await this._crud.fetch();
  }

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.CREATE_AUTHORITIES])
  @Post()
  async create(@Body() payload: CreateModuleDto) {
    return await this._crud.create(payload);
  }
}
