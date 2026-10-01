import { ensureArray } from '@common/application/services';
import {
  ComponenteSchema,
  EstructuraFormatoSchema,
  RespuestaComponente,
  SeccionSchema
} from 'apps/motor-formatos/domain';


export class SubmissionBuilder {

  static build(
    schema: EstructuraFormatoSchema,
    respuestas: Record<string, RespuestaComponente>,
  ): Record<string, unknown> {
    return {
      secciones: ensureArray(schema.secciones).map(sec =>
        SubmissionBuilder.fuseSeccion(sec, respuestas)
      ),
    };
  }

  private static fuseSeccion(
    seccion: SeccionSchema,
    respuestas: Record<string, RespuestaComponente>,
  ): Record<string, unknown> {
    return {
      key: seccion.key,
      orden: seccion.orden,
      nombre: seccion.nombre,
      origen: seccion.origen,
      seccionCatalogoId: seccion.seccionCatalogoId,
      componentes: ensureArray(seccion.componentes).map(comp =>
        SubmissionBuilder.fuseComponente(comp, respuestas)
      ),
    };
  }

  private static fuseComponente(
    comp: ComponenteSchema,
    respuestas: Record<string, RespuestaComponente>,
  ): Record<string, unknown> {
    return {
      ...(comp),
      respuesta: respuestas[comp.key] ?? null,
    };
  }
}