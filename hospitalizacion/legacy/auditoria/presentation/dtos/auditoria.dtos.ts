import {
  ActorResponsableCode,
  AgruEstanProloErpCode,
  AgruEstanProloIpsCode,
  CondicionEgresoCode,
  CriterioUCICode,
  DestinoEgresoCode,
  EstanciaProlongadaErpUsuarioCode,
  EstanciaProlongadaIpsCode,
  EstudioDXCode,
  EventoSeguridadClinicaCode,
  FallaAtencionCode,
  MedicamentoTrazadorCode,
  TipoHospitalizacionCode,
  TipoIngreNacIPSCode,
  TipoInternacionCode,
} from '@hpn/lgc/aud/types/hpn/auditoria';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MedicamentoTrazadorDto {
  code: MedicamentoTrazadorCode;
  observacion: string;
}

export class EstudioDxDto {
  code: EstudioDXCode;
  inicio: string;
  final: string;
}

export class CreateInternacionDto {
  estanciaId: number;
  fechaInicio: Date;
  fechaFinal: Date;
  tipoCode: TipoInternacionCode;
}

export class CreateAuditoriaDto {
  @IsString()
  @IsOptional()
  estudiosDxObservacion: string;

  @IsNumber()
  @IsOptional()
  ingresoId: number;

  @IsNumber()
  @IsOptional()
  motivoIngresoNacidoEnInstitucionCode: TipoIngreNacIPSCode;

  @IsNumber()
  @IsOptional()
  tipoHospitalizacionCode: TipoHospitalizacionCode;

  @IsNumber()
  @IsOptional()
  criterioUCICode: CriterioUCICode;

  @IsString()
  @IsOptional()
  resumenClinicoGestionIntervencion: string;

  @IsNumber()
  @IsOptional()
  edadGestacionalMadre: number;

  @IsNumber()
  @IsOptional()
  pesoRecienNacido: number;

  @IsNumber()
  @IsOptional()
  fallaAtencionCode: FallaAtencionCode;

  @IsString()
  @IsOptional()
  evenSegCliFechaEvento1: string;

  @IsString()
  @IsOptional()
  evenSegCliFechaReporteEvento1: string;

  @IsString()
  @IsOptional()
  evenSegCliDescripcionEvento1: string;

  @IsNumber()
  @IsOptional()
  evenSegCliClasificacionEvento1Code: EventoSeguridadClinicaCode;

  @IsString()
  @IsOptional()
  evenSegCliFechaEvento2: string;

  @IsString()
  @IsOptional()
  evenSegCliFechaReporteEvento2: string;

  @IsString()
  @IsOptional()
  evenSegCliDescripcionEvento2: string;

  @IsNumber()
  @IsOptional()
  evenSegCliClasificacionEvento2Code: EventoSeguridadClinicaCode;

  @IsString()
  @IsOptional()
  evenSegCliFechaEvento3: string;

  @IsString()
  @IsOptional()
  evenSegCliFechaReporteEvento3: string;

  @IsString()
  @IsOptional()
  evenSegCliDescripcionEvento3: string;

  @IsNumber()
  @IsOptional()
  evenSegCliClasificacionEvento3Code: EventoSeguridadClinicaCode;

  @IsNumber()
  @IsOptional()
  diagnostico1Id: number;

  @IsNumber()
  @IsOptional()
  diagnostico2Id: number;

  @IsNumber()
  @IsOptional()
  diagnostico3Id: number;

  @IsNumber()
  @IsOptional()
  servicio1Id: number;

  @IsNumber()
  @IsOptional()
  servicio2Id: number;

  @IsNumber()
  @IsOptional()
  servicio3Id: number;

  @IsNumber()
  @IsOptional()
  ekGenserips1Id: number;

  @IsNumber()
  @IsOptional()
  ekGenserips2Id: number;

  @IsNumber()
  @IsOptional()
  ekGenserips3Id: number;

