import { Injectable, NotFoundException } from '@nestjs/common';
import { ESTADOS_ASISTENCIA, PRIMARIO, SECUNDARIO } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { generateTrasladoPrimarioPdf } from '@hpn/lgc/tas/presentation/pdf/traslado-primario.pdf-generator';
import { generateTrasladoSecundarioPdf } from '@hpn/lgc/tas/presentation/pdf/traslado-secundario.pdf-generator';
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
  public async generarPaquetePdfs(
    traslado: any,
    contextoCode?: GcmContextCode
  ): Promise<PaquetePdfsRes> {
    if (!traslado) {
      throw new NotFoundException('No se encontró el traslado solicitado');
    }

    const isPrimario = traslado.tipoCode === PRIMARIO.getCode();
    const isSecundario = traslado.tipoCode === SECUNDARIO.getCode();

    const canDownload =
      (isPrimario && traslado.estadoCode === ESTADOS_ASISTENCIA.CREADO.getCode()) ||
      (isSecundario && traslado.estadoCode === ESTADOS_ASISTENCIA.FINALIZADO.getCode());

    if (!canDownload) {
      throw new Error(
        isPrimario
          ? 'El PDF del traslado primario solo está disponible en estado CREADO'
          : 'El PDF del traslado secundario solo está disponible en estado FINALIZADO'
      );
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
