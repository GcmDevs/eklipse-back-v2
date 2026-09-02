import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import {
  AuditoriaFetchIngresosImpl,
  AuditoriaRecursosImpl,
  AuditoriaReporteImpl,
} from '@hpn/lgc/aud/infrastructure/repositories';
import { HPN_AUTHORITIES } from '@authorities';
import {
  ACTOR_RESPONSABLE_VALUES,
  AGRU_ESTANCIA_PROLONGADA_ERP_VALUES,
  AGRU_ESTANCIA_PROLONGADA_IPS_VALUES,
  CLASIFICACION_EVENTO_VALUES,
  CONDICION_EGRESO_VALUES,
  CRITERIO_UCI_VALUES,
  DESTINO_EGRESO_VALUES,
  ESTANCIA_PROLONGADA_ERP_USUARIO_VALUES,
  ESTANCIA_PROLONGADA_IPS_VALUES,
  ESTUDIO_DX_VALUES,
  EVENTO_SEGURIDAD_CLINICA_VALUES,
  FALLAS_ATENCION_VALUES,
  MEDICAMENTO_TRAZADOR_VALUES,
  TIPO_HOSPITALIZACION_VALUES,
  TIPO_INTERNACION_VALUES,
} from '@hpn/lgc/aud/types/hpn/auditoria';
import { cloneDeep } from 'lodash';
import { AuditoriaReporteOneByOneImpl } from '@hpn/lgc/aud/infrastructure/repositories/reporte-one-by-one.impl';

@CommonGuards()
@Controller('v1/hpn/auditoria')
export class RecursosAuditoriaController {
  constructor(
    private _recursos: AuditoriaRecursosImpl,
    private _fetchIngresos: AuditoriaFetchIngresosImpl,
    private _reporte: AuditoriaReporteImpl,
    private _reporteOneByOne: AuditoriaReporteOneByOneImpl
  ) {}

  @Get('reporte')
  public async fetchReporte(@Query('start') start: Date, @Query('end') end: Date) {
    try {
      return await this._reporte.execute(start, end);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('reporte-one-by-one')
  public async fetchReporteOneByOne(@Query('start') start: Date, @Query('end') end: Date) {
    try {
      return await this._reporteOneByOne.execute(start, end);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-ingresos')
  public async fetchIngresos(
    @Query('pattern') pattern: string,
    @Query('subGrupoId') subGrupoId: number
  ) {
    try {
      return await this._fetchIngresos.execute(pattern, +subGrupoId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-all-ingresos')
  public async fetchAllIngresos() {
    try {
      return await this._fetchIngresos.execute(undefined, undefined);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-medicos-by-ingreso/:ingresoId')
  public async fetchMedicos(@Param('ingresoId') ingresoId: number) {
    try {
      return await this._recursos.fetchMedicos(+ingresoId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-medicos')
  public async fetchAllMedicos(
    @Query('pattern') pattern: string,
    @Query('especialidadId') especialidadId: number
  ) {
    try {
      return await this._recursos.fetchAllMedicos(pattern, +especialidadId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-especialidades/:ingresoId')
  public async fetchEspecialidades(@Param('ingresoId') ingresoId: number) {
    try {
      return await this._recursos.fetchEspecialidades(+ingresoId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-especialidades')
  public async fetchAllEspecialidades(@Query('pattern') pattern: string) {
    try {
      return await this._recursos.fetchAllEspecialidades(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-criterios-uci')
  public async fetchCriteriosUCI() {
    try {
      return CRITERIO_UCI_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-falla-atencion')
  public async fetchFallaAtencion(@Query('pattern') pattern: string) {
    try {
      return FALLAS_ATENCION_VALUES.filter(
        r =>
          r.getForHumans().toLocaleLowerCase().includes(pattern.toLocaleLowerCase()) ||
          r.getAbbreviation().toLocaleLowerCase().includes(pattern.toLocaleLowerCase())
      ).slice(0, 5);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-clasificacion-eventos')
  public async fetchClasificacionEventos() {
    try {
      return CLASIFICACION_EVENTO_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-tipos-hospitalizacion')
  public async fetchTiposHospitalizacion() {
    try {
      return TIPO_HOSPITALIZACION_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-diagnosticos')
  public async fetchDiagnosticos(@Query('pattern') pattern: string) {
    try {
      return await this._recursos.fetchDiagnosticos(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-servicios-ips')
  public async fetchServiciosIps(@Query('pattern') pattern: string) {
    try {
      return await this._recursos.fetchServiciosIps(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-servicios')
  public async fetchServicios(@Query('pattern') pattern: string) {
    try {
      return await this._recursos.fetchServicios(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-subgrupos')
  public async fetchSubgrupos() {
    try {
      return await this._recursos.fetchSubgrupos();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-medicamentos-trazadores')
  public async fetchMedicamentosTrazadores() {
    try {
      return MEDICAMENTO_TRAZADOR_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-condicion-egresos')
  public async fetchCondicionEgresos() {
    try {
      return CONDICION_EGRESO_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-destino-egresos')
  public async fetchDestinoEgresos() {
    try {
      return DESTINO_EGRESO_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-evento-seguridad-clinica')
  public async fetchEventoSeguridadClinica(@Query('pattern') pattern: string) {
    try {
      return EVENTO_SEGURIDAD_CLINICA_VALUES;
    } catch (error: any) {
      return [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-estudios-dx')
  public async fetchEstudioDx() {
    try {
      return ESTUDIO_DX_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-actor-responsable')
  public async fetchActorResponsable() {
    try {
      return ACTOR_RESPONSABLE_VALUES;
    } catch (error: any) {
      [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-estancia-prolongada-erp-usuario')
  public async fetchEstanciaProlongadaErpUsuario(@Query('pattern') pattern: string) {
    try {
      return ESTANCIA_PROLONGADA_ERP_USUARIO_VALUES;
    } catch (error: any) {
      return [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-estancia-prolongada-ips')
  public async fetchEstanciaProlongadaIps(@Query('pattern') pattern: string) {
    try {
      return ESTANCIA_PROLONGADA_IPS_VALUES;
    } catch (error: any) {
      return [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-tipo-internacion')
  public async fetchTipoInternacion(@Query('pattern') pattern: string) {
    try {
      return TIPO_INTERNACION_VALUES;
    } catch (error: any) {
      return [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-agru-estan-prolon-erp')
  public async fetchAgruEstanProlonErp() {
    try {
      return cloneDeep(AGRU_ESTANCIA_PROLONGADA_ERP_VALUES).map(a => {
        const ITEMS = ESTANCIA_PROLONGADA_ERP_USUARIO_VALUES.filter(
          i => i.getAgrupador().getCode() == a.getCode()
        );
        a.setItems(ITEMS);
        return a;
      });
    } catch (error: any) {
      return [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-agru-estan-prolon-ips')
  public async fetchAgruEstanProlonIps() {
    try {
      return cloneDeep(AGRU_ESTANCIA_PROLONGADA_IPS_VALUES).map(a => {
        const ITEMS = ESTANCIA_PROLONGADA_IPS_VALUES.filter(
          i => i.getAgrupador().getCode() == a.getCode()
        );
        a.setItems(ITEMS);
        return a;
      });
    } catch (error: any) {
      return [];
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get('fetch-diagnosticos-by-ingreso/:ingresoId')
  public async fetchDiagnosticosByIngreso(
    @Param('ingresoId') ingresoId: number,
    @Query('fecha') fecha: Date
  ) {
    try {
      return this._recursos.fetchDiagnosticosById(+ingresoId, fecha);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
