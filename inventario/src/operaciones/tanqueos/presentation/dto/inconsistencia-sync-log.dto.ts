import { OptionalText, RequiredBoolean, RequiredEnum } from '@common/presentation/decorators';
import { ResultadoInconsistenciaResolucion } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';

export class ResolveInconsistenciaDto {
  @RequiredBoolean()
  contactoRealizado: boolean;

  @RequiredEnum(ResultadoInconsistenciaResolucion)
  resultado: ResultadoInconsistenciaResolucion;

  @OptionalText({ maxLength: 500 })
  notaResolucion?: string;

  @OptionalText({ maxLength: 500 })
  notaContacto?: string;
}
