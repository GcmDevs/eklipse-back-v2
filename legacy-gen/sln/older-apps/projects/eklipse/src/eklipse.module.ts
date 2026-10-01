import { Module } from '@nestjs/common';
import { EklipseController } from './eklipse.controller';
import { EklipseService } from './eklipse.service';

@Module({
  controllers: [EklipseController],
  providers: [EklipseService],
})
export class EklipseModule {}
