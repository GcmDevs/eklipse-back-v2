import { IsString, MaxLength } from 'class-validator';

export * from './login-user.dto';

export class CreateModuleDto {
  @IsString()
  @MaxLength(100)
  name: string;
}

export class CreateSubModuleDto {
  @IsString()
  name: string;

  @IsString()
  @MaxLength(100)
  moduleId: string;
}

export class CreateAuthorityDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  moduleId: string;

  @IsString()
  subModuleId: string;
}
