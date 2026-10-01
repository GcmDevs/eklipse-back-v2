import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { GcmContexts } from '@common/application/constants';
import { enumToString } from '@common/application/services';

export class LoginUserDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `Valid GcmContexts are: ${enumToString(GcmContexts)}` })
  context: GcmContexts;

  @IsString()
  username: string;

  @IsString()
  password: string;
}
