import { In, IsNull, Like, MoreThanOrEqual, Not } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ITokenDecoded, JWTServices } from '@common/application/services';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { EstanciaOrm } from '@inn/orm/hpn';
import { SumPacModifiRecibiDto } from '../../presentation/dtos';
import { SuministroPacienteOrm, SuministroPacienteRecibidoOrm } from '@inn/orm/inn/documentos';
import { dataToFetchSumPac } from '../factories';

@Injectable()
export class RecibirSuministrosAuthUnreqImpl {
  constructor(@Inject(REQUEST) private _request: Request) {}

  public async findModificacionSuministrosRecibidosByOrdenSuministroId(
    id: number,
    contextCode: GcmContextCode
  ): Promise<SumPacModifiRecibiDto> {
    const conn = contextCode
      ? switchConn(gcmContextFactory(contextCode))
      : switchConn(this._auth.context);

    const res = await conn.query(
      `SELECT MD.OID id, U.OID usuarioId, U.USUDESCRI usuarioNombreCompleto,
      U.USUNOMBRE usuarioNumeroDocumento, MD.CREATEDAT createdAt
      FROM GCMINNSUMRECMODIF MD
      INNER JOIN GENUSUARIO U ON U.OID = MD.GENUSUARIO
      WHERE MD.INNCSUMPA = ${id};`
    );

    return {
      id: res[0].id,
      usuario: {
        id: res[0].usuarioId,
        nombreCompleto: res[0].usuarioNombreCompleto,
        numeroDocumento: res[0].usuarioNumeroDocumento,
      },
      createdAt: res[0].createdAt,
    };
  }

  private get _auth() {
    try {
      const tkDecoded = this._getTokenDecoded();

      const id = tkDecoded.user.id;
      const user = tkDecoded.user;
      const context = tkDecoded.context;

      return { id, user, context };
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  public async findByConsecutivo(
    consecutivo: number,
    lessDays: number,
    contextCode: GcmContextCode
  ) {
    try {
      if (!contextCode) contextCode = this._auth.context.getCode();
      const axios = require('axios');
      const url = `http://localhost:4001/documentos/find-by-consecutivo/${consecutivo}/${lessDays}/${contextCode}`;
      const result = await axios.get(url);

      const conn = switchConn(gcmContextFactory(contextCode));
      const ordSumModiRp = conn.getRepository(SuministroPacienteRecibidoOrm);

      if (result.data && result.data.documentos && result.data.documentos.length) {
        const ordSumModifi = await ordSumModiRp.find({
          where: { ordenSuministrosId: In([0, ...result.data.documentos.map(r => r.id)]) },
        });

        result.data.documentos.map((doc: any) => {
          const docModifi = ordSumModifi.find(mod => mod.ordenSuministrosId === doc.id);
          if (docModifi) doc.isListoParaEntrega = true;
          else doc.isListoParaEntrega = false;
        });
      }

      return result.data;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async findByPattern(pattern: string, lessDays: number, contextCode: GcmContextCode) {
    try {
      if (!contextCode) contextCode = this._auth.context.getCode();

      const conn = switchConn(gcmContextFactory(contextCode));
      const ordSumModiRp = conn.getRepository(SuministroPacienteRecibidoOrm);
      const suministroPacienteRp = conn.getRepository(SuministroPacienteOrm);
      const estanciaRp = conn.getRepository(EstanciaOrm);

      const estancia = await estanciaRp.findOne({
        where: [
          { cama: { codigo: Like(`%${pattern}%`) }, fechaEgreso: null },
          { ingreso: { consecutivo: Like(`%${pattern}%`) }, fechaEgreso: null },
        ],
        relations: ['cama', 'cama.subgrupo', 'ingreso', 'ingreso.paciente'],
        order: { id: 'DESC' },
      });

      if (!estancia) throw new Error('No hay estancia activa con este consecutivo o cama');

      const documentos = await suministroPacienteRp.find({
        where: {
          ingresoId: estancia.ingresoId,
          documento: {
            fechaCreacion: MoreThanOrEqual(new Date(Date.now() - lessDays * 24 * 60 * 60 * 1000)),
            fechaConfirmacion: Not(IsNull()),
            fechaAnulacion: IsNull(),
          },
        },
        relations: ['documento', 'documento.creadoPor', 'detalle', 'detalle.producto'],
        order: { id: 'DESC' },
      });

      const ordSumModifi = await ordSumModiRp.find({
        where: { ordenSuministrosId: In([0, ...documentos.map(r => r.id)]) },
      });

      documentos.map(doc => {
        const docModifi = ordSumModifi.find(mod => mod.ordenSuministrosId === doc.id);
        if (docModifi) doc.isListoParaEntrega = true;
      });

      return dataToFetchSumPac(estancia, documentos);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  private _getTokenDecoded(): ITokenDecoded {
    const tkDcd = JWTServices.decodeToken(this._request.headers.authorization!.split(' ')[1]);
    return tkDcd;
  }
}
