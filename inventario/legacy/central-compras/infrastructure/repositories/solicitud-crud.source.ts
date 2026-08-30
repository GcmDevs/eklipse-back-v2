import { Injectable } from '@nestjs/common';
import { GcmContextCode } from '@common/domain/types';
import { TipoCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CancelarSolicitudDto, ManageSolicitudDto } from '@inn/lgc/ctc/presentation/dtos';
import {
  CreateSolicitudImpl,
  CancelarSolicitudImpl,
  FetchComplementoSolicitudImpl,
  FetchResumenSolicitudesImpl,
} from './solicitud-crud';

@Injectable()
export class SolicitudCrudSource {
  constructor(
    private _fetchResumen: FetchResumenSolicitudesImpl,
    private _fetchComplemento: FetchComplementoSolicitudImpl,
    private _cancelar: CancelarSolicitudImpl,
    private _create: CreateSolicitudImpl
  ) {}

  public async fetchResumen(start: Date, end: Date, tipos: TipoCode[]) {
    return await this._fetchResumen.execute(start, end, tipos);
  }

  public async fetchComplemento(id: number, contextCode: GcmContextCode) {
    return await this._fetchComplemento.execute(id, contextCode);
  }

  public async create(payload: ManageSolicitudDto) {
    return await this._create.execute(payload);
  }

  public async cancelar(body: CancelarSolicitudDto) {
    return await this._cancelar.execute(body);
  }
}
