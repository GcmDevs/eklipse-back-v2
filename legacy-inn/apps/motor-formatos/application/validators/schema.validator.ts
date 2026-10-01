import { BadInputError } from '@common/domain/errors';
import { TipoComponente } from 'apps/motor-formatos/domain/enums';
import {
  ComponenteGrupoEjecucionSchema,
  ComponenteRangoSchema,
  ComponenteSchema,
  ComponenteTablaSchema,
  ComponenteTextoLibreSchema,
  EstructuraFormatoSchema,
} from 'apps/motor-formatos/domain/types/schema.types';
import {
  RespuestaComponente,
  RespuestaGrupoEjecucion,
  RespuestaRango,
  RespuestaTabla,
  RespuestaTextoLibre,
} from 'apps/motor-formatos/domain/types/submission.types';


export class SchemaValidator {

  static validate(
    schema:    EstructuraFormatoSchema,
    respuestas: Record<string, RespuestaComponente>,
  ): void {
    const errores: string[] = [];

    for (const seccion of schema.secciones) {
      for (const comp of seccion.componentes) {
        SchemaValidator.validarComponente(comp, respuestas, errores);
      }
    }

    if (errores.length > 0) {
      throw new BadInputError(
        `Errores de validación:\n${errores.map(e => `  - ${e}`).join('\n')}`
      );
    }
  }

  private static validarComponente(
    comp:      ComponenteSchema,
    respuestas: Record<string, RespuestaComponente>,
    errores:   string[],
  ): void {
    const resp = respuestas[comp.key];

    if (!resp) {
      errores.push(`Falta respuesta para "${comp.key}" (${comp.tipo})`);
      return;
    }

    if (resp.tipo !== comp.tipo) {
      errores.push(`"${comp.key}" espera tipo "${comp.tipo}", recibido "${resp.tipo}"`);
      return;
    }

    switch (comp.tipo) {
      case TipoComponente.GRUPO_EJECUCION:
        SchemaValidator.validarGrupo(comp, resp as RespuestaGrupoEjecucion, errores);
        break;
      case TipoComponente.TABLA:
        SchemaValidator.validarTabla(comp, resp as RespuestaTabla, errores);
        break;
      case TipoComponente.RANGO:
        SchemaValidator.validarRango(comp, resp as RespuestaRango, errores);
        break;
      case TipoComponente.TEXTO_LIBRE:
        SchemaValidator.validarTextoLibre(comp, resp as RespuestaTextoLibre, errores);
        break;
    }
  }

  private static validarGrupo(
    comp:   ComponenteGrupoEjecucionSchema,
    resp:   RespuestaGrupoEjecucion,
    errores: string[],
  ): void {
    for (const item of comp.items) {
      const itemResp = resp.items[item.key];
      if (itemResp == null) {
        errores.push(`Falta respuesta para ítem "${item.key}" en grupo "${comp.key}"`);
        continue;
      }
      if (typeof itemResp.valor !== 'boolean') {
        errores.push(`Ítem "${item.key}" debe ser boolean`);
      }
    }
  }

  private static validarTabla(
    comp:   ComponenteTablaSchema,
    resp:   RespuestaTabla,
    errores: string[],
  ): void {
    if (!resp.filas?.length) {
      errores.push(`Tabla "${comp.key}" no tiene filas`);
      return;
    }
    if (resp.filas.length !== comp.filasEsperadas) {
      errores.push(
        `Tabla "${comp.key}" espera ${comp.filasEsperadas} filas, recibidas ${resp.filas.length}`
      );
    }
    const colKeys = new Set(comp.columnas.map(c => c.key));
    resp.filas.forEach((fila, i) => {
      for (const col of comp.columnas) {
        if (!(col.key in fila)) {
          errores.push(`Tabla "${comp.key}" fila ${i + 1}: falta columna "${col.key}"`);
        }
      }
      for (const k of Object.keys(fila)) {
        if (!colKeys.has(k)) {
          errores.push(`Tabla "${comp.key}" fila ${i + 1}: columna desconocida "${k}"`);
        }
      }
    });
  }

  private static validarRango(
    comp:   ComponenteRangoSchema,
    resp:   RespuestaRango,
    errores: string[],
  ): void {
    if (typeof resp.valor !== 'number') {
      errores.push(`Rango "${comp.key}" debe ser número`);
      return;
    }
    if (resp.valor < comp.min || resp.valor > comp.max) {
      errores.push(
        `Rango "${comp.key}": valor ${resp.valor} fuera de [${comp.min}, ${comp.max}]`
      );
    }
  }

  private static validarTextoLibre(
    comp:   ComponenteTextoLibreSchema,
    resp:   RespuestaTextoLibre,
    errores: string[],
  ): void {
    if (comp.requerido && !resp.valor?.trim()) {
      errores.push(`Campo de texto "${comp.key}" es requerido`);
    }
    if (comp.maxLength && resp.valor && resp.valor.length > comp.maxLength) {
      errores.push(`Campo "${comp.key}" excede ${comp.maxLength} caracteres`);
    }
  }
}