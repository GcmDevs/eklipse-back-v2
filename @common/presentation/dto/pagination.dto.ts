import { PaginationConstants } from '@common/application/constants';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class LimitDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El atributo limit debe ser un número.' })
  limit?: number = PaginationConstants.DEFAULT_PAGE_LIMIT;
}

export class PaginationDto extends LimitDto {
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El atributo page debe ser un número.' })
  page?: number = PaginationConstants.DEFAULT_PAGE;
}
