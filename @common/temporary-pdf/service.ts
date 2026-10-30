import {
  GoneException,
  Injectable,
  OnModuleDestroy,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { TEMPORARY_PDF_CONFIG, TEMPORARY_PDF_ROUTE } from './config';

const {
  ttlMs,
  maxPendingDocuments,
  maxRetainedBytes,
  maxDocumentBytes,
  maxConcurrentGenerations,
  maxConcurrentDeliveries,
} = TEMPORARY_PDF_CONFIG;

interface PendingPdf {
  contents: Buffer;
  title: string;
  expiresAt: number;
  timeout: ReturnType<typeof setTimeout>;
}

/** Holds PDFs only until their viewer opens; no generated file is persisted. */
@Injectable()
export class TemporaryPdfService implements OnModuleDestroy {
  private readonly pending = new Map<string, PendingPdf>();
  private pendingBytes = 0;
  private deliveryBytes = 0;
  private activeGenerations = 0;
  private activeDeliveries = 0;

  url(baseUrl: string, token: string): string {
    return `${baseUrl.replace(/\/$/, '')}/${TEMPORARY_PDF_ROUTE}/${token}`;
  }

  async generate(generator: () => Promise<Buffer>, title = 'Documento PDF'): Promise<string> {
    if (
      this.activeGenerations >= maxConcurrentGenerations ||
      this.pending.size + this.activeGenerations >= maxPendingDocuments ||
      this.pendingBytes + this.deliveryBytes + (this.activeGenerations + 1) * maxDocumentBytes >
        maxRetainedBytes
    ) {
      throw new ServiceUnavailableException(
        'El generador de documentos está ocupado. Intente nuevamente'
      );
    }
    // Reserve capacity before querying the database or building the PDF. There is no waiting queue.
    this.activeGenerations++;
    try {
      return this.create(await generator(), title);
    } finally {
      this.activeGenerations--;
    }
  }

  open(token: string): { contents: Buffer; title: string; release: () => void } {
    if (this.activeDeliveries >= maxConcurrentDeliveries) {
      throw new ServiceUnavailableException(
        'El visor de documentos está ocupado. Intente nuevamente'
      );
    }
    const { contents, title } = this.consume(token);
    const length = contents.length;
    this.activeDeliveries++;
    this.deliveryBytes += length;
    let released = false;
    return {
      contents,
      title,
      release: () => {
        if (released) return;
        released = true;
        this.activeDeliveries--;
        this.deliveryBytes -= length;
      },
    };
  }

  private create(contents: Buffer, title: string): string {
    if (contents.length > maxDocumentBytes) {
      throw new PayloadTooLargeException(
        `El PDF supera el tamaño máximo de ${maxDocumentBytes / 1024 / 1024} MB`
      );
    }
    if (
      this.pending.size >= maxPendingDocuments ||
      this.pendingBytes + this.deliveryBytes + contents.length > maxRetainedBytes
    ) {
      throw new ServiceUnavailableException('Hay demasiados documentos pendientes de abrir');
    }
    const token = randomBytes(32).toString('hex');
    const timeout = setTimeout(() => this.remove(token), ttlMs);
    timeout.unref();
    this.pending.set(token, {
      contents,
      title,
      expiresAt: Date.now() + ttlMs,
      timeout,
    });
    this.pendingBytes += contents.length;
    return token;
  }

  private consume(token: string): PendingPdf {
    const document = this.pending.get(token);
    this.remove(token);
    if (!document || document.expiresAt <= Date.now()) {
      throw new GoneException(
        'El documento temporal caducó. Genérelo nuevamente para visualizarlo'
      );
    }
    return document;
  }

  onModuleDestroy(): void {
    for (const token of this.pending.keys()) this.remove(token);
  }

  private remove(token: string): void {
    const document = this.pending.get(token);
    if (!document) return;
    clearTimeout(document.timeout);
    this.pendingBytes -= document.contents.length;
    this.pending.delete(token);
  }
}
