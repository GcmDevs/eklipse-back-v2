import { Module } from '@nestjs/common';
import { DominiosController } from './presentation/controllers';
import { DominiosService } from './infraestructure/repositories';

@Module({
  controllers: [DominiosController],
  providers: [DominiosService],
})
export class DominioModule {}
