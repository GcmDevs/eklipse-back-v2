import { Module } from '@nestjs/common';
import { SubgroupBedsService } from './subgroup-beds.service';
import { SubgroupBedsController } from './subgroup-beds.controller';
import { SubgroupsRepository } from './repository';

@Module({
  providers: [SubgroupBedsService, SubgroupsRepository],
  controllers: [SubgroupBedsController],
})
export class SubgroupBedsModule {}
