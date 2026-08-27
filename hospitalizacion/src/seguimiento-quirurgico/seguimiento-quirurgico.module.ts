import { Module } from '@nestjs/common';
import { SeguimientoQuirurgicoController } from './presentation/seguimiento-quirurgico.controller';
import { SeguimientoQuirurgicoImpl } from './infraestructure/services/seguimiento-quirurgico.impl';
import { SeguimientoQuirurgicoGateway } from './presentation/seguimiento-quirurgico.gateway';
@Module({ controllers: [SeguimientoQuirurgicoController], providers: [SeguimientoQuirurgicoImpl, SeguimientoQuirurgicoGateway] })
export class SeguimientoQuirurgicoModule {}
