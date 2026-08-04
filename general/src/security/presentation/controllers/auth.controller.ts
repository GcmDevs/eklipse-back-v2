import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, Query, UnauthorizedException } from '@nestjs/common';
import { LoginUserImpl } from '@gen/security/infrastructure/services';
import { LoginUserDto } from '../dtos';
import { AuthenticatedAs } from '@common/domain/types';

@ApiTags('Auth')
@Controller('v1/sec/auth')
export class AuthController {
  constructor(private _loginUser: LoginUserImpl) {}

  @Post('login')
  public async login(
    @Body() body: LoginUserDto,
    @Query('fromMobile') fromMobile: boolean,
    @Query('expiredSuperFast') expiredSuperFast: boolean
  ) {
    try {
      if (body.authenticatedAs === undefined) body.authenticatedAs = AuthenticatedAs.USUARIO;
      const response = await this._loginUser.execute(body, fromMobile, expiredSuperFast);
      return response;
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }
}
