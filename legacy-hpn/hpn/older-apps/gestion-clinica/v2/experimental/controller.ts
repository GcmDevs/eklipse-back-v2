import { Controller, Get } from '@nestjs/common';
import { GestionClinicaService } from '../gestion-clinica.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('v2 - experimental')
@Controller('experimental')
export class ExperimentalController {
  constructor(private readonly permissionService: GestionClinicaService) {}

  @Get()
  async getPermiss() {
    //return json;
    return await this.permissionService.exp();
  }
}
