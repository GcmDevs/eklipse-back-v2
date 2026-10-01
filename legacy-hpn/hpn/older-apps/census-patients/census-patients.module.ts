import { Module } from '@nestjs/common';
import { CensusPatientsController } from './census-patients.controller';
import { CensusPatientsService } from './census-patients.service';
import { CensusPatientsRepository } from './repository';

@Module({
  controllers: [CensusPatientsController],
  providers: [CensusPatientsService, CensusPatientsRepository],
})
export class CensusPatientsModule {}
