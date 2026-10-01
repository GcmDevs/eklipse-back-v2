import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CensusPatientsService } from './census-patients.service';
import { CommonGuards } from '@common/presentation/decorators';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/census-patients')
export class CensusPatientsController {
  constructor(private readonly censusPatientsService: CensusPatientsService) {}

  @Get()
  async getCensusPatients() {
    const patients = await this.censusPatientsService.getPatients();
    return patients;
  }

  @Get('subgroup')
  async prueba(@Query('subgroup') subgroup: string) {
    const patients = await this.censusPatientsService.getPatientsForSubgroup(subgroup);
    return patients;
  }

  @Get('controlDesk')
  async controlDesk(@Query('Ingreso') ingreso: string) {
    const control = await this.censusPatientsService.getControlDesk(ingreso);
    return control;
  }
}
