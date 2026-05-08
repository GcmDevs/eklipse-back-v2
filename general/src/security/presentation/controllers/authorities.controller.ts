import { ApiTags } from '@nestjs/swagger';
import { Get, Controller, Param, Post, Body } from '@nestjs/common';
import {
  AuthoritiesCrudImpl,
  AuthoritiesServicesImpl,
} from '@gen/security/infrastructure/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SEC_AUTHORITIES } from '@authorities';
import { CreateAuthorityDto } from '../dtos';

@CommonGuards()
@ApiTags('Authorities')
@Controller('v1/sec/authorities')
export class AuthoritiesController {
  constructor(
    private _crud: AuthoritiesCrudImpl,
    private _services: AuthoritiesServicesImpl
  ) {}

  @Authorities([
    SEC_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES,
    SEC_AUTHORITIES.AUTHORITIES.CREATE_AUTHORITIES,
  ])
  @Get()
  async fetch() {
    return await this._crud.fetch();
  }

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.CREATE_AUTHORITIES])
  @Post()
  async create(@Body() payload: CreateAuthorityDto) {
    return await this._crud.create(payload);
  }

  @Get('my-authorities')
  public async fetchMyAuthorities() {
    return this._services.fetchMyAuthorities();
  }

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES])
  @Get('by-user/:id')
  public async fetchByUser(@Param('id') id: string) {
    return this._services.fetchByUser(id);
  }

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES])
  @Get('add-authority-to-user/:authorityId/:userId')
  async addAuthorityToUser(
    @Param('authorityId') authorityId: string,
    @Param('userId') userId: string
  ) {
    return this._services.addAuthorityToUser(authorityId, userId);
  }

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES])
  @Get('remove-authority-to-user/:authorityId/:userId')
  async removeAuthorityToUser(
    @Param('authorityId') authorityId: string,
    @Param('userId') userId: string
  ) {
    return this._services.removeAuthorityToUser(authorityId, userId);
  }

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES])
  @Get('add-authority-to-role/:authorityId/:roleId')
  async addAuthorityToRole(
    @Param('authorityId') authorityId: string,
    @Param('roleId') roleId: string
  ) {
    return this._services.addAuthorityToRole(authorityId, roleId);
  }

  @Authorities([SEC_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES])
  @Get('remove-authority-to-role/:authorityId/:roleId')
  async removeAuthorityToRole(
    @Param('authorityId') authorityId: string,
    @Param('roleId') roleId: string
  ) {
    return this._services.removeAuthorityToRole(authorityId, roleId);
  }

  @CommonGuards()
  @Get('user-data')
  public async() {
    return this._services.fetchUserData();
  }
}
