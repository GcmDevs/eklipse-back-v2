import { Controller, Get } from '@nestjs/common';
import * as lodash from 'lodash';
import { agrupadores, Genserips, newRelaciones } from '../registro-contratos.constants';
import { ApiTags } from '@nestjs/swagger';
import { BaseSource } from '@common/infrastructure/services';

@ApiTags('v2 - testing')
@Controller('registro-contratos')
export class RegistroContratosController extends BaseSource {
  @Get()
  public async execute() {
    const newCodes = lodash.cloneDeep(newRelaciones).map(_ => `'${_.cups}'`);

    const genseripsNoRegistrados: Genserips[] = [];
    const genseripsRegistrados: Genserips[] = [];

    const agrupadoresNoRegistrados: string[] = [];

    const exist: { id: number; codigo: string }[] = await this.conn.query(
      `SELECT OID id, SIPCODIGO codigo FROM GENSERIPS WHERE SIPCODIGO IN (${newCodes})`
    );

    const ordenAgrupador: { nombre: string; orden: number }[] = await this.conn.query(`
    SELECT AGRUPADOR nombre, ORDEN orden FROM GCMFICHCON WHERE GDECODIGO = '8006'`);

    newRelaciones.forEach(_ => {
      if (!exist.filter(_2 => _2.codigo === _.cups).length) {
        /* OBTENER GENSERIPS NO REGISTRADOS */
        genseripsNoRegistrados.push(_);
      } else {
        genseripsRegistrados.push(_);
      }
      /* VERIFICAR QUE AGRUPADORES NO HAN SIDO REGISTRADOS */
      if (!agrupadores.includes(_.grupo) && !agrupadoresNoRegistrados.includes(_.grupo)) {
        agrupadoresNoRegistrados.push(_.grupo);
      }
    });

    // METODO PARA SABER CUALES CODIGOS NO SE REGISTRARON CORRECTAMENTE
    /*
    const abc: { COD_SERIPS: string }[] = await this.connection.query(
      `SELECT COD_SERIPS FROM GCMAGRUPGP where contrato = '8006'`
    );

    let codigosNoRegistradosCorrectamente = '';

    genseripsRegistrados.map(_ => {
      if (!abc.filter(_4 => _4.COD_SERIPS === _.cups).length) {
        codigosNoRegistradosCorrectamente += _.cups + ' ';
      }
    });

    */

    let queryparaRegistrarAgrupadores = `INSERT INTO GCMAGRUPGP
    (COD_SERIPS, COD_CUPS, NOM_SERVIPS, AGRUPADOR, ORDEN, CONTRATO) VALUES `;

    genseripsRegistrados.forEach((_, i) => {
      const orden = ordenAgrupador.filter(agr => agr.nombre === _.grupo);

      queryparaRegistrarAgrupadores += `('${_.cups}', '${_.cups}', '${_.descripcion}', '${
        _.grupo
      }', ${orden[0].orden}, '8006')${i === genseripsRegistrados.length - 1 ? ';' : ','}`;
    });

    return queryparaRegistrarAgrupadores;
    return {
      //queryparaRegistrarAgrupadores,
      codigosPorVerificar: newCodes.length,
      codigosVerificados: exist.length,
      genseripscantNoRegistrados: genseripsNoRegistrados.length,
      genseripsNoRegistrados: genseripsNoRegistrados,
      genseripsRegistrados: genseripsRegistrados,
      gruposNoRegistrados: agrupadoresNoRegistrados,
    };
  }
}
