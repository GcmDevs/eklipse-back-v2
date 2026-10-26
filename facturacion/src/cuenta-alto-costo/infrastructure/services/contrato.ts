import { createHash } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import {
  CAMPOS_CAC,
  DatosCac,
  BusquedaCacDto,
  GuardarCacDto,
} from '../../presentation/dtos/cac.dto';
import { DEFINICION_CAMPOS } from '../queries/campos';
import { SIGLAS_DOCUMENTO_CAC } from '../../presentation/dtos/tipos-documento';
import { CATALOGOS_CAC } from '../../presentation/dtos/catalogos-cac';
import { ActualizarPacienteCacDto } from '../../presentation/dtos/cac.dto';

export interface ConsultaPreparada {
  sql: string;
  parametros: (string | number | null)[];
}

export function prepararConsulta(
  sql: string,
  valores: Record<string, string | number | null>
): ConsultaPreparada {
  const nombres = [...new Set(sql.match(/@[A-Z][A-Z0-9_]*/g) ?? [])];
  const parametros = nombres.map(nombre => {
    const clave = nombre.slice(1);
    if (!Object.prototype.hasOwnProperty.call(valores, clave) || valores[clave] === undefined) {
      throw new BadRequestException('Falta un parámetro de la consulta');
    }
    return valores[clave];
  });
  const declaraciones = nombres
    .map((nombre, index) => `DECLARE ${nombre} nvarchar(max) = @${index};`)
    .join('\n');
  return { sql: `${declaraciones}\n${sql}`, parametros };
}

export function validarBusqueda(tipoDocumento: unknown, documento: unknown): BusquedaCacDto {
  const tipo = Number(tipoDocumento);
  if (
    !['string', 'number'].includes(typeof tipoDocumento) ||
    !/^\d{1,2}$/.test(String(tipoDocumento)) ||
    !Number.isInteger(tipo) ||
    !SIGLAS_DOCUMENTO_CAC[tipo] ||
    typeof documento !== 'string' ||
    !/^[A-Za-z0-9-]{1,20}$/.test(documento.trim())
  ) {
    throw new BadRequestException('Revisa el tipo y número de documento');
  }
  return { tipoDocumento: tipo, documento: documento.trim() };
}

export function validarRegistro(payload: GuardarCacDto): GuardarCacDto {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw new BadRequestException('Registro inválido');
  const body = payload;
  const busqueda = validarBusqueda(body.tipoDocumento, body.documento);
  if (
    Object.keys(body).some(
      clave => !['tipoDocumento', 'documento', 'datos', 'version'].includes(clave)
    )
  )
    throw new BadRequestException('Registro con propiedades desconocidas');
  if (!body.datos || typeof body.datos !== 'object' || Array.isArray(body.datos))
    throw new BadRequestException('Faltan los datos del registro');
  if (
    body.version !== null &&
    (typeof body.version !== 'string' || !/^[a-f0-9]{64}$/.test(body.version))
  )
    throw new BadRequestException('Versión del registro inválida');
  const entrada = body.datos;
  if (Object.keys(entrada).some(clave => !(CAMPOS_CAC as readonly string[]).includes(clave)))
    throw new BadRequestException('Registro con campos desconocidos');
  const datos = {} as DatosCac;
  for (const campo of CAMPOS_CAC) {
    const valor = entrada[campo];
    if (valor !== null && typeof valor !== 'string')
      throw new BadRequestException(`Valor inválido en ${campo}`);
    datos[campo] = typeof valor === 'string' ? valor.trim() || null : null;
    if (datos[campo]?.length > 4000)
      throw new BadRequestException(`Valor demasiado largo en ${campo}`);
  }
  if (
    datos.TIPDOCUSUARIO !== SIGLAS_DOCUMENTO_CAC[busqueda.tipoDocumento] ||
    datos.NUMDOCUSUARIO !== busqueda.documento
  )
    throw new BadRequestException('La identificación no coincide con el paciente');
  if (!/^[A-Za-z0-9.]{1,5}$/.test(datos.CODCIE10 ?? ''))
    throw new BadRequestException('Ingresa un código CIE-10 válido');
  if (!/^\d{1,2}$/.test(datos.IDETIPOTRATAMIENTO ?? ''))
    throw new BadRequestException('El tipo de tratamiento debe ser un código entre 0 y 99');
  for (const campo of DEFINICION_CAMPOS) {
    const valor = datos[campo.nombre];
    if (valor === null) continue;
    const opciones = CATALOGOS_CAC[campo.nombre];
    if (opciones) {
      if (!opciones.some(opcion => opcion.codigo === valor))
        throw new BadRequestException(`Selecciona una opción válida para ${campo.etiqueta}`);
      // El catálogo define los códigos válidos, incluidos 10–12 y 97–99 aunque
      // la longitud heredada del HTML/Excel fuera de un solo carácter.
      continue;
    }
    if ('longitudMaxima' in campo && valor.length > campo.longitudMaxima)
      throw new BadRequestException(`Revisa la longitud de ${campo.etiqueta}`);
    if (campo.tipo === 'number' && !/^-?\d+$/.test(valor))
      throw new BadRequestException(`Ingresa un código o número entero en ${campo.etiqueta}`);
    if (
      campo.tipo === 'date' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
        valor.startsWith('0000-') ||
        !Number.isFinite(Date.parse(valor)) ||
        new Date(valor).toISOString().slice(0, 10) !== valor)
    )
      throw new BadRequestException(
        `Fecha inválida en ${campo.etiqueta}. Formato AAAA-MM-DD. 1800-01-01 = Desconocida; 1845-01-01 = No aplica.`
      );
  }
  if (datos.ANTOTROCANCER === '1') {
    const obligatorios: readonly (keyof DatosCac)[] = [
      'ANTFECDXOTRO',
      'ANTNOMCANCER',
      'ANTCODCIE10',
    ];
    for (const campo of obligatorios) {
      if (datos[campo] === null)
        throw new BadRequestException(
          'Completa la fecha, el nombre y el código CIE-10 del cáncer antecedente'
        );
    }
  }
  return { ...busqueda, datos, version: body.version };
}

