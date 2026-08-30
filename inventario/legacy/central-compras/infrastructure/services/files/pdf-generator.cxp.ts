import { UserOptions } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { numeroALetras } from './numero-a-letras';
import * as fs from 'fs';
import { TimerService, formatMoney } from '../../base';
import { GcmContexts } from '@common/domain/types';
import { CTC_FILE_LOCATIONS } from '@inn/lgc/ctc/application/constants';
import { ENVIRONMENTS } from '@inn/app.environments';

const BE_EPDF_FONT_FAMILIES = {
  default: 'helvetica',
};

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
              : 'undefined.jpg'
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
            ? 'NITSANJUANFALTA'
            : contexto === GcmContexts.VALLEDUPAR
              ? '892300708-1'
              : 'CENTRONOVALIDO'
  }`;
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

export interface CuentaXPagarI {
  clinica: {
    contexto: GcmContexts;
    nombre: string;
  };
  usuario: {
    id: number;
    cedula: string;
    nombreCompleto: string;
  };
  retefuente: number;
  reteica: number;
  reteIVA: number;
  data: {
    id: number;
    consecutivo: number;
    factura: string;
    estado: string;
    tipoDocumentoProveedor: string;
    numeroDocumentoProveedor: string;
    nombreProveedor: string;
    fechaDocumento: Date;
    fechaFactura: Date;
    diasPlazo: number;
    fechaVencimiento: Date;
    codigoCuentaContable: string;
    nombreCuentaContable: string;
    codigoCentroCostos: string | null;
    nombreCentroCostos: string | null;
    observaciones: string;
    conceptos: {
      codigoConcepto: string;
      nombreConcepto: string;
      codigoCuentaContable: string;
      nombreCuentaContable: string;
      codigoCentroCostos: string | null;
      nombreCentroCostos: string | null;
      naturaleza: string;
      netoAPagar: number;
    }[];
    pagos: {
      noCuota: number;
      fechaVencimiento: string;
      valor: number;
    }[];
  };
}

export interface ComprobanteI {
  clinica: {
    contexto: GcmContexts;
    nombre: string;
  };
  usuario: {
    id: number;
    cedula: string;
    nombreCompleto: string;
  };
  retefuente: number;
  reteica: number;
  reteIVA: number;
  data: {
    estado: string;
    consecutivo: string;
    codigo: string;
    nombreTipoComprobante: number;
    fecha: Date;
    detalle: string;
    conceptos: {
      detalle: string;
      codigoCuenta: string;
      nombreCuenta: string;
      documentoTercero: string;
      primerNombreTercero: string;
      segundoNombreTercero: string;
      primerApellidoTercero: string;
      segundoApellidoTercero: string;
      debito: number;
      credito: number;
    }[];
  };
}

export async function generateComprobante(payload: ComprobanteI) {
  const doc = new jsPDF('p', 'pt') as jsPDFWithPlugin;
  const timer = new TimerService();
  const img: any = fs.readFileSync(findImageFromContext(payload.clinica.contexto));

  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  let startX = 40,
    startY = 15;

  // Imagen agregada
  const heightImage = 45;
  startY += 30;
  doc.addImage(img, 'jpg', startX + 20, startY, 140, heightImage);

  // Fecha de creación del pdf
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);
  doc.text(`Fecha: ${timer.formatDate(new Date(), 7, false)}`, 443, 60);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES._11);

  doc.rect(startX + 200, startY + 20, startX + 280, 17);
  doc.text(`COMPROBANTE CONTABLE N°${payload.data.consecutivo}`, startX + 300, startY + 33);
  startY += 60;
  const addToStartY = 15;

  /* CODIGO */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);
  doc.text(`CODIGO: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.data.codigo}`, startX + 90, startY);

  /* ESTADO DEL DOCUMENTO */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`ESTADO: `, pageWidth / 2 + 90, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.data.estado}`, startX + 430, startY);
  startY += addToStartY;

  /* TIPO DE COMPROBANTE */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);
  doc.text(`COMPROBANTE: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.data.nombreTipoComprobante}`, startX + 90, startY);

  /* FECHA DEL DOCUMENTO */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`FECHA: `, pageWidth / 2 + 90, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.data.fecha, 6, true)}`, startX + 430, startY);
  startY += addToStartY;

  /* OBSERVACIONES */
  const val = payload.data.conceptos[0].credito || payload.data.conceptos[0].debito;
  const incluyeRetefuente =
    payload.data.detalle.toUpperCase().includes('RETEFUENTE') || payload.retefuente === 0;
  const incluyeReteIca =
    payload.data.detalle.toUpperCase().includes('RETEICA') || payload.reteica === 0;
  const incluyeReteIVA =
    payload.data.detalle.toUpperCase().includes('RETEIVA') || payload.reteIVA === 0;
  payload.data.detalle = `${payload.data.detalle}${
    !incluyeRetefuente
      ? `\nRETEFUENTE ${payload.retefuente}% = $${formatMoney((val / 100) * payload.retefuente)}`
      : ''
  }${
    !incluyeReteIca
      ? `\nRETEICA ${payload.reteica}% = $${formatMoney((val / 100) * payload.reteica)}`
      : ''
  }${
    !incluyeReteIVA
      ? `\nRETEIVA ${payload.reteIVA}% = $${formatMoney((val / 100) * payload.reteIVA)}`
      : ''
  }`;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`DETALLE: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');

  doc.text(`${payload.data.detalle}`.toUpperCase(), startX + 90, startY, {
    align: 'justify',
    maxWidth: 430,
  });

  const observacionesHeight = doc.getTextDimensions(`${payload.data.detalle}`.toUpperCase(), {
    maxWidth: 430,
  }).h;

  startY += observacionesHeight + 5;

  /* TABLA */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`DETALLE DEL MOVIMIENTO`, pageWidth / 2, startY + 12, { align: 'center' });
  startY += addToStartY;
  doc.line(startX, startY + 35, pageWidth - 35, startY + 35);
  startY += addToStartY + 10;

  doc.text(`CODIGO`, startX + 40, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${payload.data.conceptos[0].codigoCuenta} ${payload.data.conceptos[0].nombreCuenta}`,
    startX + 10,
    startY + addToStartY + 5,
    { maxWidth: 140 }
  );

  const codigo_0_Height = doc.getTextDimensions(`${payload.data.conceptos[0].nombreCuenta}`, {
    maxWidth: 140,
  }).h;

  doc.text(
    `TER: ${payload.data.conceptos[0].documentoTercero} - ${payload.data.conceptos[0].primerNombreTercero} ${payload.data.conceptos[0].segundoNombreTercero} ${payload.data.conceptos[0].primerApellidoTercero} ${payload.data.conceptos[0].segundoApellidoTercero}`,
    startX + 10,
    startY + addToStartY + codigo_0_Height + 15,
    { maxWidth: 140 }
  );

  doc.line(startX + 150, startY - 20, startX + 150, startY + 45);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`DETALLE`, startX + 180, startY, { align: 'justify' });
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.data.conceptos[0].detalle}`, startX + 155, startY + addToStartY + 5, {
    align: 'justify',
    maxWidth: 160,
  });

  const detalle_0_Height = doc.getTextDimensions(`${payload.data.conceptos[0].detalle}`, {
    maxWidth: 160,
  }).h;

  doc.line(startX + 150, startY - 20, startX + 150, startY + 45);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`VALOR DEBITO`, startX + 330, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `$ ${formatMoney(payload.data.conceptos[0].debito)}`,
    startX + 360,
    startY + addToStartY + 5,
    {
      align: 'center',
      maxWidth: 100,
    }
  );

  doc.line(startX + 150, startY - 20, startX + 150, startY + 45);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`VALOR CREDITO`, startX + 440, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `$ ${formatMoney(payload.data.conceptos[0].credito)}`,
    startX + 475,
    startY + addToStartY + 5,
    {
      align: 'center',
      maxWidth: 150,
    }
  );

  let detalle_1_Height = 0;

  if (payload.data.conceptos[1]) {
    doc.text(
      `${payload.data.conceptos[1].codigoCuenta} ${payload.data.conceptos[1].nombreCuenta}`,
      startX + 10,
      startY + addToStartY + detalle_0_Height + 20,
      { maxWidth: 140 }
    );

    const codigo_1_Height = doc.getTextDimensions(`${payload.data.conceptos[1].nombreCuenta}`, {
      maxWidth: 140,
    }).h;

    doc.text(
      `TER: ${payload.data.conceptos[1].documentoTercero} - ${payload.data.conceptos[1].primerNombreTercero} ${payload.data.conceptos[1].segundoNombreTercero} ${payload.data.conceptos[1].primerApellidoTercero} ${payload.data.conceptos[1].segundoApellidoTercero}`,
      startX + 10,
      startY + addToStartY + detalle_0_Height + 20 + codigo_1_Height + 15,
      { maxWidth: 140 }
    );

    doc.text(
      `${payload.data.conceptos[1].detalle}`,
      startX + 155,
      startY + addToStartY + detalle_0_Height + 20,
      { align: 'justify', maxWidth: 160 }
    );

    detalle_1_Height = doc.getTextDimensions(`${payload.data.conceptos[1].detalle}`, {
      maxWidth: 160,
    }).h;

    doc.text(
      `$ ${formatMoney(payload.data.conceptos[1].debito)}`,
      startX + 360,
      startY + addToStartY + detalle_0_Height + 20,
      {
        align: 'center',
        maxWidth: 100,
      }
    );

    doc.text(
      `$ ${formatMoney(payload.data.conceptos[1].credito)}`,
      startX + 475,
      startY + addToStartY + detalle_0_Height + 20,
      {
        align: 'center',
        maxWidth: 150,
      }
    );
  }

  startY += addToStartY + detalle_0_Height + detalle_1_Height + 35;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`TOTAL NUMERO COMPROBANTE : ${payload.data.consecutivo}`, startX, startY);

  startY += 15;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`TOTAL DEL COMPROBANTE : ${payload.data.codigo}`, startX, startY);

  let totalDebito = payload.data.conceptos[0].debito;
  if (payload.data.conceptos[1]) totalDebito += payload.data.conceptos[1].debito;
  let totalCredito = payload.data.conceptos[0].credito;
  if (payload.data.conceptos[1]) totalCredito += payload.data.conceptos[1].credito;

  doc.text(`$ ${formatMoney(totalDebito)}`, startX + 360, startY, {
    align: 'center',
    maxWidth: 100,
  });

  doc.text(`$ ${formatMoney(totalCredito)}`, startX + 475, startY, {
    align: 'center',
    maxWidth: 150,
  });

  /* PIE DE PAGINA */
  const pages = doc.internal.pages.length - 1;

  // Paginación
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  for (let i = 1; i < pages + 1; i++) {
    doc.setPage(i);
    doc.text(`${i}/${pages}`, pageWidth - 60, 30);

    if (i === pages) {
      //Pie de pagina
      startY += addToStartY + 138;
      startX = 30;
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text('Reporte: PGRPCxP', startX, pageHeight - 80);

      doc.text('Usuario: ', startX + 380, pageHeight - 80);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
      doc.text(`${payload.usuario.nombreCompleto}`, startX + 420, pageHeight - 80, {
        maxWidth: 140,
      });
      startY += addToStartY;

      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text('LICENCIADO A: ', startX, pageHeight - 70);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
      doc.text(
        ` [${payload.clinica.nombre}] Nit [${findNitFromContext(payload.clinica.contexto)}]`,
        startX + 60,
        pageHeight - 70
      );
      startY += addToStartY + 8;
    }
  }

  fs.mkdir(`../${CTC_FILE_LOCATIONS.cxp}/${payload.usuario.cedula}`, _err => {
    /* if (_err) return console.error(_err);
    console.log('Directory created successfully!'); */
  });

  const url = `../${CTC_FILE_LOCATIONS.cxp}/${payload.usuario.cedula}/COMPR${payload.data.codigo}.pdf`;

  doc.save(url);

  return `${ENVIRONMENTS.apiUrl}/${url}`;
}

