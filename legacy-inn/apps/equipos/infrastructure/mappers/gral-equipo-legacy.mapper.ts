import {
  ResponseActivoLegacyDto,
  ResponseAreaLegacyDto,
  ResponseClasificacionLegacyDto,
  ResponseDepartamentoLegacyDto,
  ResponseGeneralActivoLegacyDto,
  ResponseProductoLegacyDto,
  ResponseProveedorLegacyDto,
  ResponseResponsableLegacyDto,
} from '@equipos/presentation/dto';
import { ResponseMarcaDto, ResponseModeloDto } from '@equipos/presentation/dto/marca.dto';
import { GeneralActivoLegacyView } from '../persistence/views/external';

export class GeneralActivoLegacyMapper {
  static toResponse(
    view: GeneralActivoLegacyView,
    marca?: ResponseMarcaDto | null,
    modelo?: ResponseModeloDto | null
  ): ResponseGeneralActivoLegacyDto | null {
    if (!view) return null;

    const activo: ResponseActivoLegacyDto = {
      id: view.activoId,
      numPlaca: view.activoNumeroPlaca,
      fechaCompra: view.fechaCompra,
    };

    const responsable: ResponseResponsableLegacyDto = {
      id: view.responsableId,
      codigo: view.responsableCodigo,
      nombre: view.responsableNombre,
    };

    const area: ResponseAreaLegacyDto = {
      id: view.areaId,
      codigo: view.areaCodigo,
      nombre: view.areaNombre,
    };

    const departamento: ResponseDepartamentoLegacyDto = {
      id: view.departamentoId,
      codigo: view.departamentoCodigo,
      nombre: view.departamentoNombre,
    };

    const producto: ResponseProductoLegacyDto = {
      id: view.productoId,
      codigo: view.productoCodigo,
      nombre: view.productoNombre,
      precioSugerido: view.productoPrecioSugerido,
    };

    const clasificacion: ResponseClasificacionLegacyDto = {
      id: view.clasificacionId,
      nombre: view.clasificacionNombre,
    };

    const proveedor: ResponseProveedorLegacyDto = {
      id: view.proveedorId,
      codigo: view.proveedorCodigo,
      nombre: view.proveedorNombre,
      direccion: view.proveedorDireccion,
      telefono1: view.proveedorTelefono1,
      telefono2: view.proveedorTelefono2,
      terceroId: view.proveedorTerceroId,
    };

    return {
      id: view.id,
      numPlaca: view.numeroPlaca,
      numSerie: view.numeroSerie,
      observaciones: view.observaciones,
      garantia: view.aplicaGarantia,
      fechaVectoGarantia: view.fechaVencimientoGarantia,
      fechaInstalacion: view.fechaInstalacion,
      mantenimiento: view.tiempoMantenimiento,
      numeroFactura: view.numeroFactura,
      tipoManualCode: view.tipoManualCodigo,
      modeloLegacyNombre: view.modeloLegacyNombre,
      marcaLegacyNombre: view.marcaLegacyNombre,
      marca: marca ?? null,
      modelo: modelo ?? null,

      fabricante: view.fabricante,
      distribuidor: view.distribuidor,
      fechaCompra: view.fechaCompra,

      activo,
      responsable,
      area,
      departamento,
      producto,
      clasificacion,
      proveedor,
    };
  }

  static toResponseList(views: GeneralActivoLegacyView[]): ResponseGeneralActivoLegacyDto[] {
    if (!views?.length) return [];
    return views.map(item => this.toResponse(item));
  }
}
