import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GestionClinicaService } from './gestion-clinica.service';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ReasignarDto } from './dtos/management.dto';
import { GcmContextCode } from '@common/domain/types';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/gestion-clinica')
export class GestionClinicaController {
  constructor(private readonly service: GestionClinicaService) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Get('diagnosticos/:consecutivo')
  async getDiagnosticos(@Req() @Param('consecutivo') consecutivo: string) {
    return await this.service.getDiagnosticos(+consecutivo);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Patch('reasignar')
  async reasignar(@Body() body: ReasignarDto) {
    return await this.service.reasignar(body);
  }

  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_AREAS,
    HPN_AUTHORITIES.CENSOS.PACIENTES,
    HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES,
    HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES,
  ])
  @Get('suggestions')
  async getSuggestions() {
    return await this.service.getSuggestions();
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Get('v2/evolutions')
  async getEvolutions() {
    return await this.service.getEvolutions();
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Get('v2/evolutions/:documento')
  async getEvolutionsBydocumento(@Param('documento') documento: string) {
    return await this.service.getEvolutionsByDocumento(documento);
  }

  @Get('v2/find-pacientes-by-subgrupo/:subgrupo')
  async getPacientesBySUbgrupo(@Req() @Param('subgrupo') subgrupo: string) {
    return await this.service.fetchBySubgrupo(subgrupo);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Get('pending-interconsultations/:patient')
  async getPendingInterconsultations(@Req() @Param('patient') patient: string) {
    return await this.service.getPendingInterconsultations(+patient);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_AREAS])
  @Post('set-users-to-area')
  async setUsersToArea(@Body() body: any) {
    return await this.service.addUsersToArea(body);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_AREAS])
  @Post('remove-users-to-area')
  async removeUsersToArea(@Body() body: any) {
    return await this.service.removeUsersFromArea(body);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Post()
  async createGestion(@Body() body: any) {
    return this.service.createGestion(body);
  }
  @Get('patient=:patient/consecutive=:consecutive')
  async gestionesPorPaciente(
    @Req() @Param('patient') paciente: string,
    @Req() @Param('consecutive') consecutivo: string
  ) {
    return this.service.gestionesPorPaciente(+paciente, +consecutivo);
  }

  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_AREAS,
    HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES,
  ])
  @Get('get-user-areas')
  async getUserAreas() {
    return await this.service.getUserAreas();
  }

  @Authorities([
    HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_AREAS,
    HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES,
  ])
  @Get('get-user-areas/:id')
  async getAreasByUser(@Req() @Param('id') id: number) {
    return await this.service.getUserAreas(+id);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES])
  @Post('get-managements-by-area')
  async getManagementsByArea(@Body() body: number[]) {
    return await this.service.findManagementsByArea(body);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES])
  @Post('get-traslados-by-area')
  async getTrasladosByArea(@Body() body: number[]) {
    return await this.service.findTrasladosByArea(body);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ADMINISTRAR_GESTIONES])
  @Get('change-state/:management/:state')
  async changeState(
    @Req() @Param('management') management: number,
    @Req() @Param('state') state: string,
    @Req() @Query('contextoCode') contextoCode: GcmContextCode
  ) {
    return await this.service.changeManagementState(+management, +state, contextoCode);
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.TIEMPOS_EGRESOS])
  @Get('fechas-salidas/:inicio/:final')
  async fechasSalidas(@Req() @Param('inicio') inicio: Date, @Req() @Param('final') final: Date) {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    return await this.service.fechasSalidas(inicio, final);
  }
}
