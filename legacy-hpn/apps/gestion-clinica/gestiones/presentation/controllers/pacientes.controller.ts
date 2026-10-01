import { Controller, Get, Param } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { UbicacionPacienteTypeCode } from '@ctypes/gcn';
import { HPN_GCN_LISTA_CHEQUEO } from '@gestion-clinica/gestiones/application/constants';
import { PacientesService } from '@gestion-clinica/gestiones/infrastructure/services';

@CommonGuards()
@Controller('v1/hpn/gtc/pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get('lista-chequeo')
  public fetchListaChequeo() {
    return HPN_GCN_LISTA_CHEQUEO;
  }

  @Get('revaloracion')
  public fetchPacientesRevaloracion() {
    return this.pacientesService.pacientesRevaloracion();
  }

  @Get('can-add-new-check/:pacienteId')
  public canAddNewCheck(@Param('pacienteId') pacienteId: number) {
    return this.pacientesService.canAddNewCheck(+pacienteId);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Get('check/:pacienteId/:ubicacion')
  public checkPaciente(
    @Param('pacienteId') pacienteId: number,
    @Param('ubicacion') ubicacion: number
  ) {
    return this.pacientesService.addCheck(+pacienteId, +ubicacion as UbicacionPacienteTypeCode);
  }
}
