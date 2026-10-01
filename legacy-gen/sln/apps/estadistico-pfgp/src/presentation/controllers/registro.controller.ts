import { BaseSource } from '@common/infrastructure/services';
import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AgrupadorServicioIpsBasicOrm, ServicioIpsOrm } from '@sln/pfgp/infrastructure/orm';
import { VALORES as GENSERIPS, GenseripsI } from './registro.constants';
import { ENVIRONMENTS } from 'src/app.environments';
import { In } from 'typeorm';

@CommonGuards()
@Controller('v1/pfgp/registro')
export class RegistroController extends BaseSource {
  /* @Get('abc')
  public async abc() {
    const agrupadorRp = this.qr.manager.getRepository(AgrupadorOrm);
    const agrupadores = await agrupadorRp.find({ where: { id: MoreThan(73) } });

    const g: GenseripsI[] = [];
    const f: GenseripsI[] = [];

    data.forEach(d => {
      const agrup = agrupadores.filter(ag => ag.nombre.trim().includes(d.NOMBRE.trim()));
      g.push({
        codigo: d.CUPS,
        idAgrupador: agrup[0].id,
      });
    });

    return g;
  }  */

  @Get('asignar-puntos-to-genserips')
  public async asignarPuntosToGenserips() {
    if (!ENVIRONMENTS.production) {
      try {
        const GENSERIPS_AUTOCOMPLETADOS: GenseripsI[] = [];

        GENSERIPS.forEach(g => {
          GENSERIPS_AUTOCOMPLETADOS.push(
            { codigo: `${g.codigo}`, idAgrupador: g.idAgrupador },
            { codigo: `${g.codigo}.`, idAgrupador: g.idAgrupador },
            { codigo: `${g.codigo}..`, idAgrupador: g.idAgrupador }
          );
        });

        return GENSERIPS_AUTOCOMPLETADOS;
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    } else {
      throw new BadRequestException('No está en modo desarrollador');
    }
  }

  @Get('asignar-id-to-genserips-by-codigo')
  public async asignarIdToGenseripsByCodigo() {
    if (!ENVIRONMENTS.production) {
      try {
        const servicioIpsRp = this.conn.getRepository(ServicioIpsOrm);
        const codigosServicios = GENSERIPS.map(el => el.codigo);

        const serviciosIps: ServicioIpsOrm[] = [];

        let codSerCons: string[] = [];

        for (let index = 0; index < codigosServicios.length; index++) {
          const element = codigosServicios[index];
          codSerCons.push(element);

          if (
            codSerCons.length === 1000 ||
            (index === codigosServicios.length - 1 && codSerCons.length)
          ) {
            const tempServiciosIps = await servicioIpsRp.find({
              where: { codigo: In(codSerCons) },
              select: { id: true, codigo: true },
            });

            serviciosIps.push(...tempServiciosIps);
            codSerCons = [];
          }
        }

        const codigosSinServicioRegistrado: GenseripsI[] = [];

        const genseripsWithIds: GenseripsI[] = [];
        GENSERIPS.forEach(genserips => {
          const servicioFiltrado = serviciosIps.filter(s => s.codigo === genserips.codigo);

          if (!servicioFiltrado.length) {
            if (!genserips.codigo.includes('.')) codigosSinServicioRegistrado.push(genserips);
          } else {
            genseripsWithIds.push({
              id: servicioFiltrado[0].id,
              codigo: servicioFiltrado[0].codigo,
              idAgrupador: genserips.idAgrupador,
            });
          }
        });

        return {
          genseripsWithIdsLength: genseripsWithIds.length,
          codigosSinServicioRegistradoLength: codigosSinServicioRegistrado.length,
          genseripsWithIds,
          codigosSinServicioRegistrado,
        };
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    } else {
      throw new BadRequestException('No está en modo desarrollador');
    }
  }

  @Get('relacionar-genserips-agrupadores')
  public async relacionarGenseripsToAgrupadores(@Query('tipo') tipo: number) {
    if (!ENVIRONMENTS.production) {
      try {
        await this.qr.connect();
        await this.qr.startTransaction();
        const agruServRp = this.qr.manager.getRepository(AgrupadorServicioIpsBasicOrm);
        const agruServs: AgrupadorServicioIpsBasicOrm[] = [];

        GENSERIPS.map(r => {
          const as = new AgrupadorServicioIpsBasicOrm();
          as.tipo = tipo;
          as.isEvento = false;
          as.agrupadorId = r.idAgrupador;
          as.servicioId = r.id;
          agruServs.push(as);
        });

        let agruServsForStore: AgrupadorServicioIpsBasicOrm[] = [];

        for (let index = 0; index < agruServs.length; index++) {
          const element = agruServs[index];
          agruServsForStore.push(element);

          if (
            agruServsForStore.length === 520 ||
            (index === agruServs.length - 1 && agruServsForStore.length)
          ) {
            await agruServRp.insert(agruServsForStore);
            agruServsForStore = [];
          }
        }

        await this.qr.commitTransaction();
        return true;
      } catch (error) {
        await this.qr.rollbackTransaction();
        throw new BadRequestException(error.message);
      } finally {
        await this.qr.release();
      }
    } else {
      throw new BadRequestException('No está en modo desarrollador');
    }
  }
}
