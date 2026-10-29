import { Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PreauditoriaService } from './application/preauditoria.service';
import { PreauditoriaController } from './presentation/preauditoria.controller';
import { RepositorioPre } from './infrastructure/repositorio';
import { PrefacturasPre } from './infrastructure/prefactura';
import { DocumentosPre } from './infrastructure/documentos';
import { conexionPre } from './infrastructure/conexion';

@Module({
  controllers: [PreauditoriaController],
  providers: [
    PreauditoriaService,
    {
      provide: RepositorioPre,
      scope: Scope.REQUEST,
      inject: [REQUEST],
      useFactory: (request: Request) => new RepositorioPre(conexionPre(request)),
    },
    PrefacturasPre,
    DocumentosPre,
  ],
})
export class PreauditoriaModule {}
