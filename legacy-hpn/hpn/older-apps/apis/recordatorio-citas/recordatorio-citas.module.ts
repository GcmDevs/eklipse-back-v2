import { Module } from '@nestjs/common';
import { RecordatorioCitasController } from './presentation/controllers/citas-medicas/recordatorio-citas.controller';
import { RecordatorioCitasImpl } from './infrastructure/services/recordatorio-citas.impl';

@Module({
  controllers: [RecordatorioCitasController],
  providers: [RecordatorioCitasImpl],
})
export class RecordatorioCitasModule {}
