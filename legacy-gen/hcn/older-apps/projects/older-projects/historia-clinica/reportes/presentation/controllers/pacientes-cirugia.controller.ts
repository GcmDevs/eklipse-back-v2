import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CommonGuards } from '@hcn/old/common/presentation/decorators';
import { BaseSource } from '@hcn/old/common/infrastructure/bases';
import { ApiTags } from '@nestjs/swagger';
import { transforPacientePostquirurgicoResponseToDto } from '@hcn/rft/historia-clinica/reportes/infrastructure/factories';
import { FetchReportesCirugiasQuery } from '@hcn/rft/historia-clinica/reportes/infrastructure/queries';
import { PacientePostquirurgicoDto } from '@hcn/rft/historia-clinica/reportes/application/dtos';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v30/reportes')
export class PacientesCirugiaController extends BaseSource {
  @Get('cirugia')
  async fetchPacientesCirugia(): Promise<PacientePostquirurgicoDto[]> {
    try {
      const result = await this.conn.query(FetchReportesCirugiasQuery());
      const response = transforPacientePostquirurgicoResponseToDto(result);
      return response;
    } catch (error) {
      new BadRequestException(error.message);
    }
  }
}
