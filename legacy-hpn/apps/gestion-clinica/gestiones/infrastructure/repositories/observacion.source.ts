import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  GCM_CONTEXTS_VALUES,
  GcmContextCode,
  gcmContextFactory,
  GcmContextType,
} from '@common/domain/types';
import { In } from 'typeorm';
import { GTCObservacionOrm, SolicitudTrasladoOrm } from '@orm/gcn';
import { groupByKey } from '@common/application/services';
import { UsuarioOrm } from '@orm/gen';

export interface ObservacionBody {
  management: number;
  content: string;
  contextoCode: GcmContextCode;
  contexto: GcmContextType;
}

export interface ObservacionI {
  id: number;
  management: number;
  content: string;
  author: number;
  authorFullName: string;
  authorCodigoCentro: number;
  createdAt: Date;
  tipo: number;
}

@Injectable()
export class ObservacionSource extends BaseSource {
  async getOne(id: number): Promise<GTCObservacionOrm> {
    const repo = this.conn.getRepository(GTCObservacionOrm);
    try {
      return await repo.findOne({ where: { id } });
    } catch (error) {
      return null;
    }
  }

  async create(body: ObservacionBody) {
    if (body.contextoCode) body.contexto = gcmContextFactory(body.contextoCode);
    const conn = body.contextoCode ? this.dynamicConn(body.contexto) : this.conn;
    const qr = conn.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const observacionRp = qr.manager.getRepository(GTCObservacionOrm);

      const newObs = new GTCObservacionOrm();
      newObs.author = this.auth.user.id;
      newObs.codigoCentro = this.auth.context.getNumericCode();
      newObs.content = body.content;
      newObs.management = body.management;
      newObs.createdAt = new Date();
      newObs.wasUpdated = false;

      const result = await observacionRp.save(newObs);
      await qr.commitTransaction();

      result.authorFullName = this.auth.user.fullName;

      return result;
    } catch (error) {
      await qr.rollbackTransaction();
      return new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  async findByManagement(management: number, contexto: GcmContextType) {
    try {
      const conn = contexto ? this.dynamicConn(contexto) : this.conn;

      const solicitudRp = conn.getRepository(SolicitudTrasladoOrm);

      const solicitudes = await solicitudRp.find({
        where: { gestionId: management },
        relations: ['gestion'],
      });

      let observaciones: ObservacionI[] = [];

      if (solicitudes.length > 0) {
        const soliIds = solicitudes.map(solicitud => solicitud.id);

        const obs = await conn.query(
          `SELECT 
      O.OID id,
      O.SOLITRANSLADO management,
      O.OBSERVACION content,
      O.USUARIO author,
      U.USUDESCRI authorFullName,
      O.OBSPORCENTRO authorCodigoCentro,
      O.FECHA createdAt,
      O.TIPOPROFESIONAL tipo
      FROM GCMHPNSOLIOBSERVA O
      LEFT JOIN GENUSUARIO U ON O.USUARIO = U.OID WHERE O.SOLITRANSLADO IN(${soliIds})`
        );

        if (obs.length) observaciones.push(...obs);
      }

      const obsGestion = await conn.query(`SELECT 
      O.OID id,
      O.GCMHPNGEST management,
      O.CONTENIDO content,
      O.GENUSUARIO author,
      U.USUDESCRI authorFullName,
      O.FECHREGISTRO createdAt,
      O.CODIGOCENATE authorCodigoCentro
      FROM GCMHPNGESTOBS O
      LEFT JOIN GENUSUARIO U ON O.GENUSUARIO = U.OID WHERE O.GCMHPNGEST = ${management}`);

      if (obsGestion.length) observaciones.push(...obsGestion);

      const usuarios: {
        usuarioId: number;
        contextoCode: GcmContextCode;
        contexto: GcmContextType;
      }[] = [];

      observaciones.forEach(o => {
        const ctx = o.authorCodigoCentro
          ? GCM_CONTEXTS_VALUES.filter(c => c.getNumericCode() === o.authorCodigoCentro)[0]
          : null;

        usuarios.push({
          usuarioId: o.author,
          contextoCode: ctx ? ctx.getCode() : null,
          contexto: ctx ? ctx : null,
        });
      });

      const usuariosGrouped = groupByKey(usuarios, 'contextoCode');

      const usuariosCrox: UsuarioOrm[] = [];

      for (let index = 0; index < usuariosGrouped.length; index++) {
        const element = usuariosGrouped[index];
        const ctx = element.key ? gcmContextFactory(element.key) : this.auth.context;
        const tempQr = this.dynamicQR(ctx);
        await tempQr.connect();
        try {
          const usuRp = tempQr.manager.getRepository(UsuarioOrm);
          const usus = await usuRp.find({ where: { id: In(element.rows.map(r => r.usuarioId)) } });
          usus.map(u => {
            u.contexto = ctx;
          });
          usuariosCrox.push(...usus);
        } finally {
          await tempQr.release();
        }
      }

      observaciones.map(o => {
        const usuFilt = usuariosCrox.filter(
          f => f.contexto.getNumericCode() === o.authorCodigoCentro && f.id === o.author
        );
        if (usuFilt.length) {
          o.authorFullName = usuFilt[0].nombreCompleto;
        }
      });

      return observaciones;
    } catch (error) {
      return new BadRequestException();
    }
  }
}
