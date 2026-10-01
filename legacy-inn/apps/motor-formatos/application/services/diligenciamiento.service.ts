import { FILE_LOCATIONS } from '@common/application/constants';
import { ensureArray } from '@common/application/services';
import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { FindThrowOptions } from '@common/domain/types';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { RESTRICCIONES_MIME_STAGING, TipoContextoArchivo } from '@core/media/domain/types';
import { ActividadesService, FormatoService } from '@equipos/application';
import { ModalidadEjecucionActividad } from '@equipos/domain/enums';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  REGISTRO_DILIGENCIADO_REPOSITORY,
  RegistroDiligenciadoFmt,
  RegistroDiligenciadoFmtRead,
  RegistroDiligenciadoRepository,
  RegistroImagen
} from 'apps/motor-formatos/domain';
import { EstructuraFormatoSchema } from 'apps/motor-formatos/domain/types/schema.types';
import { RespuestaComponente } from 'apps/motor-formatos/domain/types/submission.types';
import { DiligenciarFormatoDto } from 'apps/motor-formatos/presentation/dto/diligenciar-formato.dto';
import { SubmissionBuilder } from '../builders/submission.builder';
import { SchemaValidator } from '../validators/schema.validator';
import { getUser } from '@common/infrastructure/services';
import { ConflictError, BadInputError, ResourceNotFoundError } from '@common/domain/errors';

@Injectable()
export class DiligenciamientoService {
  constructor(
    private readonly formatoService: FormatoService,
    @Inject(REGISTRO_DILIGENCIADO_REPOSITORY)
    private readonly regDilgRepository: RegistroDiligenciadoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingService: StagingFileService,
    private readonly regActividadService: ActividadesService
  ) { }

  async fillIn(data: DiligenciarFormatoDto): Promise<RegistroDiligenciadoFmtRead> {
    const regActividad = await this.regActividadService.findById(data.registroActividadId);
    if (regActividad.getEquipoId.getValor !== data.equipoId)
      throw new BadRequestException(`la activdad con id no pertenece al equipo con id ${regActividad.getEquipoId.getValor}`);

    const formatoId = regActividad.getFormatoId.getValor;
    if (!formatoId)
      throw new ConflictError(`El equipo asociado no tiene formato de diligenciamiento, modifique su plan y asocie el formato correspondiente`)

    const version = await this.formatoService.findLastVersionFormatoPublished(formatoId);
    const schema = version.getSchema as unknown as EstructuraFormatoSchema;
    if (!schema?.secciones?.length)
      throw new BadInputError('El formato no tiene una estructura válida');

    await this.ensureDiligenciamientoPermitido(data.registroActividadId);

    const respuestas = data.respuestas as Record<string, RespuestaComponente>;
    SchemaValidator.validate(schema, respuestas);
    const datoSnapshot = SubmissionBuilder.build(schema, respuestas);

    return await this.txManager.transactional(async () => {
      await Promise.all(
        ensureArray(data.imagenes).map(async (img) => {
          const archivo = await this.stagingService.findById(img.archivoId);

          if (!archivo) {
            throw new ResourceNotFoundError(
              `Archivo con id ${img.archivoId} no encontrado`,
            );
          }
        }),
      );

      const imagenes = ensureArray(data.imagenes).map((img) =>
        RegistroImagen.create({ key: img.key, archivoId: img.archivoId }),
      );

      const diligenciadoPorId = getUser().id;
      const registro = RegistroDiligenciadoFmt.create({
        versionFormatoId: version.getId.getValor,
        formatoId: version.getFormatoId.getValor,
        equipoId: data.equipoId,
        registroActividadId: data.registroActividadId,
        diligenciadoPorId,
        datoSnapshot,
        imagenes,
        completarInmediato: data.completarInmediato ?? false,
      });

      const saved = await this.regDilgRepository.save(registro);
      await this.commitImagenes(ensureArray(data.imagenes), data.equipoId);
      return saved;
    });
  }


