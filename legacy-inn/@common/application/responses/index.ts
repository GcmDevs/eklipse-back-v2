import { GcmContextCode } from '@common/domain/types';
import { ApiProperty } from '@nestjs/swagger';
import { GcmContexts } from '../constants';

export class EntidadBasicaRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  nombre: string;
  nit?: string;
}

export class EntidadBasicaWithNitRes extends EntidadBasicaRes {
  @ApiProperty()
  nit?: string;
}

export class CentroRes extends EntidadBasicaRes {
  @ApiProperty()
  contextoCode: GcmContextCode;
}

export class CtmTypeRes {
  @ApiProperty()
  code: number;
  @ApiProperty()
  forHumans: string;
  @ApiProperty()
  abbreviation?: string;
}

export class UsuarioBasicoRes {
  @ApiProperty()
  cedula: string;
  @ApiProperty()
  nombreCompleto: string;
}

export class NuevaEntidadRes {
  @ApiProperty()
  id: number;
}

export class TDiagnosticoRes {
  fechaFolio: Date;
  diagnostico: {
    codigo: string;
    nombre: string;
  };
  medico: {
    nombre: string;
    documento: string;
  };
  observacion: string;
}
