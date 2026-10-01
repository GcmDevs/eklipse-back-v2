import { Module } from '@nestjs/common';
import { RadicacionByCentroController } from './presentation/controllers';
import {
  AgregarSoportesRadicacionImpl,
  FetchRadPendByCentroImpl,
  VerificarSoportesRadicacionImpl,
} from './infrastructure/services';

@Module({
  controllers: [RadicacionByCentroController],
  providers: [
    FetchRadPendByCentroImpl,
    AgregarSoportesRadicacionImpl,
    VerificarSoportesRadicacionImpl,
  ],
})
export class RadicacionModule {}
