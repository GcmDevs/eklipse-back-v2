import { Module } from '@nestjs/common';
import { CensusBedsController } from './census-beds.controller';
import { CensusBedsService } from './census-beds.service';
import { CensusBedsRepository } from './repository';

@Module({
  controllers: [CensusBedsController],
  providers: [CensusBedsService, CensusBedsRepository],
})
export class CensusBedsModule {}
