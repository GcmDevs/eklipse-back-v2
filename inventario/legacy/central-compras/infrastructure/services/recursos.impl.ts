import { BadRequestException, Injectable } from '@nestjs/common';
import { GcmContexts } from '@common/domain/types';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import { In, Like, Not, QueryRunner } from 'typeorm';
import { DependenciaOrm, ProveedorOrm } from '@inn/lgc/ctc/orm/gen';
import { BaseSource, switchConn } from '@common/infrastructure/services';
import { castDataServices } from '@common/application/services';
import { gruposProductosValidosByCtx } from '@inn/lgc/ctc/infrastructure/queries';
import { AlmacenOrm, ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { ProductoOrm as AfnProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import { ClaseProductoCode } from '@inn/lgc/ctc/types/inn/productos';
import { SRDCentroOrm } from '@inn/lgc/ctc/orm/shared-bd';

const centros: SRDCentroOrm[] = [];

@Injectable()
export class CTCRecursosImpl extends BaseSource {
  async fetchProveedorByPatternAndCentro(
    pattern: string,
    centroId: number,
    context: GcmContexts
  ): Promise<ProveedorOrm[]> {
    let eklQr: QueryRunner, centroQr: QueryRunner;
    try {
      if (!centros.length) {
        eklQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
        const centroRp = eklQr.manager.getRepository(SRDCentroOrm);
        const centrosStored = await centroRp.find();
        centros.push(...centrosStored);
      }

      const centro = centros.filter(centro => centro.id === centroId)[0];
      centroQr = this.dynamicQR(
        context ? gcmContextFactory(context) : gcmContextFactory(centro.contextCode)
      );

      const proveedorRp = centroQr.manager.getRepository(ProveedorOrm);

      const proveedores = await proveedorRp.find({
        where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
        take: 5,
      });

      return proveedores;
    } catch (error: any) {
    } finally {
      if (eklQr) await eklQr.release();
      if (centroQr) await centroQr.release();
    }
  }

  async fetchProveedorByPattern(pattern: string): Promise<ProveedorOrm[]> {
    try {
      return await this._fetchProveedorByPattern(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchProductosByPattern(
    tipos: ClaseProductoCode[],
    productosExcluded: number[],
    pattern: string,
    context: GcmContexts
  ) {
    try {
      return await this._fetchProductosByPattern(tipos, productosExcluded, pattern, context);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchDependenciasByPattern(pattern: string) {
    try {
      return await this._fetchDependenciasByPattern(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchAlmacenesByPattern(pattern: string) {
    try {
      return await this._fetchAlmacenesByPattern(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchGrupos() {
    try {
      return await this._fetchGrupos();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  private async _fetchGrupos() {
    try {
      const nombreGrupos = gruposProductosValidosByCtx(this.auth.context);
      return this.conn.query(`select OID id, IGRCODIGO codigo, IGRNOMBRE nombre from inngrupo
        ${
          nombreGrupos.length
            ? `where IGRNOMBRE IN(${castDataServices.stringArrayForSqlQueries(nombreGrupos)})`
            : ''
        }
        `);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  private async _fetchProveedorByPattern(pattern: string): Promise<ProveedorOrm[]> {
    try {
      const proveedorRp = this.conn.manager.getRepository(ProveedorOrm);

      const proveedores = await proveedorRp.find({
        where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
        take: 5,
      });

      return proveedores;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  private async _fetchDependenciasByPattern(pattern: string): Promise<DependenciaOrm[]> {
    const dependenciaRp = this.conn.getRepository(DependenciaOrm);

    const dependencias = await dependenciaRp.find({
      where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
      take: 5,
    });

    return dependencias;
  }

  private async _fetchAlmacenesByPattern(pattern: string): Promise<AlmacenOrm[]> {
    const almacenRp = this.conn.getRepository(AlmacenOrm);

    const almacenes = await almacenRp.find({
      where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
      take: 5,
    });

    return almacenes;
  }

  private async _fetchProductosByPattern(
    tipos: ClaseProductoCode[],
    productosExcluded: number[],
    pattern: string,
    context: GcmContexts
  ): Promise<ProductoOrm[]> {
    const conn = switchConn(gcmContextFactory(context));
    const productoRp = conn.getRepository(ProductoOrm);
    const activoFijoRp = conn.getRepository(AfnProductoOrm);

    let response: any[] = [];

    const isActivosFijos = tipos.includes(3 as any);

    if (!isActivosFijos) {
      response = await productoRp.find({
        where: [
          {
            id: Not(In(productosExcluded)),
            claseCode: In(tipos),
            codigo: Like(`%${pattern}%`),
            isBloqueado: false,
          },
          {
            id: Not(In(productosExcluded)),
            claseCode: In(tipos),
            descripcion: Like(`%${pattern}%`),
            isBloqueado: false,
          },
        ],
        take: 5,
      });

      response.map(el => {
        el.setTypes();
        delete el.tipoCode;
        return el;
      });
    } else {
      response = await activoFijoRp.find({
        where: [
          {
            id: Not(In(productosExcluded)),
            codigo: Like(`%${pattern}%`),
          },
          {
            id: Not(In(productosExcluded)),
            descripcion: Like(`%${pattern}%`),
          },
        ],
        take: 5,
      });
    }

    return response;
  }

  async fetchIngresosByPattern(consecutivo: number, pattern: string, incluyeEgresados: boolean) {
    try {
      const consecutivoFt = +consecutivo;

      const param = !isNaN(consecutivoFt) ? consecutivo.toString() + '%' : '%' + pattern + '%';

      const condition = !isNaN(consecutivoFt)
        ? ` WHERE u.AINCONSEC LIKE '${param}'`
        : ` WHERE p.GPANOMCOM LIKE '${param}'`;

      const sqlIncluyeEgresados = incluyeEgresados === false ? ' AND u.AINFECEGRE IS NOT NULL' : '';

      const qr = `SELECT TOP(5) u.OID id, u.AINCONSEC consecutivo, p.GPANOMCOM nombreCompletoPaciente FROM ADNINGRESO u
      inner join GENPACIEN p on p.OID = u.GENPACIEN${condition}${sqlIncluyeEgresados}`;

      const query = await this.conn.query(qr);

      return query;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
