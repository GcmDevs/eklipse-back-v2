import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, Query, UnauthorizedException } from '@nestjs/common';
import { LoginUserImpl } from '@gen/security/infrastructure/services';
import { LoginUserDto } from '../dtos';

@ApiTags('Auth')
@Controller('v1/sec/auth')
export class AuthController {
  constructor(private _loginUser: LoginUserImpl) {}

  @Post('login')
  public async login(
    @Body() payload: LoginUserDto,
    @Query('fromMobile') fromMobile: boolean,
    @Query('expiredSuperFast') expiredSuperFast: boolean
  ) {
    try {
      const response = await this._loginUser.execute(payload, fromMobile, expiredSuperFast);
      return response;
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }
}
