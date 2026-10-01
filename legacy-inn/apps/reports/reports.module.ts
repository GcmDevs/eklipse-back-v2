import { Module } from '@nestjs/common';
import { REPORTS_PROVIDERS } from './application';
import { REPORTS_INFRA_PROVIDERS } from './infrastructure';
import { REPORTS_CONTROLLERS } from './presentation/controllers';

@Module({
    controllers: REPORTS_CONTROLLERS,
    providers: [...REPORTS_PROVIDERS, ...REPORTS_INFRA_PROVIDERS],
})
export class ReportsModule { }
