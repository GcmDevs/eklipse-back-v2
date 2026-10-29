import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { Response } from 'express';
import { TemporaryPdfService } from './service';
import { temporaryPdfViewer } from './viewer';
import { TEMPORARY_PDF_ROUTE } from './config';

// The unguessable, single-use token grants access after the authenticated generation request.
@ApiExcludeController()
@Controller(TEMPORARY_PDF_ROUTE)
export class TemporaryPdfController {
  constructor(private readonly temporary: TemporaryPdfService) {}

  @Get(':token')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  @Header('Referrer-Policy', 'no-referrer')
  @Header('X-Content-Type-Options', 'nosniff')
  open(@Param('token') token: string, @Res({ passthrough: true }) response: Response): string {
    const delivery = this.temporary.open(token);
    response.once('finish', delivery.release);
    response.once('close', delivery.release);
    try {
      const nonce = randomBytes(16).toString('base64');
      response.setHeader(
        'Content-Security-Policy',
        `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; frame-src blob:; object-src blob:; base-uri 'none'; frame-ancestors 'none'`
      );
      return temporaryPdfViewer(delivery.contents, nonce, delivery.title);
    } catch (error) {
      delivery.release();
      throw error;
    }
  }
}
