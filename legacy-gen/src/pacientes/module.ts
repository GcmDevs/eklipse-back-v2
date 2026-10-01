import { Module } from '@nestjs/common';
import { FetchPacientesController } from './presentation/controllers';
import { FetchPacientesImpl } from './infrastructure/services';

@Module({
  controllers: [FetchPacientesController],
  providers: [FetchPacientesImpl],
})
export class PacientesModule {}
