import { OptionalText } from '@common/presentation/decorators';
import { LimitDto } from '@common/presentation/dto';

export class FilterParteDto extends LimitDto {
  @OptionalText()
  parte?: string;
}
