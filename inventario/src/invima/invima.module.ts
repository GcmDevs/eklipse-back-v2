import { Module } from '@nestjs/common';
import { InvimaService } from './application/invima.service';
import { SocrataClient } from './infrastructure/socrata.client';
import { InvimaController } from './presentation/invima.controller';
import { InvimaDatabaseFilter } from './presentation/invima-database.filter';

@Module({
  controllers: [InvimaController],
  providers: [InvimaService, SocrataClient, InvimaDatabaseFilter],
})
export class InvimaModule {}
