import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthenticatedAs, GcmContexts } from '@common/domain/types';
import { castDataServices } from '@common/application/services';

export class LoginUserDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  context: GcmContexts;

  @IsOptional()
  @IsEnum(AuthenticatedAs, { message: `${castDataServices.enumToString(AuthenticatedAs)}` })
  authenticatedAs: AuthenticatedAs;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