export function validarCodigoCie10(valor: unknown): string {
  if (typeof valor !== 'string' || !/^[A-Za-z0-9.]{1,5}$/.test(valor.trim()))
    throw new BadRequestException('Ingresa un código CIE-10 válido');
  return valor.trim();
}

export function validarActualizacionPaciente(
  payload: ActualizarPacienteCacDto
): ActualizarPacienteCacDto {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw new BadRequestException('Datos del paciente inválidos');
  const body = payload;
  const busqueda = validarBusqueda(body.tipoDocumento, body.documento);
  const texto = (
    clave: keyof ActualizarPacienteCacDto,
    maximo: number,
    requerido = false
  ): string | null => {
    if (body[clave] !== null && body[clave] !== undefined && typeof body[clave] !== 'string')
      throw new BadRequestException(`Valor inválido en ${clave}`);
    const valor = String(body[clave] ?? '').trim();
    if (requerido && !valor) throw new BadRequestException(`Completa ${clave}`);
    if (valor.length > maximo) throw new BadRequestException(`Revisa la longitud de ${clave}`);
    return valor || null;
  };
  const entero = (
    clave: keyof ActualizarPacienteCacDto,
    permitidos?: readonly number[]
  ): number => {
    const valor = Number(body[clave]);
    if (!Number.isInteger(valor) || valor <= 0 || (permitidos && !permitidos.includes(valor)))
      throw new BadRequestException(`Selecciona un valor válido en ${clave}`);
    return valor;
  };
  const fechaNacimiento = texto('fechaNacimiento', 10, true)!;
  const fechaAfiliacion = texto('fechaAfiliacion', 10, true)!;
  const validarFecha = (valor: string, etiqueta: string) => {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
      !Number.isFinite(Date.parse(valor)) ||
      new Date(valor).toISOString().slice(0, 10) !== valor
    )
      throw new BadRequestException(`Ingresa una ${etiqueta} válida en formato AAAA-MM-DD`);
  };
  validarFecha(fechaNacimiento, 'fecha de nacimiento');
  validarFecha(fechaAfiliacion, 'fecha de afiliación');
  return {
    ...busqueda,
    primerNombre: texto('primerNombre', 20, true)!,
    segundoNombre: texto('segundoNombre', 30),
    primerApellido: texto('primerApellido', 20, true)!,
    segundoApellido: texto('segundoApellido', 30),
    fechaNacimiento,
    fechaAfiliacion,
    sexoCodigo: entero('sexoCodigo', [1, 2, 3]),
    regimenCodigo: entero('regimenCodigo', [1, 2, 3, 4, 5, 6, 7, 8]),
    ocupacionId: entero('ocupacionId'),
    grupoPoblacionalId: entero('grupoPoblacionalId'),
    municipioId: entero('municipioId'),
    detalleContratoId: entero('detalleContratoId'),
    telefono: texto('telefono', 21, true)!,
  };
}

export function versionRegistro(datos: Record<string, unknown>): string {
  return createHash('sha256')
    .update(
      JSON.stringify(
        Object.keys(datos)
          .sort()
          .map(clave => [clave, datos[clave]])
      )
    )
    .digest('hex');
}
