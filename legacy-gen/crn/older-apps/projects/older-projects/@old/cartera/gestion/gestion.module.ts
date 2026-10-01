import { Module } from '@nestjs/common';
import { GestionService } from './gestion.service';
import { GestionController } from './gestion.controller';
import { GestionRepository } from './repository';
import { ConciliacionModule } from '../conciliacion/conciliacion.module';
import { ConciliacionRepository } from '../conciliacion/repository';

@Module({
  imports: [ConciliacionModule],
  providers: [GestionService, GestionRepository, ConciliacionRepository],
  controllers: [GestionController],
})
export class GestionModule {}
