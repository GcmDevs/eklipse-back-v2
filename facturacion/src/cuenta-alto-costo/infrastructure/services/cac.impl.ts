import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services/base.source';
import { DataSource, QueryRunner } from 'typeorm';
import {
  CAMPOS_CAC,
  BusquedaCacDto,
  ConsultaCacResponse,
  DatosCac,
  GuardadoCacResponse,
  GuardarCacDto,
  RegistroCacResponse,
  RecursosPacienteCacResponse,
  ActualizarPacienteCacDto,
  ActualizarPacienteCacResponse,
  CrearPacienteCacDto,
  CrearPacienteCacResponse,
  CatalogoOncologicoResponse,
} from '../../presentation/dtos/cac.dto';
import { DIAGNOSTICOS_ONCOLOGICOS_SQL } from '../queries/diagnosticos';
import { clasificarCancer, normalizarCie10 } from './clasificacion-cancer';
import { edadAlDiagnostico } from './edad-diagnostico';
import { COMPLETAR_TRATAMIENTO_SQL } from '../queries/completar-tratamiento';
import { CONSULTAS_CAC, REGISTRO_PACIENTE_SQL } from '../queries/cac.queries';
import { PACIENTE_CAC_SQL } from '../queries/paciente';
import {
  ACTUALIZAR_PACIENTE_SQL,
  ACTUALIZAR_TELEFONO_SQL,
  BLOQUEAR_PACIENTE_GEN_SQL,
  BLOQUEAR_IDENTIDAD_CAC_SQL,
  BLOQUEAR_IDENTIDAD_PACIENTE_SQL,
  BLOQUEAR_REGISTRO_SQL,
  CREAR_PACIENTE_SQL,
  CREAR_TELEFONO_SQL,
  EXISTENCIA_PACIENTE_SQL,
  RECURSOS_PACIENTE_SQL,
  TELEFONO_PRINCIPAL_SQL,
} from '../queries/busqueda';
import { pacienteCacFactory } from '../factories/paciente.factory';
import {
  prepararConsulta,
  validarBusqueda,
  validarCodigoCie10,
  validarActualizacionPaciente,
  validarRegistro,
  versionRegistro,
} from './contrato';
import { SIGLAS_DOCUMENTO_CAC } from '../../presentation/dtos/tipos-documento';
import {
  FiltrosListadoCac,
  ListadoCacResponse,
  RegistroListadoCac,
} from '../../presentation/dtos/listado.dto';
import { prepararListadoCac } from '../queries/listado';
import { prepararExportacionCac } from '../queries/exportar';
import { FilaExportacionCac, generarExcelCac } from './excel-cac';
import { ExcelCacResponse } from '../../presentation/dtos/excel.dto';
import { SLN_AUTHORITIES } from '@inn/authorities';
import { ADMIN_AUTHORITY } from '@common/application/constants';

