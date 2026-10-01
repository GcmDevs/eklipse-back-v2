import { Module } from '@nestjs/common';
import { EstanciasProlongadasController } from './presentation/controllers';
import { EstanciaService } from './infraestructure/repositories';

@Module({
  controllers: [EstanciasProlongadasController],
  providers: [EstanciaService],
})
export class StaysModule {}
