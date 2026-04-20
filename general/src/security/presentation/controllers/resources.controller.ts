import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ResourcesImpl } from '@gen/security/infrastructure/services';
import { CommonGuards } from '@common/presentation/decorators';

@CommonGuards()
@ApiTags('Resources')
@Controller('v1/sec/resources')
export class ResourcesController {
  constructor(private _resources: ResourcesImpl) {}

  @Get('active-users')
  async fetchActiveUsers() {
    try {
      const users = await this._resources.fetchActiveUsers();
      return users;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('roles')
  async fetchRoles() {
    try {
      const roles = await this._resources.fetchRoles();
      return roles;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('centers')
  async fetchCenters() {
    try {
      const centers = await this._resources.fetchCenters();
      return centers;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('auth-data')
  async fetchMyAuthData() {
    try {
      const data = await this._resources.fetchMyAuthData();
      return data;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
