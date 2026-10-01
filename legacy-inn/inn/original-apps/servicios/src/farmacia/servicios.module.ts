import { Module } from '@nestjs/common';
import { ServiciosController } from './presentation/controllers';

@Module({
  controllers: [ServiciosController],
})
export class ServiciosModule {}
