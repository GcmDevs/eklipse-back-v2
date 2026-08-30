import { Injectable } from '@nestjs/common';
import {
  ReportarOrdenCompraListaEntregaDto,
  ContabilizarOrdenCompraDto,
  ProgramarOrdenCompraDto,
  AgregarOrdenCompraDto,
  PagarOrdenCompraDto,
  RecibirOrdenCompraDto,
  ConfirmarOrdenCompraDto,
} from '@inn/lgc/ctc/presentation/dtos';
import {
  ReportarOrdenCompraListaParaEntregaImpl,
  ContabilizarOrdenCompraImpl,
  ProgramarOrdenCompraImpl,
  AgregarOrdenCompraImpl,
  PagarOrdenCompraImpl,
  RecibirOrdenCompraImpl,
  ConfirmarOrdenCompraImpl,
  UpdateProveedorCotizacionImpl,
} from './cotizacion-services';
import { GcmContexts } from '@common/domain/types';

@Injectable()
export class CotizacionServicesSource {
  constructor(
    private _reportarOCListaParaEntrega: ReportarOrdenCompraListaParaEntregaImpl,
    private _updateProveedor: UpdateProveedorCotizacionImpl,
    private _contabilizarOC: ContabilizarOrdenCompraImpl,
    private _programarOC: ProgramarOrdenCompraImpl,
    private _confirmarOC: ConfirmarOrdenCompraImpl,
    private _agregarOC: AgregarOrdenCompraImpl,
    private _recibirOC: RecibirOrdenCompraImpl,
    private _pagarOC: PagarOrdenCompraImpl
  ) {}

  public async agregarOrdenCompra(payload: AgregarOrdenCompraDto) {
    return await this._agregarOC.execute(payload);
  }

  public async confirmarOrdenCompra(payload: ConfirmarOrdenCompraDto) {
    return await this._confirmarOC.execute(payload);
  }

  public async programarOrdenCompra(payload: ProgramarOrdenCompraDto) {
    return await this._programarOC.execute(payload);
  }

  public async contabilizarOrdenCompra(body: ContabilizarOrdenCompraDto) {
    if (body.consecutivo) return this._contabilizarOC.cuentaXPagar(body);
    else if (body.codigoComprobanteContable) return this._contabilizarOC.comprobanteContable(body);
    else return false;
  }

  public async pagarOrdenCompra(payload: PagarOrdenCompraDto) {
    return await this._pagarOC.execute(payload);
  }

  public async reportarOCListaParaEntrega(payload: ReportarOrdenCompraListaEntregaDto) {
    return await this._reportarOCListaParaEntrega.execute(payload);
  }

  public async recibirOrdenCompra(payload: RecibirOrdenCompraDto) {
    return await this._recibirOC.execute(payload);
  }

  public async updateProveedor(ctxCode: GcmContexts, cotizacionId: number, proveedorId: number) {
    return await this._updateProveedor.execute(ctxCode, cotizacionId, proveedorId);
  }
}
