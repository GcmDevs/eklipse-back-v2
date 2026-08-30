import { Injectable } from '@nestjs/common';
import {
  AprobacionCotizacionByCtCDto,
  AprobacionSolicitudByGerenteDto,
  ConvertirACajaMenorExpressDto,
  ItemsRecomendadosByCotizadorDto,
  UpdateItemSolicitudCompraDto,
  UpdateSolicitudColaboradorDto,
} from '@inn/lgc/ctc/presentation/dtos';
import {
  ItemsRecomendadosByCotizadorImpl,
  UpdateSolicitudColaboradorImpl,
  AprobacionGerenteImpl,
  FetchMisPermisosImpl,
  UpdateItemSolicitudCompraImpl,
} from './solicitud-services';

@Injectable()
export class SolicitudServicesSource {
  constructor(
    private _fetchMisPermisos: FetchMisPermisosImpl,
    private _updateSolicitudColaborador: UpdateSolicitudColaboradorImpl,
    private _itemsRecomendadosByCotizador: ItemsRecomendadosByCotizadorImpl,
    private _aprobacionGerente: AprobacionGerenteImpl,
    private _updateItemSolicitudCompra: UpdateItemSolicitudCompraImpl
  ) {}

  public async fetchMisPermisos() {
    return this._fetchMisPermisos.execute();
  }

  public async updateSolicitudColaborador(payload: UpdateSolicitudColaboradorDto) {
    return await this._updateSolicitudColaborador.execute(payload);
  }

  public async aprobacionGerente(payload: AprobacionSolicitudByGerenteDto) {
    return await this._aprobacionGerente.execute(payload);
  }

  public async recomendarItemsCotizaciones(payload: ItemsRecomendadosByCotizadorDto) {
    return this._itemsRecomendadosByCotizador.recomendarItemsCotizaciones(payload);
  }

  public async aprobacionItemsCotizadosCtC(payload: AprobacionCotizacionByCtCDto) {
    return await this._itemsRecomendadosByCotizador.aprobacionItemsCotizadosCtC(payload);
  }

  public async cajaMenorExpress(payload: ConvertirACajaMenorExpressDto) {
    return await this._itemsRecomendadosByCotizador.cajaMenorExpress(payload);
  }

  public async updateItemSolicitudCompra(payload: UpdateItemSolicitudCompraDto) {
    return await this._updateItemSolicitudCompra.execute(payload);
  }
}