@Injectable()
export class CuentaAltoCostoImpl extends BaseSource {
  private readonly logger = new Logger(CuentaAltoCostoImpl.name);
  public async exportarExcel(filtros: FiltrosListadoCac): Promise<ExcelCacResponse> {
    const consulta = prepararExportacionCac(filtros);
    let filas: FilaExportacionCac[];
    try {
      filas = await this.conn.query(consulta.sql, consulta.parametros);
    } catch {
      throw new BadRequestException('No fue posible consultar los registros para exportar.');
    }
    try {
      return await generarExcelCac(filas);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'No fue posible generar el Excel.'
      );
    }
  }

  public async listar(filtros: FiltrosListadoCac): Promise<ListadoCacResponse> {
    const consulta = prepararListadoCac(filtros);
    try {
      const [totales, registros]: [ListadoCacResponse['resumen'][], RegistroListadoCac[]] =
        await Promise.all([
          this.conn.query(consulta.resumenSql, consulta.parametros),
          this.conn.query(consulta.registrosSql, [
            ...consulta.parametros,
            (consulta.pagina - 1) * consulta.tamano,
            consulta.tamano,
          ]),
        ]);
      return {
        registros,
        resumen: totales[0] ?? { registros: 0, pacientes: 0, pendientes: 0 },
        pagina: consulta.pagina,
        tamano: consulta.tamano,
      };
    } catch {
      throw new BadRequestException('No fue posible cargar el listado CAC. Intenta nuevamente.');
    }
  }

  public async diagnosticosOncologicos(): Promise<CatalogoOncologicoResponse> {
    const inicio = Date.now();
    this.logger.log('Catálogo CIE-10: iniciando consulta oncológica en GENDIAGNO.');
    try {
      const filas: {
        DIACODIGO: string;
        DIANOMBRE: string;
        DIAGTIPCANCER: number | null;
      }[] = await this.conn.query(DIAGNOSTICOS_ONCOLOGICOS_SQL);
      this.logger.log(
        `Catálogo CIE-10: consulta completada, ${filas.length} diagnósticos en ${Date.now() - inicio} ms.`
      );
      return {
        diagnosticos: filas
          .map(fila => ({
            codigo: String(fila.DIACODIGO).trim(),
            nombre: String(fila.DIANOMBRE ?? '').trim(),
            tipoCancer: fila.DIAGTIPCANCER == null ? null : Number(fila.DIAGTIPCANCER),
          }))
          .sort((a, b) => a.codigo.localeCompare(b.codigo)),
      };
    } catch (error) {
      this.logger.error(
        `Catálogo CIE-10: falló la consulta después de ${Date.now() - inicio} ms.`,
        error instanceof Error ? error.stack : String(error)
      );
      throw new BadRequestException('No fue posible cargar los diagnósticos oncológicos.');
    }
  }

  public async recursosPaciente(): Promise<RecursosPacienteCacResponse> {
    const entradas = await Promise.all(
      Object.entries(RECURSOS_PACIENTE_SQL).map(async ([clave, sql]) => [
        clave,
        await this.conn.query(sql),
      ])
    );
    return Object.fromEntries(entradas) as unknown as RecursosPacienteCacResponse;
  }

  public async consultarAutorizado(
    tipoDocumento: number,
    documento: string,
    codigoCie10?: string
  ): Promise<ConsultaCacResponse> {
    const puedeGestionar = await this.hasAnyAuthority([
      ADMIN_AUTHORITY, SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR,
    ]);
    return this.consultar(tipoDocumento, documento, codigoCie10, !puedeGestionar);
  }

  public async consultar(
    tipoDocumento: number,
    documento: string,
    codigoCie10?: string,
    soloExistentes = false
  ): Promise<ConsultaCacResponse> {
    const busqueda = validarBusqueda(tipoDocumento, documento);
    const codigo = codigoCie10 === undefined ? undefined : validarCodigoCie10(codigoCie10);
    try {
      const listado = prepararConsulta(REGISTRO_PACIENTE_SQL, {
        TIPDOCUSUARIO: SIGLAS_DOCUMENTO_CAC[busqueda.tipoDocumento],
        NUMDOCUSUARIO: busqueda.documento,
      });
      const maestros: Record<string, unknown>[] = await this.conn.query(
        listado.sql,
        listado.parametros
      );
      const diagnosticos = maestros
        .map(fila => ({
          codigoCie10: String(fila.CODCIE10 ?? '').trim(),
          tipoTratamiento:
            fila.IDETIPOTRATAMIENTO == null ? null : String(fila.IDETIPOTRATAMIENTO).trim(),
        }))
        .sort((a, b) => a.codigoCie10.localeCompare(b.codigoCie10));
      const codigos = diagnosticos.map(item => item.codigoCie10.toUpperCase());
      if (new Set(codigos).size !== codigos.length)
        throw new ConflictException(
          'Hay registros CAC duplicados para el mismo documento y CIE-10. Revisa los duplicados antes de continuar.'
        );
      if (soloExistentes && (!diagnosticos.length ||
        (codigo !== undefined && !codigos.includes(codigo.toUpperCase())))) {
        return {
          paciente: null,
          registro: null,
          diagnosticos,
          aviso: 'El permiso Ver informes solo permite consultar registros CAC ya creados.',
        };
      }
      const existencia = prepararConsulta(EXISTENCIA_PACIENTE_SQL, {
        PACTIPDOC: busqueda.tipoDocumento,
        PACNUMDOC: busqueda.documento,
      });
      const basicos: Record<string, unknown>[] = await this.conn.query(
        existencia.sql,
        existencia.parametros
      );
      if (basicos.length > 1)
        throw new ConflictException(
          'Hay varios pacientes en GENPACIEN con el mismo tipo y número de documento.'
        );
      if (!basicos.length)
        return {
          paciente: null,
          registro: null,
          diagnosticos,
          aviso: diagnosticos.length
            ? 'Existen registros CAC, pero no se encontró el paciente en GENPACIEN. Revisa su identificación.'
            : 'No se encontró el paciente en GENPACIEN. La creación de pacientes nuevos estará disponible en un próximo paso.',
        };
      const consulta = prepararConsulta(PACIENTE_CAC_SQL, {
        PACTIPDOC: busqueda.tipoDocumento,
        PACNUMDOC: busqueda.documento,
      });
      const pacientes: Record<string, unknown>[] = await this.conn.query(
        consulta.sql,
        consulta.parametros
      );
      if (pacientes.length > 1)
        throw new ConflictException(
          'La consulta devuelve varios resultados para este paciente. Revisa sus datos en el sistema de origen.'
        );
      // La consulta completa puede omitir un paciente por sus joins de afiliación o teléfono.
      const fila = {
        ...basicos[0],
        ...(pacientes[0] ?? {
          ...basicos[0],
          TIPO_DOC_PAC: SIGLAS_DOCUMENTO_CAC[busqueda.tipoDocumento],
          'Fecha de nacimiento': basicos[0].GPAFECNAC,
          sexo:
            ['Ninguno', 'Masculino', 'Femenino', 'Indefinido'][Number(basicos[0].GPASEXPAC)] ?? '',
          'Régimen de afiliación AL SGSSS':
            [
              'Ninguno',
              'Contributivo',
              'Subsidiado',
              'Vinculado',
              'Particular',
              'Otro',
              'Desplazado contributivo',
              'Desplazado subsidiado',
              'Desplazado no asegurado',
            ][Number(basicos[0].GPATIPPAC)] ?? '',
        }),
      };
      const registro =
        codigo === undefined ? null : await this.cargarRegistro(this.conn, busqueda, codigo);
      return {
        paciente: pacienteCacFactory(fila, busqueda),
        registro,
        diagnosticos,
        aviso:
          codigo !== undefined && !registro
            ? 'No se encontró un registro CAC para el CIE-10 seleccionado. Vuelve a consultar los diagnósticos.'
            : !pacientes.length
              ? 'Paciente encontrado. Los datos de afiliación o contacto están incompletos en el sistema de origen.'
              : '',
      };
    } catch (error: unknown) {
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('No fue posible consultar los datos CAC. Intenta nuevamente.');
    }
  }

  public async guardar(payload: GuardarCacDto): Promise<GuardadoCacResponse> {
    const dto = validarRegistro(payload);
    // Validación previa a la transacción, conservando la consulta de paciente suministrada.
    const consulta = await this.consultar(dto.tipoDocumento, dto.documento);
    if (!consulta.paciente) throw new BadRequestException(consulta.aviso);
    const catalogo = await this.diagnosticosOncologicos();
    const diagnosticos = catalogo.diagnosticos.filter(
      item => normalizarCie10(item.codigo) === normalizarCie10(dto.datos.CODCIE10!)
    );
    if (diagnosticos.length !== 1)
      throw new BadRequestException(
        diagnosticos.length === 0
          ? `Código CIE-10 «${dto.datos.CODCIE10}»: no está disponible en el catálogo oncológico. Solicita la revisión de este código antes de guardar.`
          : `Código CIE-10 «${dto.datos.CODCIE10}»: aparece repetido en el catálogo oncológico. Solicita la revisión de los duplicados antes de guardar.`
      );
    // Los registros nuevos guardan el código del catálogo; las llaves existentes se conservan.
    if (dto.version === null) dto.datos.CODCIE10 = diagnosticos[0].codigo;
    dto.datos.NOMNEOPLASIA = normalizarCie10(dto.datos.CODCIE10!);
    if (dto.datos.NOMNEOPLASIA.length > 4)
      throw new BadRequestException('El código CIE-10 supera la capacidad de Nombre Neoplasia.');
    const clasificacion = clasificarCancer(dto.datos.CODCIE10!, consulta.paciente.fechaNacimiento);
    if (clasificacion.codigo === null)
      throw new BadRequestException(
        'Completa una fecha de nacimiento válida del paciente para clasificar este CIE-10.'
      );
    dto.datos.CANPRIORIZADO = String(clasificacion.codigo);
    try {
      await this.qr.connect();
      await this.qr.startTransaction('SERIALIZABLE');
      const actual = await this.cargarRegistro(this.qr, dto, dto.datos.CODCIE10!, true);
      if ((actual?.version ?? null) !== dto.version)
        throw new ConflictException(
          'El registro cambió desde que lo abriste. Vuelve a consultar antes de guardar.'
        );
      const fechaInformeDefinida = !!actual?.datos.FECINFORMEHISTO?.trim();
      if (fechaInformeDefinida && actual.datos.FECINFORMEHISTO !== dto.datos.FECINFORMEHISTO)
        throw new BadRequestException(
          'La fecha del informe histopatológico queda definida una vez diligenciada y guardada.'
        );
      if (fechaInformeDefinida && actual.datos.EDADDX?.trim()) {
        if (actual.datos.EDADDX !== dto.datos.EDADDX)
          throw new BadRequestException(
            'La edad al diagnóstico queda definida una vez calculada y guardada.'
          );
      } else {
        const edad = edadAlDiagnostico(consulta.paciente.fechaNacimiento, dto.datos.FECINFORMEHISTO);
        if (
          dto.datos.FECINFORMEHISTO &&
          !['1800-01-01', '1845-01-01'].includes(dto.datos.FECINFORMEHISTO) &&
          edad === null
        )
          throw new BadRequestException(
            'La fecha del informe requiere una fecha de nacimiento conocida y no puede ser anterior al nacimiento.'
          );
        dto.datos.EDADDX = edad === null ? null : String(edad);
      }
      if (
        actual &&
        (actual.datos.CODCIE10 !== dto.datos.CODCIE10 ||
          (!!actual.datos.IDETIPOTRATAMIENTO?.trim() &&
            actual.datos.IDETIPOTRATAMIENTO !== dto.datos.IDETIPOTRATAMIENTO))
      ) {
        throw new BadRequestException(
          'El diagnóstico y el tipo de tratamiento ya diligenciado quedan definidos al guardar el registro'
        );
      }
      if (actual && !actual.datos.IDETIPOTRATAMIENTO?.trim()) {
        const completar = prepararConsulta(COMPLETAR_TRATAMIENTO_SQL, dto.datos);
        await this.qr.query(completar.sql, completar.parametros);
      }
      for (const seccion of CONSULTAS_CAC) {
        const lectura = prepararConsulta(seccion.select, dto.datos);
        const filas: Record<string, unknown>[] = await this.qr.query(
          lectura.sql,
          lectura.parametros
        );
        if (filas.length > 1)
          throw new ConflictException(
            'Hay registros duplicados en una sección CAC. No se realizaron cambios.'
          );
        const escritura = prepararConsulta(
          filas.length ? seccion.update : seccion.insert,
          dto.datos
        );
        await this.qr.query(escritura.sql, escritura.parametros);
      }
      const registro = await this.cargarRegistro(this.qr, dto, dto.datos.CODCIE10!);
      if (!registro) throw new BadRequestException('No fue posible verificar el registro guardado');
      // No confirmar éxito si la BD ignora o transforma un cambio inesperadamente.
      for (const campo of CAMPOS_CAC) {
        if (registro.datos[campo] !== dto.datos[campo])
          throw new BadRequestException(
            `No se pudo conservar el valor de ${campo}. No se realizaron cambios.`
          );
      }
      await this.qr.commitTransaction();
      return { exitoso: true, mensaje: 'Registro CAC guardado correctamente', registro };
    } catch (error: unknown) {
      if (this.qr.isTransactionActive) await this.qr.rollbackTransaction();
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'No se pudo guardar el registro. Revisa los valores y vuelve a intentar.'
      );
    } finally {
      await this.qr.release();
    }
  }

  public async actualizarPaciente(
    payload: ActualizarPacienteCacDto
  ): Promise<ActualizarPacienteCacResponse> {
    const dto = validarActualizacionPaciente(payload);
    const consultaActual = await this.consultar(dto.tipoDocumento, dto.documento);
    if (!consultaActual.paciente) throw new BadRequestException(consultaActual.aviso);
    await this.validarRecursosPaciente(dto);
    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      const valores = {
        OID: consultaActual.paciente.id,
        PACTIPDOC: dto.tipoDocumento,
        PACNUMDOC: dto.documento,
        PACPRINOM: dto.primerNombre,
        PACSEGNOM: dto.segundoNombre,
        PACPRIAPE: dto.primerApellido,
        PACSEGAPE: dto.segundoApellido,
        GPAFECNAC: dto.fechaNacimiento,
        GEFEAFEAPB: dto.fechaAfiliacion,
        GPASEXPAC: dto.sexoCodigo,
        GPATIPPAC: dto.regimenCodigo,
        GENOCUPACION: dto.ocupacionId,
        GENPOBESP: dto.grupoPoblacionalId,
        DGNMUNICIPIO: dto.municipioId,
        GENDETCON: dto.detalleContratoId,
      };
      const bloqueo = prepararConsulta(BLOQUEAR_PACIENTE_GEN_SQL, valores);
      const bloqueados: Record<string, unknown>[] = await this.qr.query(
        bloqueo.sql,
        bloqueo.parametros
      );
      if (bloqueados.length !== 1)
        throw new ConflictException(
          'El paciente cambió o dejó de estar disponible. Vuelve a consultarlo.'
        );
      const actualizacion = prepararConsulta(ACTUALIZAR_PACIENTE_SQL, valores);
      await this.qr.query(actualizacion.sql, actualizacion.parametros);
      const telefono = prepararConsulta(TELEFONO_PRINCIPAL_SQL, {
        GENPACIEN: consultaActual.paciente.id,
      });
      const telefonos: Record<string, unknown>[] = await this.qr.query(
        telefono.sql,
        telefono.parametros
      );
      if (telefonos.length > 1)
        throw new ConflictException('El paciente tiene más de un teléfono principal');
      const telefonoSql = telefonos.length ? ACTUALIZAR_TELEFONO_SQL : CREAR_TELEFONO_SQL;
      const escrituraTelefono = prepararConsulta(telefonoSql, {
        OID: telefonos[0]?.OID as number | undefined,
        GENPACIEN: consultaActual.paciente.id,
        PACTELEFONO: dto.telefono,
      });
      await this.qr.query(escrituraTelefono.sql, escrituraTelefono.parametros);
      await this.qr.commitTransaction();
    } catch (error: unknown) {
      if (this.qr.isTransactionActive) await this.qr.rollbackTransaction();
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('No fue posible actualizar los datos del paciente');
    } finally {
      await this.qr.release();
    }
    const actualizado = await this.consultar(dto.tipoDocumento, dto.documento);
    if (!actualizado.paciente)
      throw new BadRequestException('No fue posible verificar el paciente actualizado');
    return {
      exitoso: true,
      mensaje: 'Datos del paciente actualizados correctamente',
      paciente: actualizado.paciente,
    };
  }

  public async crearPaciente(payload: CrearPacienteCacDto): Promise<CrearPacienteCacResponse> {
    const dto = validarActualizacionPaciente(payload);
    const consultaActual = await this.consultar(dto.tipoDocumento, dto.documento);
    if (consultaActual.paciente)
      throw new ConflictException('El paciente ya existe en GENPACIEN. Vuelve a consultarlo.');
    if (consultaActual.diagnosticos.length)
      throw new ConflictException(
        'Ya existen registros CAC para esta identificación. Revisa el paciente antes de crearlo.'
      );
    await this.validarRecursosPaciente(dto);
    const valores = {
      PACTIPDOC: dto.tipoDocumento,
      PACNUMDOC: dto.documento,
      TIPDOCUSUARIO: SIGLAS_DOCUMENTO_CAC[dto.tipoDocumento],
      NUMDOCUSUARIO: dto.documento,
      PACPRINOM: dto.primerNombre,
      PACSEGNOM: dto.segundoNombre,
      PACPRIAPE: dto.primerApellido,
      PACSEGAPE: dto.segundoApellido,
      GPAFECNAC: dto.fechaNacimiento,
      GEFEAFEAPB: dto.fechaAfiliacion,
      GPASEXPAC: dto.sexoCodigo,
      GPATIPPAC: dto.regimenCodigo,
      GENOCUPACION: dto.ocupacionId,
      GENPOBESP: dto.grupoPoblacionalId,
      DGNMUNICIPIO: dto.municipioId,
      GENDETCON: dto.detalleContratoId,
    };
    try {
      await this.qr.connect();
      await this.qr.startTransaction('SERIALIZABLE');
      const bloqueoPaciente = prepararConsulta(BLOQUEAR_IDENTIDAD_PACIENTE_SQL, valores);
      const pacientes: Record<string, unknown>[] = await this.qr.query(
        bloqueoPaciente.sql,
        bloqueoPaciente.parametros
      );
      if (pacientes.length)
        throw new ConflictException('El paciente fue creado mientras diligenciabas el formulario.');
      const bloqueoCac = prepararConsulta(BLOQUEAR_IDENTIDAD_CAC_SQL, valores);
      const registrosCac: Record<string, unknown>[] = await this.qr.query(
        bloqueoCac.sql,
        bloqueoCac.parametros
      );
      if (registrosCac.length)
        throw new ConflictException(
          'Apareció un registro CAC para esta identificación. No se creó el paciente.'
        );
      const insercion = prepararConsulta(CREAR_PACIENTE_SQL, valores);
      const creados: Record<string, unknown>[] = await this.qr.query(
        insercion.sql,
        insercion.parametros
      );
      const pacienteId = Number(creados[0]?.OID);
      if (creados.length !== 1 || !Number.isInteger(pacienteId) || pacienteId <= 0)
        throw new BadRequestException(
          'No fue posible obtener el identificador del paciente creado'
        );
      const telefono = prepararConsulta(CREAR_TELEFONO_SQL, {
        GENPACIEN: pacienteId,
        PACTELEFONO: dto.telefono,
      });
      await this.qr.query(telefono.sql, telefono.parametros);
      await this.qr.commitTransaction();
    } catch (error: unknown) {
      if (this.qr.isTransactionActive) await this.qr.rollbackTransaction();
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('No fue posible crear el paciente en Dinámica');
    } finally {
      await this.qr.release();
    }
    const creado = await this.consultar(dto.tipoDocumento, dto.documento);
    if (!creado.paciente)
      throw new BadRequestException('No fue posible verificar el paciente creado');
    return {
      exitoso: true,
      mensaje: 'Paciente creado correctamente',
      paciente: creado.paciente,
    };
  }

  private async validarRecursosPaciente(
    dto: ReturnType<typeof validarActualizacionPaciente>
  ): Promise<void> {
    const recursos = await this.recursosPaciente();
    const existe = (coleccion: { id: number }[], id: number) =>
      coleccion.some(item => item.id === id);
    const municipio = recursos.municipios.find(item => item.id === dto.municipioId);
    if (
      !existe(recursos.ocupaciones, dto.ocupacionId) ||
      !existe(recursos.gruposPoblacionales, dto.grupoPoblacionalId) ||
      !municipio ||
      !existe(recursos.eps, dto.detalleContratoId)
    )
      throw new BadRequestException('Uno de los valores seleccionados ya no está disponible');
  }

  private async cargarRegistro(
    source: DataSource | QueryRunner,
    busqueda: BusquedaCacDto,
    codigoCie10: string,
    bloquear = false
  ): Promise<RegistroCacResponse | null> {
    const claves = {
      TIPDOCUSUARIO: SIGLAS_DOCUMENTO_CAC[busqueda.tipoDocumento],
      NUMDOCUSUARIO: busqueda.documento,
      CODCIE10: codigoCie10,
    };
    const consulta = prepararConsulta(
      bloquear ? BLOQUEAR_REGISTRO_SQL : CONSULTAS_CAC[0].select,
      claves
    );
    const maestros: Record<string, unknown>[] = await source.query(
      consulta.sql,
      consulta.parametros
    );
    if (maestros.length > 1)
      throw new ConflictException(
        'Este paciente tiene más de un registro CAC para el mismo CIE-10. Resuelve los duplicados antes de continuar.'
      );
    if (!maestros.length) return null;
    const datos = Object.fromEntries(CAMPOS_CAC.map(campo => [campo, null])) as DatosCac;
    const parametros = { ...claves, CODCIE10: String(maestros[0].CODCIE10).trim() };
    for (const seccion of CONSULTAS_CAC) {
      const query = prepararConsulta(seccion.select, parametros);
      const filas: Record<string, unknown>[] = await source.query(query.sql, query.parametros);
      if (filas.length > 1)
        throw new ConflictException('Hay registros duplicados en una sección CAC');
      if (!filas.length) continue;
      for (const campo of seccion.campos) {
        const valor = filas[0][campo];
        datos[campo] =
          valor == null
            ? null
            : valor instanceof Date
              ? valor.toISOString().slice(0, 10)
              : typeof valor === 'boolean'
                ? valor
                  ? '1'
                  : '0'
                : String(valor).trim();
      }
    }
    return { datos, version: versionRegistro(datos) };
  }
}