  async updateBorrador(
    registroDiligenciadoId: number,
    data: DiligenciarFormatoDto,
  ): Promise<RegistroDiligenciadoFmtRead> {
    const registro = await this.regDilgRepository.findById(registroDiligenciadoId);
    if (!registro)
      throw new ResourceNotFoundError(`Registro ${registroDiligenciadoId} no encontrado`);

    const version = await this.formatoService.findVersionFormato(registro.getVersionFormatoId.getValor);
    if (!version)
      throw new ResourceNotFoundError('Version de formato no encontrada');

    const schema = version.getSchema as unknown as EstructuraFormatoSchema;
    SchemaValidator.validate(schema, data.respuestas as Record<string, RespuestaComponente>);

    const datoSnapshot = SubmissionBuilder.build(
      schema,
      data.respuestas as Record<string, RespuestaComponente>,
    );

    await this.txManager.transactional(async () => {
      registro.updateBorrador(
        datoSnapshot,
        ensureArray(data.imagenes).map((img) =>
          RegistroImagen.create({ key: img.key, archivoId: img.archivoId }),
        ),
      );

      await this.regDilgRepository.save(registro);
      await this.commitImagenes(ensureArray(data.imagenes), data.equipoId);
    });
    return this.regDilgRepository.findViewById(registroDiligenciadoId);
  }

  async complete(
    registroDiligenciadoId: number
  ): Promise<RegistroDiligenciadoFmtRead> {
    const registro = await this.regDilgRepository.findById(registroDiligenciadoId);
    if (!registro)
      throw new ResourceNotFoundError(`Registro ${registroDiligenciadoId} no encontrado`);

    const usuarioWantCompleteId = getUser().id;
    if (registro.getDiligenciadoPorId !== usuarioWantCompleteId)
      throw new BadInputError('Solo el tecnico que diligencio puede completar el registro');

    return this.txManager.transactional(async () => {
      registro.complete();
      return await this.regDilgRepository.save(registro);
    });
  }

  public async findByRegActividadId(
    registroActividadId: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<RegistroDiligenciadoFmtRead | null> {
    const regDilgo = await this.regDilgRepository.findViewByRegActividad(registroActividadId);
    if (!regDilgo && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`No se encontro ningun registro para la actividad con id: ${registroActividadId}`);
    }

    return regDilgo;
  }

  public async getById(id: number): Promise<RegistroDiligenciadoFmtRead> {
    const regDilgo = await this.regDilgRepository.findViewById(id);
    if (!regDilgo) throw new ResourceNotFoundError(`Registro con id: ${id} no encontrado`);
    return regDilgo;
  }


  private async commitImagenes(
    imagenes: DiligenciarFormatoDto['imagenes'],
    referenciaId: number,
  ): Promise<{ key: string; archivoId: number | null }[]> {
    if (!imagenes?.length) return [];
    return Promise.all(imagenes.map(async i => {
      if (i.archivoId) {
        await this.stagingService.commit(
          {
            archivoId: i.archivoId,
            contexto: TipoContextoArchivo.FIRMA.REG_DILIGENCIADO.ACTIVIDAD,
            module: FILE_LOCATIONS.inn.eqp.actividaes,
            referenciaId,
          },
          RESTRICCIONES_MIME_STAGING.IMAGENES,
        );
      }
      return { key: i.key, archivoId: i.archivoId };
    }));
  }


  private async ensureDiligenciamientoPermitido(
    regActividadAsociadoId: number,
  ): Promise<void> {
    const regActividad = await this.regActividadService.findById(regActividadAsociadoId);

    if (!regActividad)
      throw new ResourceNotFoundError(
        `Registro de actividad ${regActividadAsociadoId} no encontrado`,
      );

    if (regActividad.getModalidadPlanificada === ModalidadEjecucionActividad.EXTERNA)
      throw new BadInputError(
        'Esta actividad está configurada como ejecución externa en el plan. ' +
        'No aplica diligenciamiento de formato.',
      );

    const existente = await this.regDilgRepository.findByRegActividad(regActividadAsociadoId);
    if (existente && !existente.isAnulado()) {
      if (existente.isCompletado() || existente.isAprobado())
        throw new BadInputError(
          `Ya existe un registro diligenciado en estado "${existente.getEstado}" ` +
          'para esta actividad. No se puede crear uno nuevo.',
        );

      throw new BadInputError(
        `Ya existe un registro diligenciado en borrador (id: ${existente.getId.getValor}) ` +
        'para esta actividad. Use la funcion de actualización de borrador.',
      );
    }
  }
}