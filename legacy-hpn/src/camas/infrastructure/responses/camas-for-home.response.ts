import { ApiProperty } from '@nestjs/swagger';

export class CamaForHomeRes {
  @ApiProperty()
  OID: number;
  @ApiProperty()
  ADNCENATE: number;
  @ApiProperty()
  PACPRINOM: string;
  @ApiProperty()
  PACSEGNOM: string;
  @ApiProperty()
  PACPRIAPE: string;
  @ApiProperty()
  PACSEGAPE: string;
  @ApiProperty()
  ADNINGRESO: number;
  @ApiProperty()
  AINCONSEC: number;
  @ApiProperty()
  AINFECING: Date;
  @ApiProperty()
  MUNNOMMUN: string;
  @ApiProperty()
  GEBNOMBRE: string;
  @ApiProperty()
  PACDIRECCION: string;
  @ApiProperty()
  HCAAISLAMIEN: number;
  @ApiProperty()
  HCABLOPOR: number;
  @ApiProperty()
  HCACODIGO: string;
  @ApiProperty()
  HCAESTADO: number;
  @ApiProperty()
  HCANOMBRE: string;
  @ApiProperty()
  HCANUMHABI: string;
  @ApiProperty()
  HCAOBSHOS: number;
  @ApiProperty()
  HPNGRUPOS: number;
  @ApiProperty()
  HGRCODIGO: string;
  @ApiProperty()
  HGRNOMBRE: string;
  @ApiProperty()
  HPNSUBGRU: number;
  @ApiProperty()
  HSUCODIGO: string;
  @ApiProperty()
  HSUNOMBRE: string;
  @ApiProperty()
  HPNTIPOCA: number;
  @ApiProperty()
  GENDETCON: number;
  @ApiProperty()
  GDECODIGO: string;
  @ApiProperty()
  GDENOMBRE: string;
  @ApiProperty()
  GENTERCER1: number;
  @ApiProperty()
  TERNUMDOC: string;
  @ApiProperty()
  TERNOMCOM: string;
  @ApiProperty()
  PACNOMCOM: string;
  @ApiProperty()
  TOTAL_CONSUMO: number;
}

export class GastoCamaForHomeRes {
  @ApiProperty()
  ADNINGRESO: number;
  @ApiProperty()
  SUMA: number;
}
