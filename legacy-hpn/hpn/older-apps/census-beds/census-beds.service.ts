import { Injectable } from '@nestjs/common';
import { CensusBedsRepository } from './repository';

@Injectable()
export class CensusBedsService {
  constructor(private CensusBedsRepository: CensusBedsRepository) {}

  async getCensoCamas(): Promise<any> {
    try {
      const data = await this.CensusBedsRepository.getCensusBeds();
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Camas',
        };
      } else {
        return {
          success: true,
          message: 'Censo de Camas.',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontraron Camas',
      };
    }
  }

  async getGroupCensoCamas(grupo: string): Promise<any> {
    try {
      const data = await this.CensusBedsRepository.getGroupCensusBeds(grupo);
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Camas',
        };
      } else {
        return {
          success: true,
          message: 'Censo de Camas.',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontraron Camas',
      };
    }
  }

  async getCamas(): Promise<any> {
    try {
      const data = await this.CensusBedsRepository.getBeds();
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Camas',
        };
      } else {
        return {
          success: true,
          message: 'Censo de Camas.',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontraron Camas',
      };
    }
  }

  async getAllCamas(): Promise<any> {
    try {
      const data = await this.CensusBedsRepository.getAllCamas();
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Camas',
        };
      } else {
        return {
          success: true,
          message: 'Todas las Camas.',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontraron Camas',
      };
    }
  }
}
