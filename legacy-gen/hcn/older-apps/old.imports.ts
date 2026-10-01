import { Module } from '@nestjs/common';
import { RefactorizedModule } from '@hcn/rft/refactorized.module';

@Module({
  imports: [RefactorizedModule],
})
export class OldImportsModule {}
