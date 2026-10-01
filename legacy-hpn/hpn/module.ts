import { Module } from '@nestjs/common';
import { OriImportsModule } from 'hpn/original-apps/ori-imports.module';
import { OldImportsModule } from 'hpn/older-apps/old-imports.module';

@Module({
  imports: [
    //
    OriImportsModule,
    OldImportsModule,
  ],
})
export class HpnModule {}
