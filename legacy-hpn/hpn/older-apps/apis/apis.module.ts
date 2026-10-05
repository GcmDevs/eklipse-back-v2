import { Module } from '@nestjs/common';
import { RecordatorioCitasModule } from './recordatorio-citas/recordatorio-citas.module';

@Module({
  imports: [RecordatorioCitasModule],
})
export class ApisModule {}
