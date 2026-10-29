import { Injectable } from '@nestjs/common';
import { GcmContexts } from '@common/domain/types';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource, consecutivosServices, switchConn } from '@common/infrastructure/services';
import { generateOrdenTraslado } from './generator';
import { DocumentoOrm } from '@inn/orm/inn/documentos';
import { UsuarioOrm } from '@inn/orm/gen';
import { OrdenTrasladoOrm } from '@inn/orm/inn/documentos/orden-traslado';
import { estadoDocumentoTypeFactory, TIPOS_DOCUMENTO } from '../../../../@types/inn/documentos';
import {
  AlmacenI,
  clinicaSeleccionada,
  ClinicaSeleccionadaI,
  DetalleI,
  ProveedorI,
} from '../shared';
import { capitalizeFirstLetter } from '@common/application/services';

export interface DataInterfaceI {
  clinica: ClinicaSeleccionadaI;
  fecha: Date;
  estado: string;
  consecutivo: string;
  proveedor: ProveedorI;
  almacenConsignacion: AlmacenI;
  almacenDestino: AlmacenI;
  detalle: DetalleI[];
  descripcion: string;
}

@Injectable()
export class OrdenTrasladoImpl extends BaseSource {
  public async execute(contextCode: GcmContexts, documentoId: number, consecutivo: string) {
    if (!documentoId) documentoId = 0;
    if (!consecutivo) consecutivo = 'UNDEFINED';
    if (consecutivo) consecutivo = consecutivosServices.autocomplete(consecutivo);

    const ekConn = switchConn(gcmContextFactory(contextCode));
    const documentoRp = ekConn.getRepository(DocumentoOrm);
    const ordenTrasladoRp = ekConn.getRepository(OrdenTrasladoOrm);

    const documento = await documentoRp.findOne({
      where: [
        { id: documentoId, tipoCode: TIPOS_DOCUMENTO.TRASLADO_PRODUCTOS_CONSIGNACION.getCode() },
        { consecutivo, tipoCode: TIPOS_DOCUMENTO.TRASLADO_PRODUCTOS_CONSIGNACION.getCode() },
      ],
    });
    if (!documento) throw new Error('No existe la orden de traslado indicada');

    const ordenTraslado = await ordenTrasladoRp.findOne({
      where: { id: documento.id },
      relations: [
        'proveedor',
        'proveedor.tercero',
        'proveedor.tercero.municipio',
        'proveedor.tercero.municipio.departamento',
        'almacenConsignacion',
        'almacenDestino',
        'detalle',
        'detalle.producto',
      ],
    });
    if (!ordenTraslado) throw new Error('No existe el detalle de la orden de traslado indicada');

    const dataMapped: DataInterfaceI = {
      clinica: clinicaSeleccionada(contextCode),
      fecha: documento.fecha,
      estado: capitalizeFirstLetter(
        estadoDocumentoTypeFactory(documento.estadoCode).getForHumans()
      ),
      consecutivo: documento.consecutivo,
      proveedor: {
        nombre: ordenTraslado.proveedor.nombre,
        nit: ordenTraslado.proveedor.codigo,
        ciudad: `${ordenTraslado.proveedor.tercero.municipio.nombre} (${ordenTraslado.proveedor.tercero.municipio.departamento.nombre})`,
        direccion: ordenTraslado.proveedor.direccion,
        telefono: ordenTraslado.proveedor.tel1,
      },
      almacenConsignacion: {
        codigo: ordenTraslado.almacenConsignacion.codigo,
        nombre: ordenTraslado.almacenConsignacion.nombre,
      },
      almacenDestino: {
        codigo: ordenTraslado.almacenDestino.codigo,
        nombre: ordenTraslado.almacenDestino.nombre,
      },
      descripcion: ordenTraslado.descripcion,
      detalle: ordenTraslado.detalle.map(d => {
        return {
          codigo: d.producto.codigo,
          nombre: d.producto.descripcionCorta,
          cantidad: d.cantidad,
          valorUnitario: d.valorUnitario,
          valorSubtotal: d.cantidad * d.valorUnitario,
        };
      }),
    };

    return generateOrdenTraslado(dataMapped);
  }
}