  @IsNumber()
  @IsOptional()
  ekGenserips4Id: number;

  @IsOptional()
  @Type(() => MedicamentoTrazadorDto)
  medicamentosTrazadores: MedicamentoTrazadorDto[];

  @IsOptional()
  @Type(() => CreateInternacionDto)
  internaciones: CreateInternacionDto[];

  @IsOptional()
  @Type(() => EstudioDxDto)
  estudiosDx: EstudioDxDto[];

  @IsNumber()
  @IsOptional()
  diasEstanciaDx: number;

  @IsNumber()
  @IsOptional()
  destinoEgresoCode: DestinoEgresoCode;

  @IsNumber()
  @IsOptional()
  condicionEgresoCode: CondicionEgresoCode;

  @IsNumber()
  @IsOptional()
  actorResponsableCode: ActorResponsableCode;

  @IsNumber()
  @IsOptional()
  motivoEstanciaProlongadaErpUsu1Code: EstanciaProlongadaErpUsuarioCode;

  @IsNumber()
  @IsOptional()
  motivoEstanciaProlongadaErpUsu2Code: EstanciaProlongadaErpUsuarioCode;

  @IsNumber()
  @IsOptional()
  motivoEstanciaProlongadaErpUsu3Code: EstanciaProlongadaErpUsuarioCode;

  @IsNumber()
  @IsOptional()
  motivoEstanciaProlongadaIps1Code: EstanciaProlongadaIpsCode;

  @IsNumber()
  @IsOptional()
  motivoEstanciaProlongadaIps2Code: EstanciaProlongadaIpsCode;

  @IsNumber()
  @IsOptional()
  motivoEstanciaProlongadaIps3Code: EstanciaProlongadaIpsCode;

  @IsString()
  @IsOptional()
  fechaNovedadEgresos: string;

  @IsString()
  @IsOptional()
  fechaSolucionNovedad: string;

  @IsNumber()
  @IsOptional()
  especialidad1Id: number;

  @IsString()
  @IsOptional()
  inicioEstanciaInactiva1: string;

  @IsString()
  @IsOptional()
  finEstanciaInactiva1: string;

  @IsNumber()
  @IsOptional()
  especialidad2Id: number;

  @IsNumber()
  @IsOptional()
  agruEstanProlonIpsCode1: AgruEstanProloIpsCode;

  @IsNumber()
  @IsOptional()
  agruEstanProlonIpsCode2: AgruEstanProloIpsCode;

  @IsNumber()
  @IsOptional()
  agruEstanProlonIpsCode3: AgruEstanProloIpsCode;

  @IsString()
  @IsOptional()
  inicioEstanciaInactiva2: string;

  @IsString()
  @IsOptional()
  finEstanciaInactiva2: string;

  @IsNumber()
  @IsOptional()
  especialidad3Id: number;

  @IsNumber()
  @IsOptional()
  agruEstanProlonErpUsuCode1: AgruEstanProloErpCode;

  @IsNumber()
  @IsOptional()
  agruEstanProlonErpUsuCode2: AgruEstanProloErpCode;

  @IsNumber()
  @IsOptional()
  agruEstanProlonErpUsuCode3: AgruEstanProloErpCode;

  @IsString()
  @IsOptional()
  obsEstanProlonErpUsu1: string;

  @IsString()
  @IsOptional()
  obsEstanProlonErpUsu2: string;

  @IsString()
  @IsOptional()
  obsEstanProlonErpUsu3: string;

  @IsString()
  @IsOptional()
  obsEstanProlonIps1: string;

  @IsString()
  @IsOptional()
  obsEstanProlonIps2: string;

  @IsString()
  @IsOptional()
  obsEstanProlonIps3: string;

  @IsString()
  @IsOptional()
  inicioEstanciaInactiva3: string;

  @IsString()
  @IsOptional()
  finEstanciaInactiva3: string;
}
