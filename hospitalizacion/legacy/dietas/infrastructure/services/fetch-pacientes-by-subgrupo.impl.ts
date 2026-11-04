import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DietasBaseSource } from '../sources';
import { ConsultaPacientesDietasService } from './consulta-pacientes-dietas.service';

@Injectable()
export class FetchPacientesBySubgrupoImpl extends DietasBaseSource {
  constructor(
    @Inject(REQUEST) request: Request,
    private readonly consulta: ConsultaPacientesDietasService
  ) {
    super(request);
  }

  public execute(centroId: number, horarioId: number, subgrupoCode: string, fecha: Date) {
    return this.consulta.execute(
      this.conn,
      this.auth.context,
      centroId,
      horarioId,
      subgrupoCode,
      fecha
    );
  }
}
