import { UserOptions } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as fs from 'fs';
import { DetalleCotizacionOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { TimerService } from '../../base';
import { GcmContexts } from '@common/domain/types';
import { CTC_FILE_LOCATIONS } from '@inn/lgc/ctc/application/constants';
import { ENVIRONMENTS } from '@inn/app.environments';

export interface OCFirma {
  subtitle?: string;
  nombre: string;
  documento: string;
  cargo: string;
}

export interface OCProducto {
  id: number;
  codigo: string;
  nombre: string;
  marca: string;
  cantidad: number;
  unidadMedida: string;
  valorUnitario: number;
  porcDescuento: number;
  porcIVA: number;
}

export interface OCPayload {
  clinica: {
    contexto: GcmContexts;
    nit: string;
    direccion: string;
  };
  ordenCompra: {
    consecutivo: string;
    fechaCreacion: Date;
    fechaEntrega: Date;
    estado: string;
    moneda: string;
    clase: string;
    tipoContrato: string;
    direccionEntrega: string;
    formaPago: string;
    diasPlazo: number;
    detalle: string;
  };
  proveedor: {
    nombre: string;
    tipoDocumento: string;
    documento: string;
    direccion: string;
    ciudad: string;
    telefono: string;
  };
  productos: OCProducto[];
  encargados: OCFirma[];
  usuario: {
    id: number;
    cedula: string;
    nombreCompleto: string;
  };
  productosCotizados: DetalleCotizacionOrm[];
}

interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

const findImageFromContext = (contexto: GcmContexts) => {
  return `private/clinicas/${
    contexto === GcmContexts.ALTACENTRO
      ? 'alta-centro.jpg'
      : contexto === GcmContexts.AGUACHICA
        ? 'aguachica.jpg'
        : contexto === GcmContexts.AMMEDICAL
          ? 'ammedical.png'
          : contexto === GcmContexts.SANJUAN
            ? 'sanjuan.jpg'
            : contexto === GcmContexts.VALLEDUPAR
              ? 'valledupar.jpg'
              : 'ammedical.png'
  }`;
};

const findNitFromContext = (contexto: GcmContexts) => {
  return `${
    contexto === GcmContexts.ALTACENTRO
      ? '824001041-6'
      : contexto === GcmContexts.AGUACHICA
        ? '900772387-1'
        : contexto === GcmContexts.AMMEDICAL
          ? '900106694-2'
          : contexto === GcmContexts.SANJUAN
            ? '900272582-6'
            : contexto === GcmContexts.VALLEDUPAR
              ? '892300708-1'
              : '900106694-2'
  }`;
};

const findAddressFromContext = (contexto: GcmContexts) => {
  return `${
    contexto === GcmContexts.ALTACENTRO
      ? 'CALLE 16B # 11-33'
      : contexto === GcmContexts.AGUACHICA
        ? 'CALLE 5 # 26-42'
        : contexto === GcmContexts.AMMEDICAL
          ? 'CALLE 13B BIS No. 17 - 54'
          : contexto === GcmContexts.SANJUAN
            ? 'CALLE 7 No. 1 -74'
            : contexto === GcmContexts.VALLEDUPAR
              ? 'CALLE 16 No 15-15'
              : 'CALLE 13B BIS No. 17 - 54'
  }`;
};

const valueToMoney = (value: number) => {
  const valueSplitted = `${value}`.split('.');

  let valueFormatted = `${Intl.NumberFormat('en-US').format(+valueSplitted[0])}`.replace(
    /\,/g,
    '.'
  );

  let decimal = 0;

  if (valueSplitted.length > 1) {
    decimal = +`0.${valueSplitted[1]}`;
    decimal = Math.round((decimal + Number.EPSILON) * 100) / 100;
    let decimalFormatted = `${decimal}`.replace('0.', '');
    decimalFormatted = decimalFormatted.length === 1 ? `${decimalFormatted}0` : decimalFormatted;
    valueFormatted += `,${decimalFormatted}`;
  } else {
    valueFormatted += ',00';
  }

  return valueFormatted;
};

const BE_EPDF_FONT_SIZES = {
  _18: 18,
  _16: 16,
  _14: 14,
  _12: 12,
  _11: 11,
  _10: 10,
  _9: 9,
  _8: 8,
  _7: 7,
  _6: 6,
};

const BE_EPDF_LINE_COLORS = {
  default: 'rgb(233, 233, 233)',
};

const BE_EPDF_FONT_FAMILIES = {
  default: 'helvetica',
};

export async function generateOrdCo(payload: OCPayload) {
  payload.productos.map(el => {
    try {
      if (el.id) {
        const itemCotizado = payload.productosCotizados.filter(
          pc => pc.item.productoId === el.id
        )[0];
        el.marca = itemCotizado.item.marca || 'N/A';
      }
    } catch (error: any) {}
  });

  const doc = new jsPDF('p', 'pt') as jsPDFWithPlugin;
  const maxPageHeight = 811.89;

  function addPage(ignoreConditions = false) {
    if (startY > maxPageHeight && !ignoreConditions) {
      doc.addPage();
      startY = 40;
    }

    if (ignoreConditions) {
      doc.addPage();
      startY = 40;
    }
  }

  function generateFirmas(data: OCFirma, startX: number, startY: number, align = false) {
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');

    const alignItem: any = align ? { align: 'center' } : {};

    const arrayFromData = [
      data.subtitle === undefined ? 'Aprobó' : data.subtitle,
      data.nombre,
      data.cargo,
    ];

    arrayFromData.forEach(async (titulo, i) => {
      const customLine = '_________________________________________';

      if (i === 0) {
        doc.text(customLine, startX, startY, alignItem);

        try {
          let img: any = fs.readFileSync(`private/firmas/${data.documento}.png`);
          doc.addImage(img, 'png', !align ? startX : startX - 70, startY - 30, 140, heightImage);
        } catch (error: any) {
          doc.text('Firma digital no encontrada', startX + 30, startY - 5, alignItem);
        }

        startY -= 10;
      }

      if (i === 2) {
        doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
        startY -= 10;
        doc.text(titulo, startX, startY, alignItem);
      } else {
        if (i !== 1) {
          doc.text(titulo || 'NO VERIFICADO', startX, startY, alignItem);
        } else {
          doc.text(titulo || 'NO VERIFICADO', startX, startY, alignItem);
        }
        startY += 20;
      }
    });
  }

  const line = `_______________________________________________________________________________________________________________________________`;

  const timer = new TimerService();

  const img: any = fs.readFileSync(findImageFromContext(payload.clinica.contexto));

  //const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  let startX = 40,
    startY = 15,
    rowsHeight = 24;

  // Imagen agregada
  const heightImage = 45;
  doc.addImage(img, 'jpg', startX, startY, 140, heightImage);

  // NIT y dirección
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES._11);
  startY += heightImage + 15;
  doc.text(`NIT: ${findNitFromContext(payload.clinica.contexto)}`, startX, startY);
  startY += 13;
  doc.text(`${findAddressFromContext(payload.clinica.contexto)}`, startX, startY);

  // Fecha de creación del pdf
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);
  doc.text(`Fecha Actual : ${timer.formatDate(new Date(), 7, false)}`, 400, 40);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES._14);
  doc.text('ORDEN DE COMPRA', 300, 60);
  startY += 25;
  startX = 30;

  // Información de la OC
  doc.text(`N°${payload.ordenCompra.consecutivo}`, pageWidth / 2, startY, { align: 'center' });
  startY += 20;
  doc.setFontSize(7.5);
  const addToStartY = 12;

  // Proveedor
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('PROVEEDOR:', startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.proveedor.nombre.trim()}`, startX + 70, startY);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`${payload.proveedor.tipoDocumento}:`, startX + 290, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.proveedor.documento}`, startX + 310, startY);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('FECHA:', startX + 390, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.ordenCompra.fechaCreacion, 6)}`, startX + 430, startY);
  startY += addToStartY;
  // Ciudad
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('CIUDAD:', startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.proveedor.ciudad}`, startX + 70, startY);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('FECHA DE ENTREGA:', startX + 339, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.ordenCompra.fechaEntrega, 6)}`, startX + 430, startY);
  startY += addToStartY;
  // Dirección
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('DIRECCION:', startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.proveedor.direccion}`, startX + 70, startY);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('ESTADO:', startX + 385, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.ordenCompra.estado, 6)}`, startX + 430, startY);
  startY += addToStartY;
  // Telefono
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('TELEFONO:', startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.proveedor.telefono}`, startX + 70, startY);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('MONEDA:', startX + 383, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.ordenCompra.moneda, 6)}`, startX + 430, startY);
  startY += addToStartY;
  // Clase orden
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('CLASE ORDEN:', startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.ordenCompra.clase}`, startX + 70, startY);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('TIPO CONTRATO:', startX + 355, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.ordenCompra!.tipoContrato || 'No establecido'}`, startX + 430, startY);
  startY += addToStartY;
  // dirección Entrega
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('DIRECCION ENTREGA:', startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.ordenCompra.direccionEntrega}`, startX + 90, startY, { maxWidth: 180 });

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('FORMA DE PAGO:', startX + 275, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.ordenCompra.formaPago}`, startX + 345, startY, { maxWidth: 75 });

  const direccionEntregaHeight = doc.getTextDimensions(`${payload.ordenCompra.direccionEntrega}`, {
    maxWidth: 180,
  }).h;

  const formaPagoHeight = doc.getTextDimensions(`${payload.ordenCompra.formaPago}`, {
    maxWidth: 75,
  }).h;

  const dentOrFpaHeight =
    direccionEntregaHeight > formaPagoHeight ? direccionEntregaHeight : formaPagoHeight;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('DIAS DE PLAZO:', startX + 425, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.ordenCompra.diasPlazo}`, startX + 495, startY);
  startY += addToStartY;

  const addPxToStartYFPH =
    dentOrFpaHeight <= 17
      ? 0
      : dentOrFpaHeight > 17 && dentOrFpaHeight <= 25
        ? 10
        : dentOrFpaHeight > 25 && dentOrFpaHeight <= 34
          ? 20
          : 30;

  doc.text(line, startX, startY + addPxToStartYFPH);
  startY += 15 + addPxToStartYFPH;

  let subtotal = 0,
    descuento = 0,
    impuesto = 0;

  const tablas =
    payload.ordenCompra.clase === 'Orden_compra'
      ? [
          'CODIGO',
          'NOMBRE',
          'MARCA',
          'CANTIDAD',
          'UNIDAD/MEDIDA',
          'VALOR/U',
          'SUBTOTAL',
          '%DTO',
          '%IVA',
        ]
      : ['NOMBRE', 'CANTIDAD', 'UNIDAD/MEDIDA', 'VALOR/U', 'SUBTOTAL', '%DTO', '%IVA'];

  // Tabla de productos

  const tablaProductos = payload.productos.map(producto => {
    const porcentajeConDescuento = 100 - producto.porcDescuento;
    const valorSubtotal = producto.valorUnitario * producto.cantidad;
    const valorDescAplicado = (valorSubtotal / 100) * porcentajeConDescuento;

    subtotal += valorSubtotal;
    descuento += producto.porcDescuento ? (valorSubtotal / 100) * producto.porcDescuento : 0;
    impuesto += producto.porcIVA ? (valorDescAplicado / 100) * producto.porcIVA : 0;

    const response =
      payload.ordenCompra.clase === 'Orden_compra'
        ? [
            producto.codigo,
            producto.nombre,
            producto.marca,
            producto.cantidad,
            producto.unidadMedida,
            valueToMoney(producto.valorUnitario),
            valueToMoney(producto.valorUnitario * producto.cantidad),
            `${producto.porcDescuento}%`,
            `${producto.porcIVA}%`,
          ]
        : [
            producto.nombre,
            producto.cantidad,
            producto.unidadMedida,
            valueToMoney(producto.valorUnitario),
            valueToMoney(producto.valorUnitario * producto.cantidad),
            `${producto.porcDescuento}%`,
            `${producto.porcIVA}%`,
          ];

    return response;
  });

  //let tablaProductosHeight = 0;

  doc.autoTable({
    head: [tablas],
    body: tablaProductos,
    didDrawPage: d => {
      rowsHeight = d.cursor?.y || 0;
      /* d.table.body.forEach((cl, i) => {
        tablaProductosHeight += cl.height;
      }); */
    },
    startY,
    theme: 'grid',
    headStyles: {
      lineColor: '#fff',
      cellPadding: 2,
      lineWidth: 0.5,
      fontSize: BE_EPDF_FONT_SIZES._8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      lineColor: '#fff',
      cellPadding: 2,
      fontSize: BE_EPDF_FONT_SIZES._7,
    },
    styles: { fillColor: 'white', textColor: 'black', lineColor: BE_EPDF_LINE_COLORS.default },
  });

  startY = rowsHeight + 10;

  doc.text(line, startX, startY);
  startY += 20;
  addPage();

  let heightDetalleOC = 0;

  if (payload.ordenCompra.detalle) {
    heightDetalleOC = doc.getTextDimensions(`${payload.ordenCompra.detalle}`, {
      maxWidth: 350,
    }).h;

    if (heightDetalleOC + startY > maxPageHeight) addPage(true);

    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
    doc.text('DETALLE', startX, startY);
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(`${payload.ordenCompra.detalle}`, startX, startY + 12, { maxWidth: 350 });
  }

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('SUBTOTAL:', startX + 413, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${valueToMoney(subtotal)}`, startX + 520, startY, { align: 'right' });
  startY += 12;
  addPage();

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('DESCUENTO:', startX + 407, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${valueToMoney(descuento)}`, startX + 520, startY, { align: 'right' });
  startY += 12;
  addPage();

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('IMPUESTO:', startX + 415, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${valueToMoney(impuesto)}`, startX + 520, startY, { align: 'right' });
  startY += 12;
  addPage();

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('TOTAL ORDEN:', startX + 400, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${valueToMoney(subtotal - descuento + impuesto)}`, startX + 520, startY, {
    align: 'right',
  });

  if (payload.ordenCompra.detalle) {
    if (heightDetalleOC > 48) startY += heightDetalleOC - 30;
  }

  /* Firmas de los encargados */

  /*  if (startY + heightFirma >= maxPageHeight) {
    addPage(true);
  } */

  startY += addToStartY + 30;
  startX += 70;

  payload.encargados
    .filter(el => el)
    .forEach((encargado, index) => {
      let isArrayImpar = true;
      if (payload.encargados.length % 2 === 0) isArrayImpar = false;

      const newStartX =
        isArrayImpar && index === payload.encargados.length - 1
          ? pageWidth / 2
          : index !== 0 && index % 2 !== 0
            ? 300
            : startX;

      let newStartY =
        isArrayImpar && index === payload.encargados.length - 1
          ? (startY += 70)
          : index !== 0 && index % 2 === 0
            ? (startY += 70)
            : startY;

      if (index % 2 === 0) {
        if (startY >= 783) {
          newStartY = 40;
          addPage(true);
        }
      }

      const isAlignToCenter = isArrayImpar && index === payload.encargados.length - 1;
      generateFirmas(encargado, newStartX, newStartY, isAlignToCenter);
    });

  if (startY >= 648.3) addPage(true);
  else startY += 40;

  startX = 30;
  //Nota
  const desc_1 = `            La factura debe ser idéntica a la orden de compra en descripción, precio y condiciones de pago.`;
  const desc_2 = `El proveedor garantiza que la totalidad de los productos entregados se encuentran en perfecto estado de conservación, en empaques adecuados que mantienen las características del producto, con fecha de expiración superior a un año y que reúne los estándares de calidad propios del producto. Por lo tanto, se obliga a sustituir sin costo adicional para el comprador todas las unidades que presente defectos de calidad de empaque cumpliendo con todos especificaciones acordadas y soportadas con la oferta que hace parte integral de esta orden de compra.\nTodos los productos requeridos por el comprador deben ser entregados en el Almacén General de AM MEDICAL, dirección  Calle 13 B Bis #17-54 Barrio Alfonso López en horario hábil, la excepción de lugar de entrega será informado por el comprador. La factura debe tener registrado el número de orden de compra con el cual fue solicitado el producto. El correo electrónico asignado para el recibo de la factura electrónica es: facturacionelectronica@clinicamedicos.com`;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text('NOTA:', startX, startY);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);
  doc.text(desc_1, startX, startY, {
    align: 'left',
    lineHeightFactor: 1.5,
    maxWidth: 500,
  });

  startY += 12;

  doc.text(desc_2, startX, startY, {
    align: 'justify',
    lineHeightFactor: 1.5,
    maxWidth: 500,
  });

  // Paginación
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');

  const pages = doc.internal.pages.length - 1;

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.text(`${i}/${pages}`, pageWidth - 60, 30);

    if (i === pages) {
      let customStartY = doc.internal.pageSize.getHeight() - 40;
      startX = 30;

      doc.setFont(BE_EPDF_FONT_FAMILIES.default);
      doc.setTextColor('gray');
      doc.text('Usuario:', startX + 360, customStartY);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
      doc.text(payload.usuario.nombreCompleto, startX + 400, customStartY, { maxWidth: 120 });
    }
  }

  fs.mkdir(`../${CTC_FILE_LOCATIONS.ordenes}/${payload.usuario.cedula}`, _err => {
    /* if (_err) return console.error(_err);
    console.log('Directory created successfully!'); */
  });

  const url = `../${CTC_FILE_LOCATIONS.ordenes}/${payload.usuario.cedula}/${payload.ordenCompra.consecutivo}.pdf`;

  doc.save(url);

  return `${ENVIRONMENTS.apiUrl}/${url}`;
}
