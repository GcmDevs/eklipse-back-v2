import { Module } from '@nestjs/common';
import { InvimaService } from './application/invima.service';
import { SocrataClient } from './infrastructure/socrata.client';
import { InvimaController } from './presentation/invima.controller';
import { InvimaDatabaseFilter } from './presentation/invima-database.filter';
import { FacturasInvimaService } from './application/facturas.service';
import { FacturasInvimaController } from './presentation/facturas.controller';
import { PdfExtractorService } from './infrastructure/pdf-extractor.service';
import { InformeInvimaPdfService } from './infrastructure/informe-pdf.service';
import { PedidoExcelService } from './infrastructure/pedido-excel.service';

@Module({
  controllers: [InvimaController, FacturasInvimaController],
  providers: [
    InvimaService,
    SocrataClient,
    InvimaDatabaseFilter,
    FacturasInvimaService,
    PdfExtractorService,
    InformeInvimaPdfService,
    PedidoExcelService,
  ],
})
export class InvimaModule {}
