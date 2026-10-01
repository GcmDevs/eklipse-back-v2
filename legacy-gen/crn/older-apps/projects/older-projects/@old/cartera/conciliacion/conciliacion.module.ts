import { Module } from '@nestjs/common';
import { ConciliacionService } from './conciliacion.service';
import { ConciliacionController } from './conciliacion.controller';
import { ConciliacionRepository } from './repository';

@Module({
  providers: [ConciliacionService, ConciliacionRepository],
  controllers: [ConciliacionController],
})
export class ConciliacionModule {}
