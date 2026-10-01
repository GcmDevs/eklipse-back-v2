import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CensusPatientsRepository } from './repository';
import { CensoPacientes } from './entity/censoPaciente.entity';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class CensusPatientsService extends BaseSource {
  constructor(
    private readonly censusPatientsRepository: CensusPatientsRepository,
    @Inject(REQUEST) _request: Request
  ) {
    super(_request);
  }

  async getPatients(): Promise<any> {
    try {
      const data = await this.censusPatientsRepository.getCensusPatients();
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Pacientes.',
        };
      } else {
        return {
          success: true,
          message: 'Pacientes.',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontraron Pacientes.',
      };
    }
  }

  async getPatientsForSubgroup(codArea: string): Promise<any> {
    try {
      const repo = this.conn.getRepository(CensoPacientes);
      const data = await repo.find({
        where: [{ fechaSalida: null }, { codArea }],
      });
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Pacientes.',
        };
      } else {
        return {
          success: true,
          message: 'Pacientes.',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontraron Pacientes.',
      };
    }
  }

  async getControlDesk(ingreso: string): Promise<any> {
    try {
      const data = this.censusPatientsRepository.controlDesk(ingreso);
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Pacinetes.',
        };
      } else {
        return {
          success: true,
          message: 'Pacinetes.',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontraron Pacientes.',
      };
    }
  }
}
