import { Module } from '@nestjs/common';
import { ObservacionesController } from './observaciones.controller';
import { ObservacionesService } from './observaciones.service';
import { ObservacionRepository } from './repository/observacion.repository';

@Module({
  controllers: [ObservacionesController],
  providers: [ObservacionesService, ObservacionRepository],
})
export class ObservacionesModule {}
