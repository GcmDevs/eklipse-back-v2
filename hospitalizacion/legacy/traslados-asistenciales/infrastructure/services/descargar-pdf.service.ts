import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ESTADOS_ASISTENCIA,
  ACCIDENTE_TRANSITO,
  PRIMARIO,
  SECUNDARIO,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { generateTrasladoPrimarioPdf } from '@hpn/lgc/tas/presentation/pdf/traslado-primario.pdf-generator';
import { generateTrasladoSecundarioPdf } from '@hpn/lgc/tas/presentation/pdf/traslado-secundario.pdf-generator';
import { generateVictimaAccidentePdf } from '../../presentation/pdf/victima-accidente.pdf-generator';
import type { TrasladoAsistencialDetalleDataRes } from '../../application/responses';
import { GcmContextCode } from '@common/domain/types';

export interface PdfDescargaItem {
  fileName: string;
  buffer: Buffer;
}

export interface PaquetePdfsRes {
  traslado: PdfDescargaItem | null;
}

@Injectable()
export class DescargarPdfService {
  public async generarPdfAccidente(
    traslado: TrasladoAsistencialDetalleDataRes,
    contextoCode?: GcmContextCode
  ): Promise<PdfDescargaItem> {
    if (!traslado) throw new NotFoundException('No se encontró el traslado solicitado');
    if (traslado.tipoCode !== PRIMARIO.getCode()) {
      throw new Error('El PDF de accidente solo está disponible para traslados primarios');
    }
    if (traslado.estadoCode !== ESTADOS_ASISTENCIA.FINALIZADO.getCode()) {
      throw new Error('El PDF de accidente solo está disponible en estado FINALIZADO');
    }
    if (
      traslado.tipoRemisionCode !== ACCIDENTE_TRANSITO.getCode() ||
      traslado.accidente?.id == null
    ) {
      throw new Error('El traslado no tiene un accidente de tránsito registrado');
    }
    const buffer = await generateVictimaAccidentePdf({
      clinica: { contexto: contextoCode, nombre: String(contextoCode ?? '') },
      data: traslado,
    });
    if (!buffer) throw new Error('No se pudo generar el PDF de accidente');
    return { fileName: 'victima_accidente_' + traslado.id + '.pdf', buffer };
  }

  public async generarPaquetePdfs(
    traslado: any,
    contextoCode?: GcmContextCode
  ): Promise<PaquetePdfsRes> {
    if (!traslado) {
      throw new NotFoundException('No se encontró el traslado solicitado');
    }

    if (traslado.estadoCode !== ESTADOS_ASISTENCIA.FINALIZADO.getCode()) {
      throw new Error('El PDF del traslado solo está disponible en estado FINALIZADO');
    }

    const payload = {
      clinica: {
        contexto: contextoCode,
        nombre: String(contextoCode),
      },
      data: traslado,
    };

    // Generar PDF principal (Primario o Secundario)
    let bufferTraslado: Buffer | null = null;
    let trasladoFileName = `traslado_${traslado.id}.pdf`;

    if (traslado.tipoCode === PRIMARIO.getCode()) {
      bufferTraslado = await generateTrasladoPrimarioPdf(payload);
      trasladoFileName = `traslado_primario_${traslado.id}.pdf`;
    } else if (traslado.tipoCode === SECUNDARIO.getCode()) {
      bufferTraslado = await generateTrasladoSecundarioPdf(payload);
      trasladoFileName = `traslado_secundario_${traslado.id}.pdf`;
    }

    return {
      traslado: bufferTraslado
        ? {
            fileName: trasladoFileName,
            buffer: bufferTraslado,
          }
        : null,
    };
  }
}