export async function generateCxP(payload: CuentaXPagarI) {
  const doc = new jsPDF('p', 'pt') as jsPDFWithPlugin;
  const timer = new TimerService();
  const img: any = fs.readFileSync(findImageFromContext(payload.clinica.contexto));

  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  let startX = 40,
    startY = 15;

  // Imagen agregada
  const heightImage = 45;
  startY += 30;
  doc.addImage(img, 'jpg', startX + 20, startY, 140, heightImage);

  // Fecha de creación del pdf
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);
  doc.text(`Fecha: ${timer.formatDate(new Date(), 7, false)}`, 443, 60);

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES._11);

  doc.rect(startX + 200, startY + 20, startX + 280, 17);
  doc.text(`CUENTA POR PAGAR`, startX + 300, startY + 33);
  startY += 60;
  const addToStartY = 15;
  /* Numero factura */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.setFontSize(BE_EPDF_FONT_SIZES._8);
  doc.text(`Consecutivo: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.data.consecutivo}`, startX + 90, startY);
  /* NUMERO FACTURA */

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Factura: `, startX + 220, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.data.factura}`, startX + 300, startY);

  /* Estado */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Estado: `, startX + 430, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${payload.data.estado}`, startX + 465, startY);
  startY += addToStartY;
  /* TERCERO */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Tercero: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${payload.data.tipoDocumentoProveedor} - ${
      payload.data.numeroDocumentoProveedor
    } - ${payload.data.nombreProveedor.trim()}`,
    startX + 90,
    startY
  );
  startY += addToStartY;

  /* TERCERO */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Proveedor: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${payload.data.numeroDocumentoProveedor} - ${payload.data.nombreProveedor.trim()}`,
    startX + 90,
    startY
  );
  startY += addToStartY;

  /* Fecha del documento */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Fecha del documento: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.data.fechaDocumento, 5, true)}`, startX + 90, startY);

  /* Fecha del documento */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Fecha de la cuenta por pagar: `, pageWidth / 2 - 38, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.data.fechaDocumento, 5, true)}`, startX + 430, startY);
  startY += addToStartY;

  /* Fecha del documento */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Plazo: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  let msg = payload.data.diasPlazo > 1 ? 'días' : 'día';
  doc.text(`${payload.data.diasPlazo} ${msg}`, startX + 90, startY);

  /* Fecha del documento */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Fecha de vencimiento: `, pageWidth / 2 - 38, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${timer.formatDate(payload.data.fechaVencimiento, 5, true)}`, startX + 430, startY);
  startY += addToStartY;

  /* CUENTA CONTABLE */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Cuenta contable: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${payload.data.codigoCuentaContable} - ${payload.data.nombreCuentaContable}`,
    startX + 90,
    startY
  );
  startY += addToStartY;

  /* CUENTA DE COSTOS */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Cuenta de costos: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(
    `${payload.data.codigoCentroCostos || ''}${
      payload.data.codigoCentroCostos && payload.data.nombreCentroCostos ? ' - ' : ''
    }${payload.data.nombreCentroCostos || ''}`,
    startX + 90,
    startY
  );
  startY += addToStartY;

  /* OBSERVACIONES */
  const incluyeRetefuente =
    payload.data.observaciones.toUpperCase().includes('RETEFUENTE') || payload.retefuente === 0;
  const incluyeReteIca =
    payload.data.observaciones.toUpperCase().includes('RETEICA') || payload.reteica === 0;
  const incluyeReteIVA =
    payload.data.observaciones.toUpperCase().includes('RETEIVA') || payload.reteIVA === 0;
  payload.data.observaciones = `${payload.data.observaciones}${
    !incluyeRetefuente
      ? `\nRETEFUENTE ${payload.retefuente}% = $${formatMoney(
          (payload.data.conceptos[0].netoAPagar / 100) * payload.retefuente
        )}`
      : ''
  }${
    !incluyeReteIca
      ? `\nRETEICA ${payload.reteica}% = $${formatMoney(
          (payload.data.conceptos[0].netoAPagar / 100) * payload.reteica
        )}`
      : ''
  }${
    !incluyeReteIVA
      ? `\nRETEIVA ${payload.reteIVA}% = $${formatMoney(
          (payload.data.conceptos[0].netoAPagar / 100) * payload.reteIVA
        )}`
      : ''
  }`;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Observación: `, startX, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');

  doc.text(`${payload.data.observaciones}`.toUpperCase(), startX + 90, startY, { maxWidth: 440 });

  const observacionesHeight = doc.getTextDimensions(`${payload.data.observaciones}`.toUpperCase(), {
    maxWidth: 440,
  }).h;

  startY += observacionesHeight + 5;

  let valorPesoEnLetras = numeroALetras(payload.data.conceptos[0].netoAPagar);

  /* valor */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`Valor: `, startX + 430, startY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`$ ${formatMoney(payload.data.conceptos[0].netoAPagar)}`, startX + 460, startY);
  startY += addToStartY;

  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  let posicionY = valorPesoEnLetras.length < 100 ? startY + 8 : startY;
  doc.text(`Valor: `, startX, posicionY);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  doc.text(`${valorPesoEnLetras}`.toUpperCase(), startX + 30, posicionY, {
    maxWidth: 500,
  });
  doc.rect(startX, startY + 10, startX + 480, 55);
  doc.line(startX, startY + 35, pageWidth - 35, startY + 35);
  startY += addToStartY;

  /* PRIMERA TABLA */
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`CONCEPTOS`, pageWidth / 2, startY + 12, { align: 'center' });
  startY += addToStartY;
  doc.line(startX, startY + 35, pageWidth - 35, startY + 35);
  startY += addToStartY + 10;

  for (let index = 0; index < payload.data.conceptos.length; index++) {
    const el = payload.data.conceptos[index];

    const campo1 = doc.getTextDimensions(`${el.codigoConcepto} - ${el.nombreConcepto}`, {
      maxWidth: 110,
    });
    const campo2 = doc.getTextDimensions(`${el.codigoConcepto} - ${el.nombreConcepto}`, {
      maxWidth: 110,
    });
    const campo3 = doc.getTextDimensions(`${el.codigoConcepto} - ${el.nombreConcepto}`, {
      maxWidth: 110,
    });
    const mayor = Math.max(campo1.h, campo2.h, campo3.h);

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`concepto`, startX + 50, startY);
    }

    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(`${el.codigoConcepto} - ${el.nombreConcepto}`, startX + 10, startY + addToStartY + 5, {
      maxWidth: 110,
    });
    doc.line(startX + 150, startY - 20, startX + 150, startY + (mayor + 15));

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`Cuenta contable`, startX + 190, startY);
    }

    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(
      `${el.codigoCuentaContable} - ${el.nombreCuentaContable}`,
      startX + 155,
      startY + addToStartY + 5,
      { maxWidth: 110 }
    );
    doc.line(startX + 290, startY - 20, startX + 290, startY + (mayor + 15));

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`Centro de costos`, startX + 310, startY);
    }
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(
      `${el.codigoCentroCostos || ''}${el.codigoCentroCostos ? ' - ' : ''}${
        el.nombreCentroCostos || ''
      }`,
      startX + 300,
      startY + addToStartY + 5,
      {
        maxWidth: 80,
      }
    );
    doc.line(startX + 390, startY - 20, startX + 390, startY + (mayor + 15));

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`Naturaleza`, startX + 400, startY);
    }
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(`${el.naturaleza}`, startX + 400, startY + addToStartY + 5, {
      maxWidth: 40,
    });
    doc.line(startX + 450, startY - 20, startX + 450, startY + (mayor + 15));

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`Valor`, pageWidth - 80, startY);
    }
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(`$ ${formatMoney(el.netoAPagar)}`, pageWidth - 40, startY + addToStartY + 5, {
      maxWidth: 60,
      align: 'right',
    });

    doc.rect(startX, startY + 10, startX + 480, mayor + 5);
    startY += mayor + 5;
  }

  startY += 25;

  /* SEGUNDA TABLA */
  doc.rect(startX, startY, startX + 480, 40);
  doc.line(startX, startY + 17, pageWidth - 35, startY + 17);
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
  doc.text(`CUOTAS`, pageWidth / 2, startY + 12, { align: 'center' });
  startY += addToStartY;
  doc.line(startX, startY + 25, pageWidth - 35, startY + 25);
  startY += addToStartY;

  for (let index = 0; index < payload.data.pagos.length; index++) {
    const el = payload.data.pagos[index];

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`N° cuota`, startX + 50, startY);
    }
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(`${el.noCuota}`, startX + 10, startY + addToStartY + 5, {
      maxWidth: 150,
    });
    doc.line(startX + 150, startY - 13, startX + 150, startY + 29);

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`Fecha de vencimiento`, startX + 220, startY);
    }
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(timer.formatDate(el.fechaVencimiento, 5), pageWidth / 2, startY + addToStartY + 5, {
      maxWidth: 150,
      align: 'center',
    });
    doc.line(startX + 390, startY - 13, startX + 390, startY + 29);

    if (!index) {
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text(`Valor`, pageWidth - 110, startY);
    }
    doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
    doc.text(`$ ${formatMoney(el.valor)}`, pageWidth - 40, startY + addToStartY + 5, {
      maxWidth: 60,
      align: 'right',
    });

    doc.rect(startX, startY + 10, startX + 480, addToStartY + 5);
    startY += addToStartY + 5;
  }
  startY = pageHeight - 80;

  /* PIE DE PAGINA */
  const pages = doc.internal.pages.length - 1;

  // Paginación
  doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
  for (let i = 1; i < pages + 1; i++) {
    doc.setPage(i);
    doc.text(`${i}/${pages}`, pageWidth - 60, 30);

    if (i === pages) {
      //Pie de pagina
      startY += addToStartY + 138;
      startX = 30;
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text('Reporte: PGRPCxP', startX, pageHeight - 80);

      doc.text('Usuario: ', startX + 380, pageHeight - 80);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
      doc.text(`${payload.usuario.nombreCompleto}`, startX + 420, pageHeight - 80, {
        maxWidth: 140,
      });
      startY += addToStartY;

      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'bold');
      doc.text('LICENCIADO A: ', startX, pageHeight - 70);
      doc.setFont(BE_EPDF_FONT_FAMILIES.default, 'normal');
      doc.text(
        ` [${payload.clinica.nombre}] Nit [${findNitFromContext(payload.clinica.contexto)}]`,
        startX + 60,
        pageHeight - 70
      );
      startY += addToStartY + 8;
    }
  }

  fs.mkdir(`../${CTC_FILE_LOCATIONS.cxp}/${payload.usuario.cedula}`, _err => {
    /* if (_err) return console.error(_err);
    console.log('Directory created successfully!'); */
  });

  const url = `../${CTC_FILE_LOCATIONS.cxp}/${payload.usuario.cedula}/CXP${payload.data.factura}.pdf`;

  doc.save(url);

  return `${ENVIRONMENTS.apiUrl}/${url}`;
}
