import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { DIETAS_FAMILIARES, MERIENDAS } from '@lgc/die/infrastructure/precio-dietas/common';
import { motivosDevolucionDietaTypeFactory } from '@lgc/die/domain/types/local';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { FetchDietasByFechaHandler, DietasCrudHandler } from '../handlers';
import { UpdateDietaDto } from '@lgc/die/application/data-transfers';
import { DIE_AUTHORITIES } from '@lgc/die/application/constants';
import { removeTimeZone } from '@common/application/services';
import { getDateRangeByDay } from '../helpers';
import { CreateDietaDto } from '../dtos';

@CommonGuards()
@ApiTags('v1 - Dietas')
@Controller('dim/dietas/v1')
export class DietasController {
  constructor(
    private _fetchDietasByFecha: FetchDietasByFechaHandler,
    private _dietasCrud: DietasCrudHandler
  ) {}

  @Authorities([DIE_AUTHORITIES.REGISTRAR])
  @Get('pacientes-by-subgrupo')
  async fetchPacientesBySubgrupo(
    @Query('centroId') centroId: number,
    @Query('horarioId') horarioId: number,
    @Query('subgrupoCode') subgrupoCode: string,
    @Query('fechaJornada') fechaJornada: Date
  ) {
    try {
      fechaJornada
        ? (fechaJornada = new Date(removeTimeZone(fechaJornada)))
        : (fechaJornada = removeTimeZone(new Date()));
      return await this._fetchDietasByFecha.fetchPacientesBySubgrupo(
        +centroId,
        +horarioId,
        subgrupoCode,
        fechaJornada
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([DIE_AUTHORITIES.REGISTRAR, DIE_AUTHORITIES.REGISTRAR_EXTRATIME])
  @Post('registrar-subgrupo-jornada')
  async registrarSubgrupoEnJornada(@Body() payload: CreateDietaDto) {
    return this._dietasCrud.createBySubgrupo(payload);
  }

  @Authorities([DIE_AUTHORITIES.REGISTRAR, DIE_AUTHORITIES.REGISTRAR_EXTRATIME])
  @Put('actualizar-dieta')
  async update(@Body() dieta: UpdateDietaDto) {
    try {
      await this._dietasCrud.updateDieta(dieta);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([DIE_AUTHORITIES.FACTURACION])
  @Get('fetch-dietas-by-periodo')
  async getJornadaDietasByPeriodo(
    @Query('fechaInicial') fechaInicial: Date,
    @Query('fechaFinal') fechaFinal: Date
  ) {
    fechaInicial = removeTimeZone(new Date(`${fechaInicial}:00:00:00`));
    fechaFinal = removeTimeZone(new Date(`${fechaFinal}:23:59:59`));
    const dateRange = getDateRangeByDay(fechaInicial, fechaFinal);
    const data = await this._fetchDietasByFecha.byRange(dateRange);

    const result: any[] = [];

    data.forEach(d => {
      let res = { fecha: d.fecha, data: [], totalNoRecibidas: 0 };
      d.data.forEach(el => {
        el.dieJornadas.forEach(jor => {
          const dietas: any[] = [];

          jor.dieSubgrupos.forEach(sg => {
            sg.dietas.forEach(die => {
              if (die.dietaRecibida === false) res.totalNoRecibidas += die.valorDieta;
              if (die.meriendaRecibida === false) res.totalNoRecibidas += die.valorMerienda;
              if (die.dietaFamiliarRecibida === false) {
                res.totalNoRecibidas += die.valorDietaFamiliar;
              }

              const dieta = {
                id: die.id,
                cama: die.cama,
                canBeDeleted: false,
                consistencia:
                  die.dietaRecibida === false ? 'NO APLICA' : die.consistencia || 'NO APLICA',
                tipo: die.dietaRecibida === false ? 'NO APLICA' : die.tipo || 'NO APLICA',
                createdAt: sg.fecha,
                dietasExtraordinarias: [],
                enAislamiento: die.enAislamiento,
                motivoDevolucion: die.motivoDevolucionCode
                  ? motivosDevolucionDietaTypeFactory(die.motivoDevolucionCode).getForHumans()
                  : null,
                observacion: die.observacion,
                observacionDevolucion: die.observacionDevolucion,
                paciente: {
                  nombreCompleto: die.paciente.nombreCompleto,
                  fechaNacimiento: die.paciente.fechaNacimiento,
                },
                precio: die.consistencias.length ? die.consistencias[0].price : 0,
                subgrupo: sg.subgrupo,
              };

              die.extraordinarias.forEach(et => {
                if (MERIENDAS.indexOf(et.code) >= 0) {
                  if (die.meriendaRecibida !== false) {
                    dieta.dietasExtraordinarias.push({
                      consistencia: et.consistencia,
                      precio: et.price,
                      tipo: et.tipo,
                    });
                  }
                }
                if (DIETAS_FAMILIARES.indexOf(et.code) >= 0) {
                  if (die.dietaFamiliarRecibida !== false) {
                    dieta.dietasExtraordinarias.push({
                      consistencia: et.consistencia,
                      precio: et.price,
                      tipo: et.tipo,
                    });
                  }
                }
              });

              dietas.push(dieta);
            });
          });

          res.data.push({
            id: jor.id,
            centro: el.centro,
            fecha: d.fecha,
            dietas,
            estado: { code: 3, forHumans: 'RECIBIDA' },
            jornada: jor.jornada,
          });
        });
      });

      result.push(res);
    });

    return result;
  }
}
