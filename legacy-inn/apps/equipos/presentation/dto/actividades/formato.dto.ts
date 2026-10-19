import { OptionalEnum } from '@common/presentation/decorators';
import { FilterSearchPaginatedDto } from '@common/presentation/dto';
import { ModoFormato } from '@equipos/domain/enums';

export class FilterFormatoDto extends FilterSearchPaginatedDto {
  @OptionalEnum(ModoFormato)
  modo?: ModoFormato;
}
