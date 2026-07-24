import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UpdatePasswordImpl } from '@gen/security/infrastructure/services';
import { UpdatePasswordDto } from '../dtos';
import { CommonGuards } from '@common/presentation/decorators';

@ApiTags('Auth')
@CommonGuards()
@Controller('v1/sec/auth')
export class AuthTokReqController {
  constructor(private _updatePassword: UpdatePasswordImpl) {}

  @Post('update-password')
  public async updatePassword(@Body() payload: UpdatePasswordDto) {
    try {
      const response = await this._updatePassword.execute(payload.newPassword);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
