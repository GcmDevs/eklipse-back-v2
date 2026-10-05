import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { Body, Controller, Get, Post, Query, UnauthorizedException } from '@nestjs/common';
import { LoginTerceroImpl, LoginUserImpl } from '@gen/security/infrastructure/services';
import { GCM_CONTEXTS, GCM_CONTEXTS_VALUES } from '@common/domain/types';
import { LoginUserDto } from '../dtos';

@ApiTags('Auth')
@Controller('v1/sec/auth')
export class AuthController {
  constructor(
    private _loginUser: LoginUserImpl,
    private _loginTercero: LoginTerceroImpl
  ) {}

  @Get('contexts')
  public avalaibleContexts() {
    return GCM_CONTEXTS_VALUES.filter(el => [GCM_CONTEXTS.EKLIPSE].indexOf(el) < 0);
  }

  @Post('login')
  public async login(
    @Body() payload: LoginUserDto,
    @Query('fromMobile') fromMobile: boolean,
    @Query('expiredSuperFast') expiredSuperFast: boolean,
    @Query('nonEncrypted') nonEncrypted: boolean
  ) {
    try {
      const response = await this._loginUser.execute(
        payload,
        fromMobile,
        expiredSuperFast,
        nonEncrypted
      );
      return response;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('login-tercero')
  public async loginTerceros(
    @Body() payload: LoginUserDto,
    @Query('fromMobile') fromMobile: boolean,
    @Query('nonEncrypted') nonEncrypted: boolean
  ) {
    return this._loginTercero.execute(payload, fromMobile, nonEncrypted);
  }

  @CommonGuards()
  @Get('verify-credentials')
  public async verificarCredenciales() {
    return true;
  }
}
