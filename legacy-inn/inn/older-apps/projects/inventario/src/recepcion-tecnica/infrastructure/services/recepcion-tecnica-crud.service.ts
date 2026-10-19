import { BadRequestException, Injectable } from '@nestjs/common';
import { dataToRecepcionTecnica, dataToRecepcionTecnicaProducto } from '../factories';
import {
  RecTecProductoOrm,
  RecepcionTecnicaOrm,
  CentroOSRD,
  SugerenciaOSRD,
} from '@inn/old/inn/recepcion-tecnica/orm';
import { NewRecTecDto } from '@inn/old/inn/recepcion-tecnica/presentation/dtos';
import { In, QueryRunner } from 'typeorm';
import { uniq } from 'lodash';
import { NivelInspeccionTypeFactory } from '@inn/old/inn/recepcion-tecnica/domain/types';
import { InnDocumentoOrm } from '@inn/old/inn/orm/dim';
import { RecTecLoteOrm } from '../../orm/recepcion-tecnica/lote.orm';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import { BaseSource, switchConn } from '@common/infrastructure/services';
import { GcmContexts } from '@common/application/constants';

interface ProductoFromDB {
  productoId: number;
  productoCodigo: string;
  productoDescripcionCorta: string;
  cantidadProducto: number;
}

@Injectable()
export class RecepcionTecnicaCrudService extends BaseSource {
  public async fetchProductosByConsecutivoOC(consecutivo: string, centroId: number) {
    let qr: QueryRunner, authId: number;
    if (this.auth.context === GCM_CONTEXTS.AMMEDICAL) {
      const ds = switchConn(GCM_CONTEXTS.EKLIPSE);

      const centroRp = ds.getRepository(CentroOSRD);
      const centro = await centroRp.findOne({ where: { id: centroId } });

      const originalDbConn = switchConn(gcmContextFactory(centro.contexto));
      const originalCentroRP = await originalDbConn.query(
        `SELECT OID id, ACACODIGO codigo, ACANOMBRE nombre FROM ADNCENATE`
      );

      centroId = originalCentroRP[0].id;

      qr = switchConn(gcmContextFactory(centro.contexto)).createQueryRunner();
      authId = 1;
    } else {
      qr = this.qr;
      authId = this.auth.id;
    }

    await qr.connect();
    try {
      const documentoRp = qr.manager.getRepository(InnDocumentoOrm);
      const recTecRp = qr.manager.getRepository(RecepcionTecnicaOrm);

      const documento = await documentoRp.findOne({
        where: { consecutivo, tipo: 0 },
        select: { id: true },
      });

      if (!documento) {
        throw new Error('No existe orden de compra con este consecutivo en esta entidad');
      }

      const recTecWithThisOC = await recTecRp.find({
        where: { ordenCompraId: documento.id },
      });

      if (recTecWithThisOC.length >= 7) {
        throw new Error(
          'Ya existen mas de 7 recepciónes tecnicas relacionadas a esta orden de compra'
        );
      }

      const query: ProductoFromDB[] = await qr.query(
        `select PD.OID productoId, PD.IPRCODIGO productoCodigo,
      PD.IPRDESCOR productoDescripcionCorta, DT.IDDCANTID cantidadProducto
      from INNMORDEN DT
      INNER JOIN INNDOCUME DOC ON DOC.OID = DT.INNCORDEN
      INNER JOIN INNPRODUC PD ON PD.OID = DT.INNPRODUC
      WHERE DOC.IDCONSEC = @0`,
        [consecutivo]
      );

      return query.map(el => {
        return {
          producto: {
            id: el.productoId,
            codigo: el.productoCodigo,
            descripcionLarga: el.productoDescripcionCorta,
            descripcionCorta: el.productoDescripcionCorta,
            nombre: el.productoDescripcionCorta,
          },
          cantidad: el.cantidadProducto,
        };
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async fetch(): Promise<RecepcionTecnicaOrm[]> {
    try {
      const sharedDBDs = switchConn(GCM_CONTEXTS.EKLIPSE);
      const sharedCentroRp = sharedDBDs.getRepository(CentroOSRD);
      const sharedCentros = await sharedCentroRp.find();

      const recTecs: RecepcionTecnicaOrm[] = [];
      const sugerenciasIds: number[] = [];

      const allCtxs =
        this.auth.context === GCM_CONTEXTS.AMMEDICAL
          ? [GcmContexts.AMMEDICAL, GcmContexts.ALTACENTRO]
          : [this.auth.context.getCode()];

      for (let i = 0; i < allCtxs.length; i++) {
        const tempConn = switchConn(gcmContextFactory(allCtxs[i]));
        const recTecRp = tempConn.getRepository(RecepcionTecnicaOrm);

        const tempRecTecs = await recTecRp.find({
          relations: [
            'productos',
            'usuario',
            'productos.producto',
            'productos.lotes',
            'ordenCompra',
          ],
        });

        const centro = sharedCentros.filter(el => el.contexto === allCtxs[i]);

        tempRecTecs.map(el => {
          el.centro = centro[0];
        });

        recTecs.push(...tempRecTecs);
      }

      recTecs.forEach(el => {
        sugerenciasIds.push(el.laboratorioId, el.transportadoraId);
        el.productos.forEach(pr => {
          sugerenciasIds.push(
            pr.laboratorioId,
            pr.unidadMedidaConcentracionId,
            pr.presentacionId,
            pr.formaFarmaceuticaId
          );
        });
      });

      const sugerenciaRp = sharedDBDs.getRepository(SugerenciaOSRD);
      const sugerencias = await sugerenciaRp.find({ where: { id: In(uniq(sugerenciasIds)) } });

      recTecs.map(rt => {
        const diffInSeconds = (new Date().getTime() - new Date(rt.createdAt).getTime()) / 1000;

        if (diffInSeconds > 86400) rt.canBeUpdated = false;
        else rt.canBeUpdated = true;

        rt.laboratorio = sugerencias.filter(el => el.id === rt.laboratorioId)[0];
        rt.transportadora = sugerencias.filter(el => el.id === rt.transportadoraId)[0];
        rt.productos.map(pr => {
          pr.laboratorio = sugerencias.filter(el => el.id === pr.laboratorioId)[0];
          pr.unidadMedidaConcentracion = sugerencias.filter(
            el => el.id === pr.unidadMedidaConcentracionId
          )[0];
          pr.presentacion = sugerencias.filter(el => el.id === pr.presentacionId)[0];
          pr.formaFarmaceutica = sugerencias.filter(el => el.id === pr.formaFarmaceuticaId)[0];
          pr.nivelInspeccion = NivelInspeccionTypeFactory(pr.nivelInspeccionId);
        });

        rt.productos = rt.productos.filter(el => !el.isDeleted);
      });

      return recTecs;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async create(payload: NewRecTecDto): Promise<RecepcionTecnicaOrm> {
    let qr: QueryRunner, authId: number;
    if (this.auth.context === GCM_CONTEXTS.AMMEDICAL) {
      const ds = switchConn(GCM_CONTEXTS.EKLIPSE);

      const centroRp = ds.getRepository(CentroOSRD);
      const centro = await centroRp.findOne({ where: { id: payload.centroId } });

      const originalDbConn = switchConn(gcmContextFactory(centro.contexto));
      const originalCentroRP = await originalDbConn.query(
        `SELECT OID id, ACACODIGO codigo, ACANOMBRE nombre FROM ADNCENATE`
      );

      payload.centroId = originalCentroRP[0].id;

      qr = switchConn(gcmContextFactory(centro.contexto)).createQueryRunner();
      authId = 1;
    } else {
      qr = this.qr;
      authId = this.auth.id;
    }

    await qr.connect();
    await qr.startTransaction();
    try {
      const recTecRp = qr.manager.getRepository(RecepcionTecnicaOrm);
      const recTecProdRp = qr.manager.getRepository(RecTecProductoOrm);
      const recTecLoteRp = qr.manager.getRepository(RecTecLoteOrm);

      let ordenCompraId = null;
      if (payload.consecutivoOrdenCompra) {
        const ordenCompraRp = qr.manager.getRepository(InnDocumentoOrm);

        const ordenCompra = await ordenCompraRp.findOne({
          where: { consecutivo: payload.consecutivoOrdenCompra },
        });

        ordenCompraId = ordenCompra.id;
      }

      const recTec = dataToRecepcionTecnica(payload, authId, ordenCompraId);
      const recTecStored = await recTecRp.save(recTec);

      const recTecProds = payload.productos.map(producto =>
        dataToRecepcionTecnicaProducto(producto, recTecStored)
      );

      const recTecProdStored = await recTecProdRp.save(recTecProds);

      const lotes: RecTecLoteOrm[] = [];

      recTecProdStored.map(pr => {
        pr.tempLotes.map(tl => {
          tl.recTecProductoId = pr.id;
          lotes.push(tl);
        });

        pr.lotes = pr.tempLotes;

        delete pr.recepcionTecnica;
      });

      await recTecLoteRp.save(lotes);

      recTecStored.productos = recTecProdStored;

      await qr.commitTransaction();

      return recTecStored;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async update(payload: NewRecTecDto): Promise<RecepcionTecnicaOrm> {
    let qr: QueryRunner, authId: number;
    if (this.auth.context === GCM_CONTEXTS.AMMEDICAL) {
      const ds = switchConn(GCM_CONTEXTS.EKLIPSE);

      const centroRp = ds.getRepository(CentroOSRD);
      const centro = await centroRp.findOne({ where: { id: payload.centroId } });

      const originalDbConn = switchConn(gcmContextFactory(centro.contexto));
      const originalCentroRP = await originalDbConn.query(
        `SELECT OID id, ACACODIGO codigo, ACANOMBRE nombre FROM ADNCENATE`
      );

      payload.centroId = originalCentroRP[0].id;

      qr = switchConn(gcmContextFactory(centro.contexto)).createQueryRunner();
      authId = 1;
    } else {
      qr = this.qr;
      authId = this.auth.id;
    }

    await qr.connect();
    await qr.startTransaction();
    try {
      const recTecRp = qr.manager.getRepository(RecepcionTecnicaOrm);
      const recTecProdRp = qr.manager.getRepository(RecTecProductoOrm);
      const recTecLoteRp = qr.manager.getRepository(RecTecLoteOrm);

      const recepcionTecnica = await recTecRp.findOne({ where: { id: payload.id } });

      const diffInSeconds =
        (new Date().getTime() - new Date(recepcionTecnica.createdAt).getTime()) / 1000;

      if (diffInSeconds > 86400) {
        throw new Error(
          'Han pasado mas de 24 horas desde la creación del item, no se puede modificar'
        );
      } else {
        let recTec: RecepcionTecnicaOrm;

        if (recepcionTecnica.id === payload.id) {
          recTec = dataToRecepcionTecnica(payload, authId);
        } else {
          throw new Error('No existe recepción tecnica con este id');
        }

        const productos = await recTecProdRp.find({
          where: { recepcionTecnicaId: payload.id },
          relations: ['lotes'],
        });

        const recTecStored = await recTecRp.save(recTec);

        const productosActualizados: RecTecProductoOrm[] = [];

        payload.productos.forEach(producto => {
          if (productos.filter(el => el.id === producto.id).length || !producto.id) {
            const productoDb = productos.filter(el => el.id === producto.id)[0];
            productosActualizados.push(dataToRecepcionTecnicaProducto(producto, recTecStored));
            producto.items.map(item => {
              if (item.id && !productoDb.lotes.filter(el => el.id === item.id).length) {
                throw new Error(
                  'Uno o mas lotes no pertenecen a algún producto de la recepción tecnica'
                );
              }
            });
          } else {
            throw new Error('Uno o mas productos no pertenecen a la recepción tecnica');
          }
        });

        const idsProductosFromFront = payload.productos.map(el => {
          if (el.id) return el.id;
        });

        productos.map(pro => {
          if (idsProductosFromFront.indexOf(pro.id) < 0) {
            pro.isDeleted = true;
            productosActualizados.push(pro);
          }
        });

        const recTecProdStored = await recTecProdRp.save(productosActualizados);

        const lotes: RecTecLoteOrm[] = [];

        recTecProdStored.map(el => {
          el.tempLotes.map(tl => {
            tl.recTecProductoId = el.id;
            lotes.push(tl);
          });

          el.lotes = el.tempLotes;

          delete el.recepcionTecnica;
        });

        await recTecLoteRp.save(lotes);

        recTecStored.productos = recTecProdStored;

        await qr.commitTransaction();

        return recTecStored;
      }
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
