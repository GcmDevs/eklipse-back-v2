import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  mapGestorEstanciaProlongadaUsuario,
  mapGestorEstanciaProlongadaUsuarios,
  mapGestorEstanciaProlongadasRows,
} from '@gestor-estancia-prolongadas/application/mappers';
import { throwGestorEstanciaProlongadasError } from '@gestor-estancia-prolongadas/application/errors';
import { CreateGestorEstanciaProlongadaUsuarioDto } from '@gestor-estancia-prolongadas/presentation/dtos';
import {
  CensoEstanciaProlongadaOrm,
  GestorEstanciaProlongadaUsuarioOrm,
} from '@orm/hpn/estancia-prolongadas';
import { Like } from 'typeorm';
import { UsuarioOrm } from '@orm/gen';

@Injectable()
export class GestorEstanciaProlongadasImpl extends BaseSource {
  public async fetchCenso() {
    try {
      const censoRp = this.conn.getRepository(CensoEstanciaProlongadaOrm);
      const grupoAgrupadoCase = `CASE
        WHEN censo.grupoNuevo = 'CIRUGIA' THEN 'CIRUGIA'
        WHEN censo.grupoNuevo IN ('HOSPITALIZACION', 'UNIDAD HEMATO ONCOLOGICA') THEN 'HOSPITALIZACION'
        WHEN censo.grupoNuevo LIKE 'UCI%' THEN 'UCI'
        WHEN censo.grupoNuevo IN ('OBSERVACION URGENCIAS', 'TEMPORAL REMITIDOS') THEN 'URGENCIAS'
        ELSE 'OTROS'
      END`;

      const result = await censoRp
        .createQueryBuilder('censo')
        .select([
          'censo.ingreso AS ingreso',
          'censo.sede AS sede',
          'censo.grupoNuevo AS grupoNuevo',
          `${grupoAgrupadoCase} AS grupoAgrupado`,
          'censo.hsunombre AS piso',
          'censo.gasnombre AS gas',
          'censo.fecha AS fecha',
          'censo.tipoIngreso AS tipoIngreso',
          'censo.identificacion AS identificacion',
          'censo.nombrePaciente AS nombrePaciente',
          'censo.cama AS cama',
          'censo.edad AS edad',
          'censo.sexo AS sexo',
          'censo.dias AS dias',
          'censo.especialidad AS especialidad',
          'censo.planBeneficio AS planBeneficio',
          'censo.entidad AS entidad',
          'censo.municipio AS municipio',
          'censo.hgrnombre AS hgrNombre',
          'censo.tipoRegimen AS tipoRegimen',
          'censo.dx_diagnostico_1 AS diagnostico',
        ])
        .where('censo.sede LIKE :sede', { sede: '%caribe' })
        .andWhere('censo.grupoNuevo <> :grupoExcluido', { grupoExcluido: 'HOSPICASA' })
        .orderBy(grupoAgrupadoCase, 'ASC')
        .addOrderBy('censo.grupoNuevo', 'ASC')
        .addOrderBy('censo.cama', 'ASC')
        .getRawMany();

      return mapGestorEstanciaProlongadasRows(result);
    } catch (error) {
      throwGestorEstanciaProlongadasError(
        error,
        'Error consultando el censo de estancia prolongadas'
      );
    }
  }

  public async fetchUsuarios() {
    try {
      const usuarioRp = this.conn.getRepository(GestorEstanciaProlongadaUsuarioOrm);
      const usuarios = await usuarioRp.find({
        where: { estado: true },
        order: { id: 'DESC' },
      });

      return mapGestorEstanciaProlongadaUsuarios(usuarios);
    } catch (error) {
      throwGestorEstanciaProlongadasError(
        error,
        'Error consultando los usuarios de estancia prolongadas'
      );
    }
  }
  public async buscarUsuariosByPattern(pattern: string) {
    try {
      const usuarioRp = this.conn.getRepository(UsuarioOrm);
      const usuarios = await usuarioRp.find({
        where: {
          nombreCompleto: Like(`%${pattern}%`),
        },
        order: { id: 'DESC' },
        take: 10,
      });

      return usuarios;
    } catch (error) {
      throwGestorEstanciaProlongadasError(
        error,
        'Error consultando los usuarios de estancia prolongadas'
      );
    }
  }

  public async createUsuario(body: CreateGestorEstanciaProlongadaUsuarioDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const usuarioRp = this.qr.manager.getRepository(GestorEstanciaProlongadaUsuarioOrm);
      const correo = body.correo.trim().toLowerCase();

      const usuarioExistente = await usuarioRp.findOne({
        where: { correo },
      });

      if (usuarioExistente) {
        throw new Error('Ya existe un usuario registrado con ese correo');
      }

      const usuario = usuarioRp.create({
        nombre: body.nombre.trim(),
        usuarioId: body.usuarioId,
        cargo: body.cargo.trim(),
        numeroTelefono: body.numeroTelefono.trim(),
        correo,
        fechaCreacion: new Date(),
        usuarioCreacionId: this.auth.id,
        estado: true,
      });

      const usuarioCreado = await usuarioRp.save(usuario);

      await this.qr.commitTransaction();

      return mapGestorEstanciaProlongadaUsuario(usuarioCreado);
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwGestorEstanciaProlongadasError(
        error,
        'Error creando el usuario de estancia prolongadas'
      );
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
  public async updateUsuario(id: number, body: CreateGestorEstanciaProlongadaUsuarioDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const usuarioRp = this.qr.manager.getRepository(GestorEstanciaProlongadaUsuarioOrm);
      const correo = body.correo.trim().toLowerCase();

      const usuarioExistente = await usuarioRp.findOne({
        where: { id },
      });

      if (!usuarioExistente) {
        throw new Error('No se encontró un usuario con el ID proporcionado');
      }

      usuarioExistente.nombre = body.nombre.trim();
      usuarioExistente.cargo = body.cargo.trim();
      usuarioExistente.numeroTelefono = body.numeroTelefono.trim();
      usuarioExistente.correo = correo;
      usuarioExistente.usuarioModificacionId = this.auth.id;
      usuarioExistente.fechaModificacion = new Date();

      const usuarioActualizado = await usuarioRp.save(usuarioExistente);

      await this.qr.commitTransaction();

      return mapGestorEstanciaProlongadaUsuario(usuarioActualizado);
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwGestorEstanciaProlongadasError(
        error,
        'Error actualizando el usuario de estancia prolongadas'
      );
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async toggleUsuarioEstado(id: number) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const usuarioRp = this.qr.manager.getRepository(GestorEstanciaProlongadaUsuarioOrm);

      const usuarioExistente = await usuarioRp.findOne({
        where: { id },
      });

      if (!usuarioExistente) {
        throw new Error('No se encontró un usuario con el ID proporcionado');
      }

      usuarioExistente.estado = !usuarioExistente.estado;
      usuarioExistente.usuarioModificacionId = this.auth.id;
      usuarioExistente.fechaModificacion = new Date();

      const usuarioActualizado = await usuarioRp.save(usuarioExistente);

      await this.qr.commitTransaction();

      return mapGestorEstanciaProlongadaUsuario(usuarioActualizado);
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwGestorEstanciaProlongadasError(
        error,
        'Error actualizando el estado del usuario de estancia prolongadas'
      );
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
