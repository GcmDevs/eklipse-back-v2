import { Module } from '@nestjs/common';
import { RefactorizedModule } from '@crn/rft/refactorized.module';

@Module({
  imports: [RefactorizedModule],
})
export class OldImportsModule {}
