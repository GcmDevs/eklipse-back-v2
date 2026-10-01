import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ActivoFijoOrm, EspecificacionCompOrm, EspecificacionDispOrm } from '../orm';
import { DocumentoDto } from '../../presentation/dtos';
import { DocumentoOrm } from '../orm/documento.orm';
import { dataToEquipoTecnologico } from '../factories';

@Injectable()
export class EquipoTecnologicoCrudSource extends BaseSource {
  public async fetch() {
    const documentoRp = this.conn.getRepository(DocumentoOrm);

    const result = await documentoRp.find({
      relations: [
        'activo',
        'activo.area',
        'activo.responsable',
        'activo.responsable.dependencia',
        'activo.producto',
        'usuario',
        'equipo',
        'dispositivo',
      ],
    });

    return result;
  }

  public async create(body: DocumentoDto) {
    let authId: number;
    authId = this.auth.id;

    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const activoRp = this.qr.manager.getRepository(ActivoFijoOrm);

      const activo = await activoRp.findOne({ where: { id: body.activoId } });

      if (!activo) {
        throw new Error(`El id ${body.activoId} no fue encontrado, por favor intentelo nuevamente`);
      }

      const docRp = this.qr.manager.getRepository(DocumentoOrm);

      const result = await docRp.findOne({ where: { activoId: body.activoId } });

      if (result) {
        throw new Error(`Ya existe un registro asociado a este id ${body.activoId}`);
      }
      let documento = new DocumentoOrm();

      documento.activoId = body.activoId;
      documento.tipoCode = body.tipoEquipoCode;
      documento.fechaCreacion = new Date();
      documento.usuarioId = authId;
      documento.observacion = body.observacion;
      documento.ubicacion = body.ubicacion;
      documento.isLaptop = body.isLaptop;

      const documentoLocal = await docRp.save(documento);

      const equipoEspeCompRp = this.qr.manager.getRepository(EspecificacionCompOrm);

      const equipoEspeComp = await equipoEspeCompRp.findOne({ where: { id: documentoLocal.id } });

      if (equipoEspeComp) {
        throw new Error(`Ya existe un registro asociado a este id ${documentoLocal.id}`);
      }

      const equipoEspeDispRp = this.qr.manager.getRepository(EspecificacionDispOrm);

      const equipoEspeDisp = await equipoEspeDispRp.findOne({ where: { id: documentoLocal.id } });

      if (equipoEspeDisp) {
        throw new Error(`Ya existe un registro asociado a este id ${documentoLocal.id}`);
      }

      if (body.isLaptop) {
        const newEquipo = dataToEquipoTecnologico(body, documentoLocal.id);
        await equipoEspeCompRp.save(newEquipo);
      } else {
        const dispositivo = new EspecificacionDispOrm();
        dispositivo.documentoId = documentoLocal.id;
        dispositivo.marca = body.dispositivo.marca;
        dispositivo.modelo = body.dispositivo.modelo;
        dispositivo.serie = body.dispositivo.serie;

        await equipoEspeDispRp.save(dispositivo);
      }
      await this.qr.commitTransaction();
      return documentoLocal;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
