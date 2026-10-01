import { BadRequestException, Get, Param, Query } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { BaseSource } from '@common/infrastructure/services';

@CommonGuards()
@ApiTags('V1 - Resources')
@Controller('hpn/v1/resources/subgrupos')
export class ResourcesSubgruposController extends BaseSource {
  @Get()
  async getAllSubgroup(@Query('centroId') centroId: number) {
    try {
      return await this.conn.query(
        `SELECT
        DISTINCT (A.OID) id,
        A.HSUCODIGO codigo,
        A.HSUNOMBRE nombre
        FROM HPNSUBGRU A
        INNER JOIN HPNDEFCAM B ON A.OID = B.HPNSUBGRU
        ${centroId ? `WHERE B.ADNCENATE = ${centroId}` : ''}`
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
